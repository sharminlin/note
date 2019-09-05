# vuex 源码阅读手记
一篇关于vuex源码的浅薄的梳理。

## 前言
官方介绍：
>Vuex 是一个专为 Vue.js 应用程序开发的状态管理模式。它采用集中式存储管理应用的所有组件的状态，并以相应的规则保证状态以一种可预测的方式发生变化。

总而言之，vuex是一个基于vue的状态管理**插件**。这个插件如何使用，不在此篇文章考虑范围。有意者可移步[vuex官方文档](https://vuex.vuejs.org/zh/)。

## 注入
在install安装好依赖之后，我们都会执行`Vue.use(Vuex)`。`Vue.use()`是vue注册插件的api，接受一个选项参数（`plugin`）。该参数可取类型为Object或者Function。当为对象时，必须提供一个名为`install`的函数；如果为函数，则该函数即为`install`。`install`在use时会被立即执行，获得一个`Vue`构造器和一个选项对象。下面是官网的一个`install`函数介绍，`vuex`不免也是基于此。

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
我们先看看在`vuex`的入口文件中，返回了什么。
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

该函数接收了`Vue`的构造器命名为`_Vue`，并且保留起来进行注册重复之校验，再执行`applyMixin(Vue)`。那么我们看看`applyMixin`又干了什么。

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

这是一个公共的mixin方法，做了一个全局的混入。主要就是在组件实例创建之后，将`$store`挂载到组件实例上，因此我们平时在组件内部可以直接使用`this.$store`来访问`store`。那么这其中的`this.options.store`是从哪儿来的呢？通常，在使用`vuex`的时候我们会将其注入到根组件中，如下：

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

## State

## Getter

## Mutation

## Action

## Module

## Plugin
