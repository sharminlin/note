# 总结

## 原型&原型链
JS中，每一个函数对象都具有一个名为`prototype`的原型对象。而`prototype`中具有一个内置属性`_proto_`指向创建该函数对象的函数对象的原型（好吧，确实绕= =）。由此形成原型链。

### 构造函数
我们通过构造函数来演示原型链的指向关系
```JS
function Person (name) {
  this.name = name
}
Person.prototype.say = function () {
  console.log('say' + this.name)
}

var person = new Person('Joe')
```
这其中，Joe这个person就是构造函数Person的实例。原型链的关系如下

```JS
// 实例person内置constructor属性指向构造函数Person
// Person的原型对象内置constructor属性也指向构造函数Person
person.constructor === Person === Person.prototype.constructor

// 实例person内置__proto__属性指向构造函数Person的原型对象
person.__proto__ === Person.prototype

// Person的内置__proto__属性指向构造函数Functin的原型对象
// 函数对象的__proto__都指向Function.prototype
Person.__proto__ === Function.prototype // Function.prototype为空函数对象
Function.__proto__ === Function.prototype
Object.__proto__ === Function.prototype

// 函数对象的原型对象的__proto__指向Object的原型
Person.prototype.__proto__ === Object.prototype
Function.prototype.__proto__ === Object.prototype

// 特殊
Object.prototype.__proto__ === null
```

## new
new一个构造函数时，发生了什么
1. 创建一个空对象`var obj = new Object()`
2. 给obj创建内置对象constructor指向构造函数，创建__prototype__指向构造函数的原型对象
3. 改变this指向obj，`a.call(obj)`
4. 给实例obj分配内存地址

## call apply bind


### 内存泄露

#### The reason
1. 全局变量
2. 闭包引起的内存泄漏
3. 事件清除

### 面向对象 OOP
万物皆有属性，通过属性去描述一件事物，这个事物即称对象。<br />
最典型的DOM对象。它具有名字（tag name），样式（style），各种属性（attributes），事件（events）等等。我们通过多维度的描述这个对象具备的属性从而展现这个对象，操作这个对象。<br />
在编程中，我们拆分逻辑，形成不同的对象，通过控制对象之间的交互，形成业务逻辑。<br />
再比如构建自己的UI组件库，每一个组件都是一个对象。在使用时，不必关心内部细节，只需理解对外使用方法。

### 函数式编程
函数式编程的一个特点就是，允许把函数本身作为参数传入另一个函数，还允许返回一个函数！

#算法

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

## 斐波那契数列
规律：0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89......<br >
公式：从第3（n = 2）项开始**F<sub>n</sub> = F<sub>n - 1</sub> + F<sub>n - 2</sub>**

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
