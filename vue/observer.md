# vue 响应式原理

## 组件入口

每一个组件实例生成之际，都会对`data`和`props`进行初始化数据监听。我们找到`Vue.prototype._init`这个方法，该方法为组件实例的统一入口：

``` js
// core/instance/init.js
// ... 省略代码
...

Vue.prototype._init = function (options?: Object) {
  const vm: Component = this

  // expose real self
  vm._self = vm
  initLifecycle(vm)
  initEvents(vm)
  initRender(vm)
  callHook(vm, 'beforeCreate')
  initInjections(vm) // resolve injections before data/props
  initState(vm) // 初始化 data/props
  initProvide(vm) // resolve provide after data/props
  callHook(vm, 'created')

  ...
  // 如果提供了el元素，将立即被挂载
  if (vm.$options.el) {
    vm.$mount(vm.$options.el)
  }
}

...
```

姑且省略部分代码，主要看`init`这个片段的代码。从此处我们可以额外知道为什么`beforeCreate`时拿不到`data`和`props`的数据，因为他们还没被初始化。同样也知道为什么`created`拿不到组件的DOM对象，因为在此之前组件还没被挂载渲染。OK，进入正题，`initState`:

``` js
// core/instance/state.js
export function initState (vm: Component) {
  vm._watchers = []
  const opts = vm.$options
  if (opts.props) initProps(vm, opts.props)
  if (opts.methods) initMethods(vm, opts.methods)
  if (opts.data) {
    initData(vm)
  } else {
    observe(vm._data = {}, true /* asRootData */)
  }
  if (opts.computed) initComputed(vm, opts.computed)
  if (opts.watch && opts.watch !== nativeWatch) {
    initWatch(vm, opts.watch)
  }
}
```

该方法依次初始化数据`props`->`methods`->`data`->`computed`->`watch`。我们先以`initData`为例看看`data`是如何被监听变化以更新视图的。

## initData

该方法将获取到`data`的数据挂载在`vm._data`上，之后通过迭代校验之后，将符合规范的`data`的属性代理在`vm`实例上，因为在组件内才可以使用`this.`直接访问`data`属性。当然最重要的还是最后的`observe`化`data`：

``` js
// core/instance/state.js
// ... 省略代码
function initData (vm: Component) {
  // 取出data
  let data = vm.$options.data
  data = vm._data = typeof data === 'function'
    ? getData(data, vm)
    : data || {}
  if (!isPlainObject(data)) {
    data = {}
    ...
  }
  // proxy data on instance
  const keys = Object.keys(data)
  const props = vm.$options.props
  const methods = vm.$options.methods
  let i = keys.length

  // 迭代data对象进行一些判断
  while (i--) {
    const key = keys[i]
    if (process.env.NODE_ENV !== 'production') {
      if (methods && hasOwn(methods, key)) {
        // warn此处判重methods
        ...
      }
    }
    if (props && hasOwn(props, key)) {
      // warn此处判重props
      ...
    } else if (!isReserved(key)) {
      // 非保留字，代理数据到vm实例上
      proxy(vm, `_data`, key)
    }
  }
  // observe data
  // 监听data
  observe(data, true /* asRootData */)
}
```

简单的看看`proxy`方法：

``` js
export function proxy (target: Object, sourceKey: string, key: string) {
  sharedPropertyDefinition.get = function proxyGetter () {
    return this[sourceKey][key]
  }
  sharedPropertyDefinition.set = function proxySetter (val) {
    this[sourceKey][key] = val
  }
  Object.defineProperty(target, key, sharedPropertyDefinition)
}
```

使用`Object.defineProperty`劫持`getter`和`setter`，老套路了，不多说。

## observe

``` js
// core/instance/index

export function observe (value: any, asRootData: ?boolean): Observer | void {
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  // 避免重复监听
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue
  ) {
    // 这里new一个监听器，该ob在Observer中的构造函数中赋值给value.__ob__
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}
```
