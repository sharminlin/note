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
Function.prototype.myBind = function (context, ...args) {
  if (typeof this !== 'function') {
    throw new Error('this must be a function!')
  }
  context = context || window
  args = args || []
  const key = Symbol()
  context[key] = this
  return function (...newArgs) {
    return context[key](...args, ...newArgs)
  }
}
```

### new
手动实现一个new
``` js
function _new(F, ...args) {
  const target = Object.create({})
  target.__proto__ = F.prototype
  const result = F.call(target, ...args)
  if (result && (typeof result === 'object' || typeof result === 'function')) return result
  return target
}
```

### deepClone 深拷贝实现
``` js
function deepClone (target, hash = new WeakMap()) {
  if (target instanceof RegExp) return new RegExp(target)
  if (target instanceof Date) return new Date(target)
  // 普通类型
  if (target === null || typeof target !== 'object') return target
  // 防止嵌套引用
  if (hash.has(target)) return hash.get(target)
  let t = new target.constructor()
  hash.set(target, t)
  // 循环递归赋值
  for (let key in target) {
    if (target.hasOwnProperty(key)) {
      t[key] = deepClone(target[key], hash)
    }
  }
  return t
}
```

### curry柯里化
``` js
function curry (fn, ...args) {
  // 边界判断
  args.length < fn.length
    // 返回一个函数，重新柯里化，同时带上上次的参数值
    ? (...nextArgs) => curry(fn, ...args, ...nextArgs)
    : fn(...args)
}
```

### es5实现继承
``` js
function Person (name) {
  this.name = name
}
Person.prototype.sayHello = function () {
  console.log(this.name)
}

function Joe () {
  Person.call('Joe')
}
Joe.prototype = Object.create(Person.prototype, {
  constructor: {
    value: Joe,
    enumerable: false,
    writable: true,
    configurable: true
  }
})
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

