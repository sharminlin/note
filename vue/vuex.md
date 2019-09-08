# vuex 源码阅读手记
一篇关于vuex源码的浅薄的梳理。

## 前言
官方介绍：
>Vuex 是一个专为 Vue.js 应用程序开发的状态管理模式。它采用集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以一种可预测的方式发生变化。

总而言之，vuex是一个基于vue的状态管理**插件**。这个插件如何使用，不在此篇文章考虑范围。有意者可移步[vuex官方文档](https://vuex.vuejs.org/zh/)。

## 注入
在install安装好依赖之后，我们都会执行`Vue.use(Vuex)`。`Vue.use()`是vue注册插件的api，先看看`vue`中的源码：
``` js
function initUse (Vue) {
  Vue.use = function (plugin) {
    var installedPlugins = (this._installedPlugins || (this._installedPlugins = []));

    // 已存在则不再注册
    if (installedPlugins.indexOf(plugin) > -1) {
      return this
    }

    // 将Vue构造器传入其中
    var args = toArray(arguments, 1);
    args.unshift(this);

    // 执行install方法
    if (typeof plugin.install === 'function') {
      plugin.install.apply(plugin, args);
    } else if (typeof plugin === 'function') {
      plugin.apply(null, args);
    }
    installedPlugins.push(plugin);
    return this
  };
}
```

可以观察到该方法接受一个选项参数（`plugin`）。该参数可取类型为`Object | Function`。当为Object时，必须提供一个名为`install`的方法。`install`在use时会被立即执行，获得一个`Vue`构造器和一个选项对象。下面是官网的一个`install`方法使用介绍：

``` js
// install
function install (Vue, options) {
  // 1. 添加全局方法或属性
  Vue.myGlobalMethod = function () {}

  // 2. 添加全局资源
  Vue.directive('my-directive', {
    bind (el, binding, vnode, oldVnode) {}
    ...
  })

  // 3. 注入组件选项
  Vue.mixin({
    created: function () {}
    ...
  })

  // 4. 添加实例方法
  Vue.prototype.$myMethod = function (methodOptions) {}
}
```

基于此，我们先看看在`vuex`的入口文件中，返回了什么。

``` js
// ./index.js
import { Store, install } from './store'
import { mapState, mapMutations, mapGetters, mapActions, createNamespacedHelpers } from './helpers'

export default {
  Store,
  install,
  version: '__VERSION__',
  mapState,
  mapMutations,
  mapGetters,
  mapActions,
  createNamespacedHelpers
}
```

不出所料，该文件返回了一个对象，相信这个对象中的所有关键字都是老面孔了，我们在后面会详细的介绍他们。接下来我们进入正题，看看`vuex`的`install`。

``` js
// ./store.js
// ...
export function install (_Vue) {
  if (Vue && _Vue === Vue) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(
        '[vuex] already installed. Vue.use(Vuex) should be called only once.'
      )
    }
    return
  }
  Vue = _Vue
  applyMixin(Vue)
}
```

该函数接收了`Vue`的构造器命名为`_Vue`，并且保留起来进行注册重复之校验，再执行`applyMixin(Vue)`。那么`applyMixin`又干了什么。

``` js
// ./mixin.js
export default function (Vue) {
  const version = Number(Vue.version.split('.')[0])

  if (version >= 2) {
    Vue.mixin({ beforeCreate: vuexInit })
  } else {
    // override init and inject vuex init procedure
    // for 1.x backwards compatibility.
    const _init = Vue.prototype._init
    Vue.prototype._init = function (options = {}) {
      options.init = options.init
        ? [vuexInit].concat(options.init)
        : vuexInit
      _init.call(this, options)
    }
  }

  /**
   * Vuex init hook, injected into each instances init hooks list.
   */

  function vuexInit () {
    const options = this.$options
    // store injection
    if (options.store) {
      this.$store = typeof options.store === 'function'
        ? options.store()
        : options.store
    } else if (options.parent && options.parent.$store) {
      this.$store = options.parent.$store
    }
  }
}
```

这是一个公共的mixin方法，做了一个全局的混入。主要就是在组件实例创建之后，将`$store`挂载到组件实例上，因此我们平时在组件内部可以直接使用`this.$store`来访问`store`。那么这其中的`this.options.store`是从哪儿来的呢？我们想想通常时如何加载`vuex`的。如下：

``` js
// main.js
import Vue from 'vue'
import Vuex from 'vuex' 
import App from './App'

Vue.use(Vuex)

const store =  new Vuex.Store({
  // ...
})

new Vue({
  el: '#app',
  store,
  components: { App },
  template: '<App />'
})
```

可以看到，根组件实例上挂载了一个`store`，这就是所有子组件的`store`的由来。整个注入过程，说起来是那么冗长，但其实非常简单。 <br />
接下来，我们去看看`soter`的构造器`Vuex.Store`的具体实现。

## new Vuex.Store()
Store的代码不适合单独抽离出来说明，因此一部分解释我会放在代码里面，相信这样比对代码，会更清晰一点。同时我会省略一部分无关紧要的代码，尽量不影响阅读。

### constructor
``` js
// ./store.js
// ...

let Vue

export class Store {
  constructor (options = {}) {
    // 上述声明了一个Vue变量，这个变量install方法中会被赋值，此处避免在生成store实例时没有事先注册
    if (!Vue && typeof window !== 'undefined' && window.Vue) {
      install(window.Vue)
    }

    // ...

    // 取出插件选项以及严格模式默认`false`
    const {
      plugins = [],
      strict = false
    } = options

    // 声名一大堆私有属性
    this._committing = false
    this._actions = Object.create(null)
    this._actionSubscribers = []
    this._mutations = Object.create(null)
    this._wrappedGetters = Object.create(null)
    this._modules = new ModuleCollection(options)
    this._modulesNamespaceMap = Object.create(null)
    this._subscribers = []
    this._watcherVM = new Vue()

    // 确保方法 dispatch 和 commit 内部 this 指向 store 
    const store = this
    const { dispatch, commit } = this // 解构

    // 重定义方法 dispatch 和 commit
    this.dispatch = function boundDispatch (type, payload) {
      return dispatch.call(store, type, payload) // 使用call绑定this
    }

    this.commit = function boundCommit (type, payload, options) {
      return commit.call(store, type, payload, options) // 使用call绑定this
    }

    // 严格模式
    this.strict = strict

    // 获取根部state状态
    const state = this._modules.root.state

    // 初始化module以及子项module
    installModule(this, state, [], this._modules.root)

    // 设置 store._vm
    resetStoreVM(this, state)

    // 执行插件
    plugins.forEach(plugin => plugin(this))

    // 是否使用vue-devtools调试工具，Vue.config.devtools默认在开发环境为true
    const useDevtools = options.devtools !== undefined ? options.devtools : Vue.config.devtools
    if (useDevtools) {
      devtoolPlugin(this)
    }
  }
}
```

`constructor`方法做了一系列的初始化处理，我们大致知道了它究竟做了什么，但并不知道为什么要这样做。OK，我们接下来就一步一步去深入了解其中的机理。

### ModuleCollection
`ModuleCollection`构造器目的是将传入的`options`整合成需要的数据结构。

``` js
// ./module/module-collection.js

// ...

constructor (rawRootModule) {
  // register root module (Vuex.Store options)
  this.register([], rawRootModule, false)
},

// ...

register (path, rawModule, runtime = true) {
  if (process.env.NODE_ENV !== 'production') {
    // 断言方法，校验原始数据的格式
    assertRawModule(path, rawModule)
  }

  // 生成 root module 或者 _child module
  const newModule = new Module(rawModule, runtime)
  if (path.length === 0) {
    this.root = newModule
  } else {
    const parent = this.get(path.slice(0, -1))
    parent.addChild(path[path.length - 1], newModule)
  }

  // 递归生成child modules
  if (rawModule.modules) {
    // key 为module name
    forEachValue(rawModule.modules, (rawChildModule, key) => {
      this.register(path.concat(key), rawChildModule, runtime)
    })
  }
}

// ...
```

在`register`中又出现了一个陌生的构造器`Module`，它实质性地改变了`store`的数据结构。注册之后生成的`_modules`的每一个节点都是Module实例，如下：

``` ts
// 具体可见./module/module.js
_modules.root = {
  state: {},
  _rawModule: {}, // 当前层级的原始数据
  _children: {}, // 子结构
  __prop__: {
    namespaced,
    addChild,
    removeChild,
    getChild,
    update,
    forEachChild,
    forEachGetter,
    forEachAction,
    forEachMutation
  }
}
```

### installModule
``` js
installModule(this, state, [], this._modules.root)
```
再次回到`Store`的构造函数中，往下执行了`installModule`，顾名思义，初始化module。那么它和上面的`new ModuleCollection()`有什么区别与关系呢？
``` js
// ./store.js

// ...
/*
 * @param store 上下文
 * @param rootState 根节点state
 * @param path {Array} 由moduleName组成的链式路径数组
 * @param module 当前你层级
 * @param hot 是否热更新
 */
function installModule (store, rootState, path, module, hot) {
  // path为空表示是根节点
  const isRoot = !path.length

  // 获取当前节点命名空间 getNamespace是Module的一个方法
  const namespace = store._modules.getNamespace(path)

  // register in namespace map
  if (module.namespaced) {
    // 判重
    if (store._modulesNamespaceMap[namespace] && process.env.NODE_ENV !== 'production') {
      console.error(`[vuex] duplicate namespace ${namespace} for the namespaced module ${path.join('/')}`)
    }

    // _modulesNamespaceMap 根据命名空间值控制存储当前节点值
    store._modulesNamespaceMap[namespace] = module
  }

  // 设置非根节点的state，调用形式rootState.moduleName[key]的由来
  if (!isRoot && !hot) {
    const parentState = getNestedState(rootState, path.slice(0, -1))
    const moduleName = path[path.length - 1]
    store._withCommit(() => {
      Vue.set(parentState, moduleName, module.state)
    })
  }

  // 声明当前节点上下文，保证本身的mutations actions 以及getter在使用时，传入局部state对象
  const local = module.context = makeLocalContext(store, namespace, path)

  // 注册当前节点的mutations至store._mutations
  module.forEachMutation((mutation, key) => {
    const namespacedType = namespace + key

    // mutation = (payload) => (state, payload) => {}
    registerMutation(store, namespacedType, mutation, local)
  })

  // 注册当前节点的actions至store._actions
  module.forEachAction((action, key) => {
    // action: Object | function
    const type = action.root ? key : namespace + key
    const handler = action.handler || action

    // action = (payload, cb) => ({ dispatch, commit, getters, state, rootGetters. rootState }, payload, cb) => {}
    registerAction(store, type, handler, local)
  })

  // 注册当前节点的getter至store._wrappedGetters
  module.forEachGetter((getter, key) => {
    const namespacedType = namespace + key

    // getter = (store) => (localState, localGetters, rootState, rootGetters) => {}
    registerGetter(store, namespacedType, getter, local)
  })

  // 递归install
  module.forEachChild((child, key) => {
    installModule(store, rootState, path.concat(key), child, hot)
  })
}

// ...

```

在`installModule`中，除了知道了各自节点的`state`的初始化，我们也明白了`_mutations`、`_actions`和`_wrappedGetters`、`_modulesNamespaceMap`的由来与作用。至于其中各自的`register`函数，就不贴在这儿占用空间了。详细的可以对照源码进行阅读。

### resetStoreVM
``` js
function resetStoreVM (store, state, hot) {
  const oldVm = store._vm

  // bind store public getters
  store.getters = {}
  const wrappedGetters = store._wrappedGetters
  const computed = {}
  forEachValue(wrappedGetters, (fn, key) => {
    // use computed to leverage its lazy-caching mechanism
    // direct inline function use will lead to closure preserving oldVm.
    // using partial to return function with only arguments preserved in closure enviroment.
    computed[key] = partial(fn, store)
    Object.defineProperty(store.getters, key, {
      get: () => store._vm[key],
      enumerable: true // for local getters
    })
  })

  // use a Vue instance to store the state tree
  // suppress warnings just in case the user has added
  // some funky global mixins
  const silent = Vue.config.silent
  Vue.config.silent = true
  store._vm = new Vue({
    data: {
      $$state: state
    },
    computed
  })
  Vue.config.silent = silent

  // 严格模式下，监听_vm._data.$$state改变，如果非commit引起，将抛出错误
  if (store.strict) {
    enableStrictMode(store)
  }

  // 销毁释放上一个_vm
  if (oldVm) {
    if (hot) {
      // dispatch changes in all subscribed watchers
      // to force getter re-evaluation for hot reloading.
      store._withCommit(() => {
        oldVm._data.$$state = null
      })
    }
    Vue.nextTick(() => oldVm.$destroy())
  }
}
```

该方法给`store`新增了一个属性`_vm`指向一个`Vue`实例，包含一个`$$state`数据存储状态树；将上文我们所提到的`_wrappedGetters`存储的getter转化成`computed`。在此同时，设置`store.getter`的getter，取值`_vm.computed`。<br>
store的构造函数的流程基本完毕，接下来，我们去看看常用的两个方法的实现`commit`、`dispatch`

## commit
``` js
// ./store.js

/*
 * @param _type {String | Object} commit名
 * @param _payload {Any}
 * @param _options 选项
 */
commit (_type, _payload, _options) {
  // check object-style commit
  const {
    type,
    payload,
    options
  } = unifyObjectStyle(_type, _payload, _options)

  const mutation = { type, payload }
  const entry = this._mutations[type]
  if (!entry) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[vuex] unknown mutation type: ${type}`)
    }
    return
  }

  // 执行handler
  this._withCommit(() => {
    entry.forEach(function commitIterator (handler) {
      handler(payload)
    })
  })

  // 触发订阅者
  this._subscribers.forEach(sub => sub(mutation, this.state))

  if (
    process.env.NODE_ENV !== 'production' &&
    options && options.silent
  ) {
    console.warn(
      `[vuex] mutation type: ${type}. Silent option has been removed. ` +
      'Use the filter functionality in the vue-devtools'
    )
  }
}
```

在一开始出现了一个陌生方法`unifyObjectStyle`，先看看其实现：

``` js
function unifyObjectStyle (type, payload, options) {
  if (isObject(type) && type.type) {
    options = payload
    payload = type
    type = type.type
  }

  if (process.env.NODE_ENV !== 'production') {
    assert(typeof type === 'string', `expects string as the type, but found ${typeof type}.`)
  }

  return { type, payload, options }
}
```

判断`type`是否是`Object`。因此通常我们调用`commit`时，传值`this.$store.commit(type, payload, options)`，同样，也可以使用`this.$store.commit({ type, payload, options })`的方式。<br>



## dispatch
``` js
 dispatch (_type, _payload) {
  // check object-style dispatch
  const {
    type,
    payload
  } = unifyObjectStyle(_type, _payload)

  const action = { type, payload }
  const entry = this._actions[type]
  if (!entry) {
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[vuex] unknown action type: ${type}`)
    }
    return
  }

  // 触发订阅者，执行before方法
  try {
    this._actionSubscribers
      .filter(sub => sub.before)
      .forEach(sub => sub.before(action, this.state))
  } catch (e) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[vuex] error in before action subscribers: `)
      console.error(e)
    }
  }

  // 多个action发生异步？
  const result = entry.length > 1
    ? Promise.all(entry.map(handler => handler(payload)))
    : entry[0](payload)

  // 执行订阅者after方法
  return result.then(res => {
    try {
      this._actionSubscribers
        .filter(sub => sub.after)
        .forEach(sub => sub.after(action, this.state))
    } catch (e) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[vuex] error in after action subscribers: `)
        console.error(e)
      }
    }
    return res
  })
}
```

看玩之后，其实发现非常简单。我便不再赘述了。
