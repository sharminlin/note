import { watch, normalizeWatch, runnerWatch } from './watch'
import { isObject, isFunc } from './tool'

// 必要的方法拦截
const proxyHooksMap = {}

// 内置-方法拦截
const proxyBuiltInHooksMap = {
  'onLoad': function () {
    runnerWatch(this) // 立即执行带有immediate的watch选项
  }
}

// 内置-需要先在选项中定义的方法的拦截
const proxyDefinedHooksMap = {
  // 'computed': beforeComputed
}

class CreatePage {
  constructor (hooks) {
    this.globalMixins = {}
    // 内置一个watch
    this.proxyHooksMap = {
      watch: function (next) {
        next.watch = normalizeWatch(next)
        next.$watchSet = watch()
      }
    }

    // 预加载拦截处理
    for (let key in hooks) {
      this.proxyHooksMap[key] = getHooks(key, hooks[key])
    }

    // 内置关键拦截方法集成，防止hooks内无相关选项
    for (let key in proxyBuiltInHooksMap) {
      if (!this.proxyHooksMap[key]) {
        this.proxyHooksMap[key] = getHooks(key, function () {})
      }
    }
    this.page = this.page.bind(this)
    this.mixins = this.mixins.bind(this)
  }

  page (options) {
    const proxyHooksMap = this.proxyHooksMap
    const globalMixins = this.globalMixins

    // 执行拦截代理hooks
    for (let key in proxyHooksMap) {
      proxyHooksMap[key](options)
    }

    // 未在hooks中的
    Object.keys(options).map(key => {
      if (proxyDefinedHooksMap[key]) {
        proxyDefinedHooksMap[key](options)
      }
    })

    for (let key in globalMixins) {
      options[key] = globalMixins[key]
    }

    return Page(options)
  }

  mixins (globalMixins) {
    this.globalMixins = {
      ...this.globalMixins,
      ...globalMixins
    }
  }
}

// function beforeComputed (preOpt, nextOpt) {
//   const computedOption = preOpt.computed
//   if (computedOption) {
//     Object.keys(computedOption).map(key => {
//       nextOpt.data[key] = computed(computedOption[key].bind(nextOpt))
//     })
//   }
// }

function getHooks (name, fn) {
  return function (next) {
    replaceHooks(next, name, fn)
  }
}

function replaceHooks (next, name, fn) {
  if (name === 'data') {
    next[name] = Object.assign({}, fn(), next[name])
    return next[name]
  }

  // 存在，但不为函数直接返回
  if (!isFunc(next[name]) && next[name]) {
    return next[name]
  }

  const preFn = next[name] // change
  // 嵌入外在的option
  let option = normalizeHook(fn)

  // 前置异步
  if (option.async) {
    next[name] = async function (...args) {
      if (option.beforeHandler) {
        await option.beforeHandler.call(this, ...args)
      }

      return afterCallHook.call(this, preFn, name, option, args)
    }
  } else {
    next[name] = function (...args) {
      if (option.beforeHandler) {
        option.beforeHandler.call(this, ...args)
      }
  
      return afterCallHook.call(this, preFn, name, option, args)
    }
  }

}
function afterCallHook (preFn, name, option, args) {
  // 嵌入内置执行函数
  proxyBuiltInHooksMap[name] && proxyBuiltInHooksMap[name].call(this)
  
  if (option.afterHandler) {
    let result = preFn && preFn.call(this, ...args)
    return option.afterHandler(result)
  } else {
    return preFn && preFn.call(this, ...args)
  }
}

function normalizeHook (fn) {
  if (isObject(fn)) {
    return fn
  } else if (isFunc(fn)) {
    return {
      beforeHandler: fn,
      afterHandler: null,
      async: false
    }
  } else {
    throw new Error('fn is not valided')
  }
}

export default CreatePage
