# 算法

## 合并两个数组
### 1. concat
```JS
let newArr = arrA.concat(arrB) // 返回一个新数组
```

### 2. for/map循环
```JS
/* 改变原数组。代码冗余不优雅 */
arrB.map(item => {
  arrA.push(item)
})
```

### 3. apply
```JS
/* apply特性，第二个参数为数组 */
arrA.push.apply(arrA, arrB)
```

## 交替合并N个数组
``` JS
function alternatelyConcat (...args) {
  let maxLenArr = args.reduce((item, next) => {
    return item.length > next.length ? item : next
  }, [])
  let maxLen = maxLenArr.length
  let newArr = []
  for (let i = 0; i < maxLen; i++) {
    args.map(item => {
      item[i] && newArr.push(item[i])
    })
  }
  return newArr
}

alternatelyConcat([1,4,7], [2,5,8], [3,6,9]) // [1, 2, 3, 4, 5, 6, 7, 8, 9]
```

## 排序
### 冒泡排序
```JS
function bubbleSort (arr) {
  if (!Array.isArray(arr)) {
    throw new Error('arr must be a Array!')
  }
  let len = arr.length
  for (let i = 0; i < len - 1; i++ ) {
    for (let j = i + 1; j < len; j++) {
      if (arr[i] > arr[j]) {
        // change
        [ arr[i], arr[j] ] = [ arr[j], arr[i] ]
      }
    }
  }
  return arr
}
```
上面版本的缺点在于即使给予一个升序数组，依然会依次循环比较一番，因此优化点在于当排序循环未结束时数组已排序成功时，如何break

```JS
function bubbleSort (arr) {
  if (!Array.isArray(arr)) {
    throw new Error('arr must be a Array!')
  }
  let len = arr.length
  let hasChange
  for (let i = 0; i < len - 1; i++ ) {
    hasChange = false
    for (let j = len - 1; j > i; j--) {
      if (arr[j - 1] > arr[j]) { // min-value bubble from len - 1 to 0
        // change
        [ arr[j - 1], arr[j] ] = [ arr[j], arr[j - 1] ]
        hasChange = true
      }
    }
    !hasChange && break;
  }
  return arr
}
```
`hasChange`表示在一轮循环中，是否发生了交换，如果没有发生，则表示此时数组已排序成功，反之则否

## 斐波那契数列
Regularity：0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89......<br >
Formula：从第3（n = 2）项开始**F<sub>n</sub> = F<sub>n - 1</sub> + F<sub>n - 2</sub>**

### 1. 递归
```JS
function fibonacci (n) {
  if (n === 0) return 0
  if (n === 1) return 1
  return fibonacci(n - 1) + fibonacci(n - 2)
}
```
复杂度： O(2<sup>N</sup>)

### 2. 循环
```JS
function fibonacci (n) {
  if (n === 0) return 0
  if (n === 1) return 1

  let fPre2 = 0
  let fPre1 = 1
  let fn = ''
  for (let i = 2; i <= n; i++) {
    fn = fPre2 + fPre1
    fPre2 = fPre1
    fPre1 = fn
  }
  return fn
}
```
复杂度： O(N)

## 二分法
### 实现
```JS
/**
 * 有序数组中查找目标值的索引
 */

// 递归
function binarySearch (arr, target, low = 0, high = arr.length - 1) {
  if (low > high) {
    return -1
  }
  let mid = Math.floor((high - low) / 2)
  if (arr[mid] == target) {
    return mid
  } else if (arr[mid] > target) {
    high = mid - 1
    return binarySearch(arr, target, low, high)
  } else if (arr[mid] < target) {
    low = mid + 1
    return binarySearch(arr, target, low, high)
  } else {
    return -1
  }
}

// 循环
function binarySearch (arr, target) {
  let low = 0
  let high = arr.length - 1
  while (low < high) {
    let mid = Math.floor((high - low) / 2)
    if (arr[mid] == target) {
      return mid
    } else if (arr[mid] > target) {
      high = mid - 1
    } else if (arr[mid] < target) {
      low = mid + 1
    } else {
      return -1
    }
  }
}
```

### 时间复杂度
n个元素，每次分两半。第m次即剩下n/2<sup>m</sup>个元素，一直到只剩1个元素，即m = log<sub>2</sub>N