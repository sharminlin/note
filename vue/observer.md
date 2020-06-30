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
// core/instance/state
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
// core/observer/index
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
    // 组件根数据成功ob，计数+1
    ob.vmCount++
  }
  return ob
}
```

把这个方法看作`Observer`化的前置方法，最后返回一个`Observer`实例。这个实例如果存在，则会挂载在`value.__ob__`上，便于之后使用。

## Observer

``` js
// core/observer/index
/**
 * Observer class that is attached to each observed
 * object. Once attached, the observer converts the target
 * object's property keys into getter/setters that
 * collect dependencies and dispatch updates.
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    // new 一个订阅者
    this.dep = new Dep()
    // 初始化计数
    this.vmCount = 0
    // 挂载ob
    def(value, '__ob__', this)
    // 数组方法的劫持
    if (Array.isArray(value)) {
      // 可以访问原型？挂载在原型上，否则挂载到对象本身上
      if (hasProto) {
        protoAugment(value, arrayMethods)
      } else {
        copyAugment(value, arrayMethods, arrayKeys)
      }
      // 循坏observe数组元素
      this.observeArray(value)
    } else {
      // 实际的reactive化，value必须是对象
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    // 迭代对象reactive化
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}
```
提取两点作为该方法的重要动作：
1. `Observer`中重定义了数组方法
2. 劫持对象类型`value`的`getter`和`setter`以收集依赖和触发更新

### Array

对于数组的更新检测，官方有提示：

> Vue 不能检测以下数组的变动：
> 1. 当你利用索引直接设置一个数组项时，例如：vm.items[indexOfItem] = newValue
> 2. 当你修改数组的长度时，例如：vm.items.length = newLength

对于这两点疑问，其实不难理解：

刚才已经提及了，对于数组类型，将会循环`observe`数组元素，但请注意，此处`observe`的是数组元素本身，而不是数组索引。因此`vue`没有收集`array[index]`的依赖，同样也无法触发更新。那么为什么呢？究其原因我理解为数组的索引长度是不可预知的，而`length`属性也是自动可变的。

> 性能代价和获得的用户体验收益不成正比。

那么接下来再来回顾看看vue是如何定义数组的部分方法以达到数据响应的：

``` js
// core/observer/index

...

// Observer 的 constructor中
// 环境可以访问原型__proto__属性？挂载在原型上，否则挂载到对象本身上
if (hasProto) {
  protoAugment(value, arrayMethods)
} else {
  copyAugment(value, arrayMethods, arrayKeys)
}

...
// 这里直接将arrayMethods挂载在__proto__上
function protoAugment (target, src: Object) {
  target.__proto__ = src
}
// 这里迭代arrayKeys将arrayMethods包含的方法丢到target上
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}
```

重点是`arrayMethods`和`arrayKeys`是什么。

``` js
// core/observer/array
const arrayProto = Array.prototype
export const arrayMethods = Object.create(arrayProto)

// 这些方法将被劫持，以达到订阅更新的目的
const methodsToPatch = [
  'push',
  'pop',
  'shift',
  'unshift',
  'splice',
  'sort',
  'reverse'
]

methodsToPatch.forEach(function (method) {
  // cache original method
  // 保留原生的数组方法
  const original = arrayProto[method]
  def(arrayMethods, method, function mutator (...args) {
    // 更新数据
    const result = original.apply(this, args)
    const ob = this.__ob__
    // 获取新的插入值，observe化
    let inserted
    switch (method) {
      case 'push':
      case 'unshift':
        inserted = args
        break
      case 'splice':
        inserted = args.slice(2)
        break
    }
    if (inserted) ob.observeArray(inserted)
    // notify change 通知更新视图
    ob.dep.notify()
    return result
  })
})
```

``` js
// core/observer/index
const arrayKeys = Object.getOwnPropertyNames(arrayMethods)
```

`arrayMethods`通过`Object.create(arrayProto)`创建，因此可以在不污染原生方法的情况下修改对应的数组方法。`arrayKeys`获取的则是被显示添加到`arrayMethods`上可被枚举的属性，即`methodsToPatch`的值。
