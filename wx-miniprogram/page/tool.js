export const isFunc = fn => typeof fn === 'function'

export const isString = str => typeof str === 'string'

export const isObject = obj => typeof obj === 'object'

export const cloneDeep = obj => {
  let newObj = null
  if (Array.isArray(obj) || isObject(obj)) {
    newObj = Array.isArray(obj) ? [] : {}
    for (let key in obj) {
      newObj[key] = (obj && typeof obj[key] === 'object') ? cloneDeep(obj[key]) : obj[key]
    }
  } else {
    return obj
  }

  return newObj
}
