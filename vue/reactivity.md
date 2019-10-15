# vue3.0 响应式原理

10月5号，尤雨溪大神公布了vue3.0的[源码](https://github.com/vuejs/vue-next)，版本pre-alpha。git库地址：https://github.com/vuejs/vue-next

我之后也花时间去看了看代码。


``` js
let targetMap = new WeakMap()
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
  effect.deps = []

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

function trigger (target, key) {
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    targetMap.set(target, (depsMap = new Map()))
  }
  let dep = depsMap.get(key)
  let effects = new Set()

  if (dep) {
    dep.forEach(effect => {
      effects.add(effect)
    })

    effects.forEach(effect => {
      effect()
    })
  }
}

function cleanup (effect) {
  const { deps } = effect
  if (deps.length) {
    for(let i = 0; i < deps.length; i++) {
      deps[i].delete(effect)
    }
    deps.length = 0
  }
}

function test () {
  var person = reactive({ name: 'Jone' })
  effect(() => {
    console.log('effect callback', person.name, person.age)
  })
  person.name = ' 1902'
  person.age = 12
}

test()

```
