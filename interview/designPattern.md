# Design Pattern (draft)

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

透明的单列模式：

``` js
function Singleton (name) {
  
}
```