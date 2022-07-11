/**
 * 字符串的全排列
 */
function permutation(string) {
  if (!string) return 0
  if (string.length === 1) return 1
  const head = {}
  let sum = 0
  for (let i = 0; i < string.length; i++) {
    const letter = string[i]
    if (head[letter] === undefined) {
      head[letter] = true
      sum += permutation(string.slice(0, i) + string.slice(i + 1))
    }
  }
  return sum
}

console.log(permutation('YONYOU'))