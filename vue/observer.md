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

姑且省略部分代码，主要看`init`这个片段的代码。从此处我们可以额外知道为什么`beforeCreate`时拿不到`data`和`props`的数据，因为他们还没被初始化。同样也知道为什么`created`拿不到组件的DOM对象，因为在此之前组件还没被挂载渲染。

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

该方法依次初始化数据`props`->`methods`->`data`->`computed`->`watch`。我们以`initData`为例看看`data`是如何被监听变化以更新视图的。

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
    // 挂载ob，此处def添加属性具备不可枚举性
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

那么接下来再来回顾看看vue是如何定义数组方法以达到数据响应的：

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
  // 覆盖
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

这里迭代`methodsToPatch`，将需要更改的数组方法在不污染原生方法的情况下显示挂载在`arrayMethods`上，达到视图更新的目的。同时收集可能新增的数组元素`observe`化。

`arrayKeys`获取的是`arrayMethods`可被枚举的属性值，即`methodsToPatch`的值。

``` js
// core/observer/index
const arrayKeys = Object.getOwnPropertyNames(arrayMethods)
```

由此vue通过更改数组的方法`push, pop, shift, unshift, splice, sort, reverse`来达到数组对这几个方法的更新响应的目的。

## defineReactive

``` js
// core/observer/index

export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep()

  const property = Object.getOwnPropertyDescriptor(obj, key)
  if (property && property.configurable === false) {
    return
  }

  // cater for pre-defined getter/setters
  // 取出预定义的getter/setter，劫持时中会使用
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  // 递归observe子对象，返回子对象的__ob__: Observer实例
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      // 取值
      const value = getter ? getter.call(obj) : val
      // 此时有watcher正在触发get，收集依赖
      if (Dep.target) {
        // watcher中存储该dep，之后dep中add sub存储 watcher
        dep.depend()
        // 如果有子对象，同上操作。即一个watcher中存有多个dep
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      // 相同值不予以触发
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 更新子对象的Observer实例
      childOb = !shallow && observe(newVal)
      // 通知订阅者发布更新
      dep.notify()
    }
  })
}
```

`Object.defineProperty`定义数据的`getter/setter`，在`watcher`条件下触发`getter`，将收集依赖`watcher`。触发`setter`时，订阅者通知响应更新。

## Dep

`Dep`是一个订阅者，它的实例由于闭包的特性，被每个`defineReactive`过的数据保存。即每一个响应式数据都有一个对应的`Dep`实例。如果该数据被某一个（当然不仅仅只有一个）`watcher`监听，则该数据的实例`dep`被该`watcher`保存，并且`dep`也会反向保存`watcher`，用以通知`watcher`触发响应更新回调。

``` js
// core/observer/dep

export default class Dep {
  static target: ?Watcher;
  id: number;
  subs: Array<Watcher>;

  constructor () {
    this.id = uid++
    this.subs = []
  }

  // 新增
  addSub (sub: Watcher) {
    this.subs.push(sub)
  }

  // 移除
  removeSub (sub: Watcher) {
    remove(this.subs, sub)
  }

  // 依赖收集，watcher和dep进行双向存储
  depend () {
    if (Dep.target) {
      Dep.target.addDep(this)
    }
  }

  // 通知更新
  notify () {
    // stabilize the subscriber list first
    const subs = this.subs.slice()
    if (process.env.NODE_ENV !== 'production' && !config.async) {
      // subs aren't sorted in scheduler if not running async
      // we need to sort them now to make sure they fire in correct
      // order
      subs.sort((a, b) => a.id - b.id)
    }
    for (let i = 0, l = subs.length; i < l; i++) {
      subs[i].update()
    }
  }
}

// The current target watcher being evaluated.
// This is globally unique because only one watcher
// can be evaluated at a time.
// 全局唯一的watcher实例，上文数据getter中收集依赖时使用
Dep.target = null
const targetStack = []

export function pushTarget (target: ?Watcher) {
  targetStack.push(target)
  Dep.target = target
}

export function popTarget () {
  targetStack.pop()
  Dep.target = targetStack[targetStack.length - 1]
}
```

## Watcher

监听者`Watcher`，用以数据发生改变后响应的回调

``` js
// core/observer/watcher
export default class Watcher {
  // ...
  constructor (
    vm: Component,
    expOrFn: string | Function,
    cb: Function,
    options?: ?Object,
    isRenderWatcher?: boolean
  ) {
    this.vm = vm
    if (isRenderWatcher) {
      vm._watcher = this
    }
    vm._watchers.push(this)
    // options
    if (options) {
      this.deep = !!options.deep
      this.user = !!options.user
      this.lazy = !!options.lazy
      this.sync = !!options.sync
      this.before = options.before
    } else {
      this.deep = this.user = this.lazy = this.sync = false
    }
    this.cb = cb
    this.id = ++uid // uid for batching
    this.active = true
    this.dirty = this.lazy // for lazy watchers
    this.deps = []
    this.newDeps = []
    this.depIds = new Set()
    this.newDepIds = new Set()
    this.expression = process.env.NODE_ENV !== 'production'
      ? expOrFn.toString()
      : ''
    // parse expression for getter
    if (typeof expOrFn === 'function') {
      this.getter = expOrFn
    } else {
      this.getter = parsePath(expOrFn)
      if (!this.getter) {
        this.getter = noop
        process.env.NODE_ENV !== 'production' && warn(
          `Failed watching path: "${expOrFn}" ` +
          'Watcher only accepts simple dot-delimited paths. ' +
          'For full control, use a function instead.',
          vm
        )
      }
    }
    this.value = this.lazy
      ? undefined
      : this.get()
  }

  /**
   * Evaluate the getter, and re-collect dependencies.
   */
  get () {
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      // 触发getter，收集依赖
      value = this.getter.call(vm, vm)
    } catch (e) {
      if (this.user) {
        handleError(e, vm, `getter for watcher "${this.expression}"`)
      } else {
        throw e
      }
    } finally {
      // "touch" every property so they are all tracked as
      // dependencies for deep watching
      if (this.deep) {
        traverse(value)
      }
      popTarget()
      this.cleanupDeps()
    }
    return value
  }

  /**
   * Add a dependency to this directive.
   */
  addDep (dep: Dep) {
    const id = dep.id
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        dep.addSub(this)
      }
    }
  }

  /**
   * Clean up for dependency collection.
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    let tmp = this.depIds
    this.depIds = this.newDepIds
    this.newDepIds = tmp
    this.newDepIds.clear()
    tmp = this.deps
    this.deps = this.newDeps
    this.newDeps = tmp
    this.newDeps.length = 0
  }

  /**
   * Subscriber interface.
   * Will be called when a dependency changes.
   */
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      this.run()
    } else {
      queueWatcher(this)
    }
  }

  /**
   * Scheduler job interface.
   * Will be called by the scheduler.
   */
  run () {
    if (this.active) {
      const value = this.get()
      if (
        value !== this.value ||
        // Deep watchers and watchers on Object/Arrays should fire even
        // when the value is the same, because the value may
        // have mutated.
        isObject(value) ||
        this.deep
      ) {
        // set new value
        const oldValue = this.value
        this.value = value
        if (this.user) {
          try {
            this.cb.call(this.vm, value, oldValue)
          } catch (e) {
            handleError(e, this.vm, `callback for watcher "${this.expression}"`)
          }
        } else {
          this.cb.call(this.vm, value, oldValue)
        }
      }
    }
  }

  /**
   * Evaluate the value of the watcher.
   * This only gets called for lazy watchers.
   */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   */
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   */
  teardown () {
    if (this.active) {
      // remove self from vm's watcher list
      // this is a somewhat expensive operation so we skip it
      // if the vm is being destroyed.
      if (!this.vm._isBeingDestroyed) {
        remove(this.vm._watchers, this)
      }
      let i = this.deps.length
      while (i--) {
        this.deps[i].removeSub(this)
      }
      this.active = false
    }
  }
}
```

如果此时是`watcher`触发，则该`watcher`中将存储一份该数据中的订阅者`dep`。一个数据对应一个闭包`dep`。
`dep`也将存储该`watcher`，当然是可以进行多个存储。待`setter`执行，则通过`dep`通知`watcher`进行数据响应执行回调（该回调的可能性包括1. 视图更新，2. 自定义watch）。

一个 变量 对应一个dep， dep可订阅多个watcher。变量setter，通过dep去通知这些watcher触发回调

一个watcher中有多个dep，或者说一个watcher可以监视多个变量做同样的动作。待watcher卸载，会把dep中存储的也相应删除
watcher生成时，会触发对于数据的getter以达到和dep互相收集彼此的结果。
