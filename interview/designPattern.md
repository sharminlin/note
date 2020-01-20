# Design Pattern (draft)
单一职责原则

## 闭包与高阶函数
### currying

### uncurrying
``` js
// Array.prototype.push.call(arguments, 1)

function uncurrying () {
  let self = this
  return function () {
    let context = [].prototype.shift(arguments)
    return self.apply(context, arguments)
  }
}

function uncurrying () {
  let self = this
  return function () {
    return Function.prototype.call.apply(self, arguments)
  }
}

```

### throttle
``` js
function throttle (fn, delay) {
  let func = fn
  let timer = null
  let firstTime = true

  return function () {
    let context = this
    if (firstTime) {
      fn.apply(context, arguments)
      firstTime = false
    } else if (!timer) {
      timer = setTimeout(() => {
        cleatTimeout(timer)
        timer = null
        fn.apply(context, arguments)
      }, delay)
    }
  }
}
```

### debounce
``` js
function debounce (fn, delay) {
  let func = fn
  let timer = null

  return function () {
    timer && clearTimeout(timer)
    timer = setTimeout(() => {
      cleatTimeout(timer)
      timer = null
      fn.apply(context, arguments)
    }, delay)
  }
}
```

### timeChunk
一定时间内，允许执行的次数

### 惰性加载
函数内部重写该函数
```js
let func = function (a) {
  func = function (a) {
    console.log('被重写了')
  }

  func()
}

```

## 单例

``` js
function Singleton (name) {
  this.name = name
  this.instance = null
}

Singleton.prototype.getName = function () {
  console.log(this.name)
}

Singleton.prototype.getInstance = function (name) {
  if (!this.instance) {
    this.instance = new Singleton(name)
  }
  return this.instance
}

const a = Singleton.getInstance('a')
const b = Singleton.getInstance('b')

a === b // true
```

or

``` js
function Singleton (name) {
  this.name = name
}

Singleton.prototype.getName = function () {
  console.log(this.name)
}

Singleton.prototype.getInstance = (function () {
  let instance = null
  return function () {
    if (!instance) {
      instance = new Singleton(name)
    }
    return instance
  }
})()
```

透明的单列模式，使用闭包封装内部实例，返回构造函数：

``` js
let Singleton = (function () {
  let instance = null
  let Singleton = function (name) {
    if (instance) {
      return instance
    }
    this.name = name

    return instance = this
  }

  Singleton.prototype.getName = function () {
    console.log(this.name)
  }

  return Singleton
})()

```

拆分单例：

``` js
function Person (name) {
  this.name = name
}
Person.prototype.getName = function () {
  console.log(this.name)
}

let ProxyPerson = (function () {
  let instance = null

  return function (name) {
    if (!instance) {
      return new Person(name)
    }
    return instance
  }
})()

```

## 策略

一个策略对象（算法类），一个执行对象（启动响应算法者）

消灭if-else-if

## 代理
虚拟
```js
let myImg = (function () {
  let img = document.createElement('img')
  document.appendChild(img)
  return {
    setSrc (src) {
      img.src = src
    }
  }
})

let proxyImg = (function () {
  let img = new Image()
  img.onLoad = function () {
    myImg.setSrc(this.src)
  }
  return {
    setSrc (src) {
      myImg.setSrc('loading')
      img.setSrc(src)
    }
  }
})

```

代理与接口的一致性原则（这让我想起了适配器）

## 迭代器
``` js
let each = function (arr, callback) {
  for (var i = 0, len = arr.length; i < len; i++) {
    callback.call(arr[i], i, arr[i])
  }
}

let Iterator = function (arr) {
  let current = 0
  return {
    isDone: current >= arr.length,
    next: function () {
      current++
    },
    value: arr[current]
  }
}
```

## 发布-订阅（观察者）
Event

## 命令模式
