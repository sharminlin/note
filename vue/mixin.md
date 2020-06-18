# 探索 vue mixin

vue混入方案mixin，借助该方法我们可以实现组件的逻辑复用，精简代码。一个`mixin`对象包含vue实例的所有组件选项，并且各个选项将按照一定的规则进行合并。

如果对该方法不甚了解的伙伴，可以先移步 [vuex官方文档-混入](https://cn.vuejs.org/v2/guide/mixins.html) 进行学习。本文仅只作为官方的文档的扩展，意图对`mixins`这个概念做一次深入理解。闲话不多说，我们先看全局混入方法`mixin`：

## 全局混入 Vue.mixin

``` js
// core/global-api/mixin.js

import { mergeOptions } from '../util/index'

export function initMixin (Vue: GlobalAPI) {
  Vue.mixin = function (mixin: Object) {
    this.options = mergeOptions(this.options, mixin)
    return this
  }
}
```

无需惊讶，代码的确如此简短。内部仅作`mergeOptions`的一次调用。`this.options`指的是全局挂载在构造函数`Vue`上的选项，包括`mixins`、`components`、`filters`、`directives`等等。这些全局选项将在创建vue实例时并入组件选项中，在并入时，其实依然是调用的`mergeOptions`方法。

``` js
//core/instance/init.js
export function initMixin (Vue: Class<Component>) {
  Vue.prototype._init = function (options?: Object) {
    const vm: Component = this

    ...

    // 该方法将合并选项的同时，规则化组件选项
    vm.$options = mergeOptions(
      // 此处vm为Vue的实例，其constructor指向Vue
      // 该方法，取出Vue.options上的选项值
      resolveConstructorOptions(vm.constructor),
      options || {},
      vm
    )

    ...
  }
}
```

进入重点，`mergeOptions`：

## 选项合并 mergeOptions

``` js
// core/util/options
// ... 省略部分代码
export function mergeOptions (
  parent: Object,
  child: Object,
  vm?: Component
): Object {
  
  ...
  // 优先递归合并extends
  if (child.extends) {
    parent = mergeOptions(parent, child.extends, vm)
  }
  // 再递归合并mixins
  if (child.mixins) {
    for (let i = 0, l = child.mixins.length; i < l; i++) {
      parent = mergeOptions(parent, child.mixins[i], vm)
    }
  }

  ...
  
  // 最终的options值
  const options = {}
  let key
  // 首先将parent中的选项通过strat存储的key对应合并规则，加入到options中
  // 注意：mergeField方法将合并parent[key]、child[key]
  for (key in parent) {
    mergeField(key)
  }
  for (key in child) {
    // 此处避免child[key]重复合并
    if (!hasOwn(parent, key)) {
      mergeField(key)
    }
  }
  function mergeField (key) {
    const strat = strats[key] || defaultStrat
    options[key] = strat(parent[key], child[key], vm, key)
  }
  return options
}
```

## 合并规则 strats

上文反复强调合并规则，那么strats挂载的规则究竟是哪些呢？相信稍微了解mixins的同学都知道混入中，同名钩子函数如`created`将合并为一个数组，因此都将被调用。另外，混入对象的钩子将在组件自身钩子之前调用。`data`、`methods` 此类值为对象的选项，键值发生冲突时，以组件优先。

### defaultStrat

在`mergeField`方法中会看到一个默认的`strat`值：`defaultStrat`。该方法优先取值`childVal`，若不存在，则取`parentVal`。这正是我们通常所说的组件优先的原则。

``` js
// core/util/options
const defaultStrat = function (parentVal: any, childVal: any): any {
  return childVal === undefined
    ? parentVal
    : childVal
}
```

### data

`data`选项采用组件优先的合并原则。但是在此同时，对于引用类型的数据，进行了深拷贝的优先策略。

``` js
// core/util/options

strats.data = function (
  parentVal: any,
  childVal: any,
  vm?: Component
): ?Function {
  if (!vm) {
    ...
    return mergeDataOrFn(parentVal, childVal)
  }

  return mergeDataOrFn(parentVal, childVal, vm)
}

```

`mergeDataOrFn`其实仅仅做判断数据格式是否满足的逻辑处理，这里就省略不占篇幅了，该方法最终将调用一个名叫`mergeData`的方法，最终的合并原则都在其中：

``` js
// core/util/options
// 注意to为组件属性值，from为混入或者extend的属性值
function mergeData (to: Object, from: ?Object): Object {
  if (!from) return to
  let key, toVal, fromVal

  const keys = hasSymbol
    ? Reflect.ownKeys(from)
    : Object.keys(from)

  for (let i = 0; i < keys.length; i++) {
    key = keys[i]
    // in case the object is already observed...
    if (key === '__ob__') continue
    toVal = to[key]
    fromVal = from[key]
    // 目标对象不含有该属性，直接赋值
    if (!hasOwn(to, key)) {
      set(to, key, fromVal)
    } else if (
      toVal !== fromVal &&
      isPlainObject(toVal) &&
      isPlainObject(fromVal)
    ) {
      // 两者不等，且都为对象属性，递归合并
      mergeData(toVal, fromVal)
    }
  }
  return to
}
```

`to`为组件本身的对象属性，`from`为其他混入或者继承的数据。因此`data`混入时遵守组件优先，对象属性递归合并。

同时，`provide`也遵守该规则

``` js
strats.provide = mergeDataOrFn
```

### Hooks

除了生命周期常见的生命周期函数，还可以看见额外的两个组件方法`errorCaptured`错误捕获事件和`serverPrefetch` vue ssr的服务器数据预拉取方法。

``` js
// shared/constants.js
export const LIFECYCLE_HOOKS = [
  'beforeCreate',
  'created',
  'beforeMount',
  'mounted',
  'beforeUpdate',
  'updated',
  'beforeDestroy',
  'destroyed',
  'activated',
  'deactivated',
  'errorCaptured',
  'serverPrefetch'
]
```

``` js
// core/util/options
function mergeHook (
  parentVal: ?Array<Function>,
  childVal: ?Function | ?Array<Function>
): ?Array<Function> {
  const res = childVal
    ? parentVal
      ? parentVal.concat(childVal)
      : Array.isArray(childVal)
        ? childVal
        : [childVal]
    : parentVal
  return res
    ? dedupeHooks(res)
    : res
}
```

`mergeHook`是主要的合并策略方法。可以看到里面套了三层的三元运算。我们改成`if-else`便于阅读：

``` js
let res = []
// childVal存在
if (childVal) {
  // parentVal存在，合并childVal
  if (parentVal) {
    res = parentVal.concat(childVal)
  } else {
    // 保证childVal为数组
    res = Array.isArray(childVal) ? childVal : [childVal]
  }
} else {
  res = parentVal
}
```

`if-else`实在有点多，如此我们简化理解为：

``` js
const res = [].concat(parentVal || [], childVal || [])
```

由此生成对应`hook`的执行队列，先入先出。

### Assets

`assets`包含熟悉的三个属性component、directive、filter

``` js
// shared/constants.js
export const ASSET_TYPES = [
  'component',
  'directive',
  'filter'
]
```

声明`strats`时自动加了`s`后缀：

``` js
ASSET_TYPES.forEach(function (type) {
  strats[type + 's'] = mergeAssets
})
```

依然遵循组件优先策略，只是代码内部进行了一些类型判断：

``` js
// core/util/options
function mergeAssets (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): Object {
  const res = Object.create(parentVal || null)
  if (childVal) {
    process.env.NODE_ENV !== 'production' && assertObjectType(key, childVal, vm)
    return extend(res, childVal)
  } else {
    return res
  }
}
```

### watch

`watch`略显特殊，省略了部分`if-else`代码，集中看重点规则定义逻辑：

``` js
// core/util/options
strats.watch = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  ...
  const ret = {}
  // parentVal浅拷贝赋值给ret
  extend(ret, parentVal)
  // 迭代childVal
  for (const key in childVal) {
    let parent = ret[key]
    const child = childVal[key]
    // 规范parent为数组结构
    if (parent && !Array.isArray(parent)) {
      parent = [parent]
    }
    // 三元运算，我们根据hook策略中的经验简化一下：
    // ret[key] = [].concat(parent || [], child)
    ret[key] = parent
      ? parent.concat(child)
      : Array.isArray(child) ? child : [child]
  }
  return ret
}
```

可以看出，`watch`中相同的属性值被整合成了数组，当监听发生改变，依次调用。

### Other object hashes

其他对象属性包括：`props`、`methods`、 `inject`、 `computed`遵守相同的规则：

``` js
// core/util/options
strats.props =
strats.methods =
strats.inject =
strats.computed = function (
  parentVal: ?Object,
  childVal: ?Object,
  vm?: Component,
  key: string
): ?Object {
  ...
  if (!parentVal) return childVal
  const ret = Object.create(null)
  extend(ret, parentVal)
  // childVal存在将覆盖parentVal相同的属性值
  if (childVal) extend(ret, childVal)
  return ret
}
```

不难看出，依然是组件属性优先的策略。

### 自定义选项合并策略

vue提供了一个自定义选项合并策略的属性`optionMergeStrategies`，该属性将被默认为`strats`的初始值：

``` js
// config即为Vue.config
const strats = config.optionMergeStrategies
```

> 自定义选项将使用默认策略，即简单地覆盖已有值。如果想让自定义选项以自定义逻辑合并，可以向 Vue.config.optionMergeStrategies 添加一个函数

``` js
Vue.config.optionMergeStrategies.myOption = function (toVal, fromVal) {
  // 返回合并后的值
}
```

## 总结

1. `data`与`provide`合并时以组件优先，对于对象类型的数据将递归合并
2. 生命周期合并时，将同名hook整合成数组，组件的生命周期最后调用
3. `watch`中同名键值将整合成数组，组件中的watch同样最后调用
4. 其他包括`assets type（components、filters、directives）`和`props`、`methods`、 `inject`、 `computed`则同名覆盖，组件优先
5. 如果有自定义选项需要使用合并策略，可使用`optionMergeStrategies`自定义合并策略

以上。
