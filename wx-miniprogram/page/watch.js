import { matchValueByPath } from './path'
import { isFunc, cloneDeep } from './tool'

export function watch () {
  return function (setDatas, callback) {
    const watchOptions = this.watch
    const watchKeys = Object.keys(watchOptions)
    const setKeys = Object.keys(setDatas)
    let nextSubs = getSubs.call(this, watchOptions, setDatas) // :@return Map

    this.setData(setDatas, () => {
      nextSubs.forEach((option, key) => {
        option.handler.call(this, matchValueByPath(this.data, key), option.oldValue)
      })
      callback && callback()
    })
  }
}

export function normalizeWatch (options) {
  const watchOptions = {}
  const preOptions = options.watch
  for (let key in preOptions) {
    let option = isFunc(preOptions[key])
      ? {
        handler: preOptions[key],
        immediate: false,
        deep: false
      }
      : preOptions[key]
    watchOptions[key] = option
  }

  return watchOptions
}

export function runnerWatch (page) {
  const watchOptions = page.watch
  if (watchOptions) {
    for (let key in watchOptions) {
      const option = watchOptions[key]
  
      if (option.immediate) {
        const value = matchValueByPath(page.data || {}, key)
        option.handler.call(page, value)
      }
    }
  }
}

function getSubs (watchOptions, setDatas) {
  let nextSubs = new Map()
  const watchKeys = Object.keys(watchOptions)
  for (let key in setDatas) {
    let watchKey = watchKeys.find(function (watchKey) {
      let { deep } = watchOptions[watchKey]
      let escapeKey = escape(key)
      let escapeWatchKey = escape(watchKey)
      const setReg = new RegExp('^' + escapeKey)
      const watchReg =  new RegExp('^' + escapeWatchKey)

      // 如果是深度，eg: watchKey: 'a' setKey: 'a.b'
      if (!deep) {
        return setReg.test(watchKey)
      } else {
        return setReg.test(watchKey) || watchReg.test(key)
      }
    })

    const watchOption = watchOptions[watchKey]
    if (watchOption) {
      watchOption.oldValue = cloneDeep(matchValueByPath(this.data, watchKey))
      nextSubs.set(watchKey, watchOption)
    }
  }

  return nextSubs
}

function escape (s) {
  return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}
