/**
 * 非空子串
 */

function substring(string) {
  const set = new Set()
  const length = string.length
  for (let start = 0; start < length; start++) {
    for (let end = start + 1; end <= length; end++) {
      set.add(string.slice(start, end))
    }
  }
  return set.size
}

console.log(substring('0100110001010001'))
