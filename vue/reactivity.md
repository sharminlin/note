# vue3.0 响应式实现方案

10月5号，尤雨溪公布了vue3.0的[源码](https://github.com/vuejs/vue-next)，版本pre-alpha。git库地址：https://github.com/vuejs/vue-next

是谁在平静的湖面上扫射机关枪(╬ﾟдﾟ)▄︻┻┳═一...

此处不意欲逐行解读源码，盖因业界大牛早已纷纷激扬代码，挥斥方遒，洋洋洒洒，佳篇无数。我虽紧随其后，奈何功力浅薄，徒叹唏嘘。

我提取了响应式几个关键方法，合并成一个**简易**的响应式实现过程：

``` js
// 存储target的属性对应的依赖回调
let targetMap = new WeakMap()
// 在收集依赖时，保证是从effect的回调中
let activeReactiveEffectStack = []

function reactive (target, options) {
  const handler = {
    get: function (target, key, receiver) {
      console.log('get ', key)
      track(target, key)
      return Reflect.get(target, key, receiver)
    },
  
    set: function (target, key, value, receiver) {
      console.log('set ', key, ' ', value)
      const result = Reflect.set(target, key, value, receiver)
      trigger(target, key)
      return result
    }
  }

  // 初始化对应target的依赖回调
  if (!targetMap.has(target)) {
    targetMap.set(target, new Map())
  }

  return new Proxy(target, handler)
}

function effect (fn, options) {
  let effect = function (...args) {
    // 核心执行方法
    function run (...args) {
      if (activeReactiveEffectStack.indexOf(effect) === -1) {
        cleanup(effect)
        try {
          activeReactiveEffectStack.push(effect)
          return fn(...args)
        } finally {
          activeReactiveEffectStack.pop()
        }
      }
    }

    return run(...args)
  }

  effect.isEffect = true
  // 存储的是某监听对象的属性映射的effects
  effect.deps = []

  // 这里会手动执行一次，收集依赖。源码会有个lazy选项，避免第一次执行
  effect()

  return effect
}

function track (target, key) {
  let effect = activeReactiveEffectStack[activeReactiveEffectStack.length - 1]
  if (effect) {
    let depsMap = targetMap.get(target)
    if (!depsMap) {
      targetMap.set(target, (depsMap = new Map()))
    }

    let dep = depsMap.get(key)
    if (!dep) {
      depsMap.set(key, (dep = new Set()))
    }
    if (!dep.has(effect)) {
      // 对应target.key收集effect回调
      // 用于trigger
      dep.add(effect)
      // target.key涉及的某effect收集所有effect回调
      // 用于clean
      effect.deps.push(dep)
    }
  }
}

// 触发key对应的effects
function trigger (target, key) {
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  let effects = new Set()

  if (dep) {
    // 这里抽离出来，为了不形成强依赖
    dep.forEach(effect => {
      effects.add(effect)
    })

    // 源码分成了普通effect和computed，这里就不区别了。
    effects.forEach(effect => {
      effect()
    })
  }
}

// 清理该effect的存在痕迹
function cleanup (effect) {
  const { deps } = effect
  if (deps.length) {
    for(let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}

// 测试一波
function test () {
  var person = reactive({ name: 'Jone' })
  effect(() => {
    console.log('effect callback', person.name, person.age)
  })
  person.name = '1967'
  person.age = 1
}

test()

```

计算属性`computed`的实现亦基于此。还是建议去看源码，了解更多细节。

皮毛之见。

再会。
