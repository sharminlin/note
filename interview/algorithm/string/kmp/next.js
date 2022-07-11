/**
 * next 数组计算
 * 要点：前一个字符串与第index = next[n - 1]个字符串比较, 不同则与next[index]比较
 * 注意字符串下标以1开头来计算，所以需要 -1
 */

function caculate(preLetter, str, arr, i) {
  const index = arr[i - 1]
  if (str[index - 1] === undefined) return 1
  if (preLetter === str[index - 1]) {
    // 比对成功
    return index + 1
  }
  return caculate(preLetter, str, arr, index)
}

function next(string) {
  const arr = [0, 1]
  for (let i = 2; i < string.length; i++) {
    arr[i] = caculate(string[i - 1], string, arr, i)
  }
  return arr
}

console.log(next('ababaaababaa'))
