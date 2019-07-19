# 总结

# CSS
## position
### 值
1. static（默认）
2. relative（相对定位）
3. absolute（绝对定位）
4. fixed（固定定位）
5. inherit（继承父元素的定位）

## BFC
BFC（Block Fromatting Context），即块级格式化上下文<br />
要形成一个BFC元素，需要满足以下几个条件之一<br />
1. 浮动元素
2. 绝对定位元素
3. display的值是inline-block、table-cell、flex、table-caption或者inline-flex
4. overflow的值不等于visible

### 用处
1. 清除浮动
```html
<div class="wrap">
  <section>1</section>
  <section>2</section>
</div>
```

```css
.wrap {
  border: 2px solid yellow;
  width: 250px;
  overflow: hidden;
}
section {
  background-color: pink;
  float: left;
  width: 100px;
  height: 100px;
}
```
2. 自适应两栏布局
```html
<div>
  <aside></aside>
  <main>我是好多好多文字会换行的那种呵呵呵呵呵呵呵呵呵呵呵呵呵</main>
</div>
```

```css
div {width: 200px;}
aside {
  background-color: yellow;
  float: left;
  width: 100px;
  height: 50px;
}
main {
  background-color: pink;
  overflow: hidden;
}
```

3. 防止margin合并
```html
<p class="top">1</p>
<div class="wrap">
  <p class="bottom">2</p>
</div>
```

```css
p {
  margin: 10px 0;
}

/* 第二个块形成BFC */
.wrap {
  overflow: hidden
}
```

# JS
## 原型&原型链
JS中，每一个函数对象都具有一个名为`prototype`的原型对象。而每一个对象都具有一个内置属性`_proto_`指向创建该对象的函数对象的原型（好吧，确实绕= =）。由此形成原型链。

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

## 常用技巧

### 1 双位运算符
```JS
~~2.1 // 2
~~-2.1 | // ---2
```

### 2 取整
```JS
2.1 | 0 // 2
-2.1 | 0 // -2
```

### new
new一个构造函数时，发生了什么
1. 创建一个空对象`var obj = new Object()`
2. 给obj创建内置对象constructor指向构造函数，创建__proto__指向构造函数的原型对象
3. 改变this指向obj，`a.call(obj)`
4. 给实例obj分配内存地址

### call apply bind
这三者其实都是改变函数执行的上下文，区别是call、apply会立即执行目标函数，而bind是类似声明改变函数运行时的上下文。<br />
当然，apply和call的入参不一样
```JS
fn.apply(context, [arg1, arg2, arg3])
fn.call(context, arg1, arg2, arg3)
```

#### apply
``` JS
Function.prototype.myApply = function ( context, args ) {
  context = context || window
  args = args || []
  const key = Symbol()
  context[key] = this
  const result = context[key](...args)
  delete context[key]
  return result
}
```

#### call
``` JS
Function.prototype.myCall = function ( context, ...args ) {
  context = context || window
  args = args || []
  const key = Symbol()
  context[key] = this
  const result = context[key](...args)
  delete context[key]
  return result
}
```

#### bind
``` JS
Function.prototype.myBind = function (context) {
  if (typeof this !== 'function') {
    throw new Error('this must be a function!')
  }
  context = context || window
  const key = Symbol()
  context[key] = this
  return function (...args) {
    return context[key](...args)
  }
}
```

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

