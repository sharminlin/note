# 总结

### 合并两个数组
1. concat
```JS
let newArr = arrA.concat(arrB) // 返回一个新数组
```

2. for/map循环
```JS
/* 改变原数组。代码冗余不优雅 */
arrB.map(item => {
  arrA.push(item)
})
```

3. apply
```JS
/* apply特性，第二个参数为数组 */
arrA.push.apply(arrA, arrB)
```

### 内存泄露

#### The reason
1. 全局变量
2. 闭包引起的内存泄漏
3. 事件清除

### 面向对象 OOP

### 函数式编程

#算法

## 斐波那契数列
规律：0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89......<br >
公式：从第3（n = 2）项开始**F<sub>n</sub> = F<sub>n - 1</sub> + F<sub>n - 2</sub>**
1. 递归
```JS
function fibonacci (n) {
  if (n === 0) return 0
  if (n === 1) return 1
  return fibonacci(n - 1) + fibonacci(n + 1)
}
```
复杂度： O(2<sup>N</sup>)

2. 循环
```JS
function fibonacci (n) {
  if (n === 0) return 0
  if (n === 1) return 1

  let fPre2 = 0
  let fPre1 = 1
  let fn = ''
  for (let i = 2; i <= n; i++) {
    f[i] = f[i - 1] + f[i - 2]
    fn = fPre2 + fPre1
    fPre2 = fPre1
    fPre1 = fn
  }
  return fn
}
```
复杂度： O(N)

