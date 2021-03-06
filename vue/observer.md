# vue 响应式原理

交个作业。

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

该方法将获取到`data`的数据挂载在`vm._data`上，之后通过迭代校验之后，将符合规范的`data`的属性代理在`vm`实例上，因此在组件内才可以使用`this.`直接访问`data`属性。当然最重要的还是最后的`observe`化`data`：

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
2. `defineReactive`劫持对象类型`value`的`getter`和`setter`以收集依赖和触发更新。

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

### defineReactive

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

  // 依赖收集入口，watcher和dep进行双向存储
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
// 全局唯一的watcher实例，watcher收集依赖时会使用
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

观察者`Watcher`，每一个实例`watcher`被依赖收集后，将存储于相关响应式数据的`dep`中，在数据触发`setter`时，会被`dep`通知派发更新执行回调。

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
    // 渲染wahtcher
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
    // 解析获取监听对象的getter
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
   * 获取value值，并收集依赖
   */
  get () {
    // 设置全局唯一值Dep.target = this
    pushTarget(this)
    let value
    const vm = this.vm
    try {
      // 触发getter，获取值同时收集依赖
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
      // 如果是深度监听，则递归追踪该对象的所有已被observe的属性，触发它们的getter，收集对应依赖
      // 即此时的watcher存储于每一个监听对象的dep中，而该watcher也存储了每一个对象的dep
      if (this.deep) {
        traverse(value)
      }
      // 依赖关联完毕，清掉Dep.target
      popTarget()
      this.cleanupDeps()
    }
    return value
  }

  /**
   * Add a dependency to this directive.
   */
  // 依赖收集，会在数据getter中，dep.depend()中调用执行
  addDep (dep: Dep) {
    const id = dep.id
    // 存储新收集到的depId，和dep
    if (!this.newDepIds.has(id)) {
      this.newDepIds.add(id)
      this.newDeps.push(dep)
      if (!this.depIds.has(id)) {
        // 反向关联，dep中订阅该watcher
        dep.addSub(this)
      }
    }
  }

  /**
   * Clean up for dependency collection.
   * 一次依赖收集完毕后执行，清除旧的依赖项
   */
  cleanupDeps () {
    let i = this.deps.length
    while (i--) {
      const dep = this.deps[i]
      // 不存在的旧的依赖进行取消订阅
      if (!this.newDepIds.has(dep.id)) {
        dep.removeSub(this)
      }
    }
    // 新的覆盖旧的
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
   * 数据setter触发对应dep中的订阅项subs进行派发更新
   */
  update () {
    /* istanbul ignore else */
    if (this.lazy) {
      this.dirty = true
    } else if (this.sync) {
      // 同步触发
      this.run()
    } else {
      // 推送至观察者队列，统一触发
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
        // 前后值可能相同，但对于对象/数组属性或者deep监听而言，可能属性值发生了改变
        isObject(value) ||
        this.deep
      ) {
        // set new value
        // 触发监听回调（回调有两种，1. 渲染回调 2. 用户自定义回调）
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
   * 计算监听对象值，此时重新收集了一次回调
   */
  evaluate () {
    this.value = this.get()
    this.dirty = false
  }

  /**
   * Depend on all deps collected by this watcher.
   * 关联该watcher的所有依赖
   */
  depend () {
    let i = this.deps.length
    while (i--) {
      this.deps[i].depend()
    }
  }

  /**
   * Remove self from all dependencies' subscriber list.
   * 从所有依赖的订阅列表中移除自己
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

## scheduler

调度队列执行操作。`queueWatcher`方法用于维护待执行的`watcher`队列的入队和执行入口。

``` js
//  core/observer/scheduler
export function queueWatcher (watcher: Watcher) {
  const id = watcher.id
  // 判重标志
  if (has[id] == null) {
    has[id] = true
    // 如果未在执行队列，则入队
    if (!flushing) {
      queue.push(watcher)
    } else {
      // if already flushing, splice the watcher based on its id
      // if already past its id, it will be run next immediately.
      // 如果正在执行flushSchedulerQueue，则插入队列中，队列按watcher id升序
      let i = queue.length - 1
      while (i > index && queue[i].id > watcher.id) {
        i--
      }
      queue.splice(i + 1, 0, watcher)
    }
    // queue the flush
    // 执行中标志
    if (!waiting) {
      waiting = true
      if (process.env.NODE_ENV !== 'production' && !config.async) {
        flushSchedulerQueue()
        return
      }
      // 执行队列，放入nextTick，确保数据完全更新后执行视图渲染
      nextTick(flushSchedulerQueue)
    }
  }
}
```

队列执行中，除了`watcher`会`run`一下，相关组件还会触发`updated hook`和激活组件`activated hook`

``` js
/**
 * Flush both queues and run the watchers.
 */
function flushSchedulerQueue () {
  currentFlushTimestamp = getNow()
  flushing = true
  let watcher, id

  // 排个序。
  // 1. 因为组件更新是从父到子的过程。
  // 2. 用户定义的watch优先于组件渲染。
  // 3. 如果组件在其父组件正在执行watcher时被销毁了，则可以跳过这个组件存储的watchers
  queue.sort((a, b) => a.id - b.id)

  // 不缓存长度，因为在执行过程中，长度可能发生变化
  for (index = 0; index < queue.length; index++) {
    watcher = queue[index]
    // 执行beforeUpdate
    if (watcher.before) {
      watcher.before()
    }
    id = watcher.id
    has[id] = null
    // 调度执行回调
    watcher.run()
    // 提醒避免陷入死循环，比如在watch中更改自身值
    if (process.env.NODE_ENV !== 'production' && has[id] != null) {
      circular[id] = (circular[id] || 0) + 1
      if (circular[id] > MAX_UPDATE_COUNT) {
        warn(
          'You may have an infinite update loop ' + (
            watcher.user
              ? `in watcher with expression "${watcher.expression}"`
              : `in a component render function.`
          ),
          watcher.vm
        )
        break
      }
    }
  }

  // 保存通过keep-alive的激活的组件副本，用于之后的hook调用
  const activatedQueue = activatedChildren.slice()
  // 队列副本，用于之后取出watcher对应组件实例，调用其update hook
  const updatedQueue = queue.slice()

  // 重置调度状态
  // 包括队列长度，执行标志等
  resetSchedulerState()

  // 执行组件activated 和 updated hook
  callActivatedHooks(activatedQueue)
  callUpdatedHooks(updatedQueue)

  // devtool hook
  /* istanbul ignore if */
  if (devtools && config.devtools) {
    devtools.emit('flush')
  }
}
```

## 总结要点

1. 组件生成时，会对数据进行递归`observe`，这过程会生成一个`Observer`实例挂载在响应式数据上
2. 一个响应式数据对应唯一一个`Dep`（订阅者）实例，在`defineReactive`时通过闭包产生
3. 如果一个响应式变量的`getter`是由观察者`watcher`触发，则该`watcher`将存储该数据的`dep`，`dep`中也将订阅该`watcher`
4. 一个响应式变量对应一个`dep`，`dep`可订阅多个`watcher`。数据触发`setter`，通过`dep`去通知这些`watcher`触发回调。回调分为视图渲染和开发者自定义watch
5. 一个watcher中有多个dep，或者说一个watcher可以监视多个变量做同样的动作（比如视图渲染）。待watcher卸载，会把dep中存储的也相应删除

以上。
