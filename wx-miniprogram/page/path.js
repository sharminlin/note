import { isString, isObject } from './tool'

/**
 * 根据路径寻找object目标值
 * @param {*} object
 * @param {String} path
 */
export function matchValueByPath (object, path) {
  if (!path || !isString(path) || !isObject(object)) return ''

  path = stringToPath(path, object)
  let index = 0
  let length = path.length

  while (object != null && index < length) {
    object = object[path[index++]]
  }
  return (index && index == length) ? object : undefined
}

function stringToPath (string) {
  const rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
  const reEscapeChar = /\\(\\)?/g;
  const result = []
  if (string.charCodeAt(0) === 46 /* . */) {
    result.push('')
  }
  string.replace(rePropName, function(match, number, quote, subString) {
    result.push(quote ? subString.replace(reEscapeChar, '$1') : (number || match))
  })
  return result;
}


/**
 * 获取path值 'a.b' => 'b'
 * @param {String} path
 */
export function getPlainKey (path) {
  let index = path.lastIndexOf('.')
  if (index < 0) {
    return path
  } else {
    return path.substring(index + 1)
  }
}

/**
 * 剔除域名方法
 * @param {String} base 域名
 * @param {String} path 路径名
 */
export function getPathName (base, path) {
  const reg = new RegExp(base)
  return path.replace(reg, '')
}
