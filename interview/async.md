# async/await

异步解法，解决`promise`中存在大量的`then`方法的问题。在不阻塞主线程的情况下使用同步代码实现异步的能力，使代码保持足够的清晰。

## 生成器

`async/await`基于生成器`Generator`语法，或者说它就是生成器的语法糖。这里定义一个生成器：

``` js
function* genDemo() {
  console.log("start 1")
  yield 'generator 1'

  console.log("start 2")
  yield 'generator 2'

  console.log("end")
  return 'generator end'
}
```

这里在线程的主协程中创建一个`genDemo`的生成器协程，协程是线程中的颗粒度，一个线程有多个协程，但线程是单协程运行。协程切换由程序控制。记住只是创建，但未曾切换至该协程，线程依然跑在主协程上。

``` js
const gen = genDemo()
console.log('我是主协程')

// 这段代码输出：
// 我是主协程
```

要切换至`gen`协程，使用`next`方法。开始执行genDemo中的代码，直到遇到`yield`关键字，将`yield`的代码执行并返回赋值形如`{value, done}`的对象。

``` js
console.log(gen.next())
console.log('欢迎肥来，我是主协程')

// 这段代码输出：
// start 1
// { value: generator 1, done: false }
// 欢迎肥来，我是主协程

console.log(gen.next())
// start 2
// { value: generator 2, done: false }
console.log(gen.next())
// end
// { value: generator end, done: true }
```

因此，得出一定结论：
1. 生成器函数执行时不会运行，而是创建一个生成器协程
2. 通过`next`方法，将切换至上面创建的生成器协程并执行对应代码
3. `yield`关键字将会执行完紧跟在后的代码，切换回主协程，并返回一个`{value, done}`的对象。

### async

执行一下代码：

``` js
async function fn () {
  return 'async'
}

fn() // Promise {<fulfilled>: "async"}
```

惊了，原来`async`其实返回了一个`Promise`，那再试试：

``` js
fn().then(res => console.log(res)); // 'async'
```

完全没问题，被`async`包裹的函数，其实内部是`new`了一个`Promise`异步执行。

### await

``` js
async function fn () {
  console.log('fn start')
  let x = await 100
  console.log(x)
  console.log('fn end')
}

console.log('0')
fn()
console.log('1')
```

分析以上代码，输出：

1. 主协程输出：`0`
2. 执行`fn()`进入`fn`协程，输出：`fn start`
3. 遇到`await`，执行返回`100`，切换至主协程，输出：`1`
4. 主协程宏任务完毕，检查是否存在微任务，检查到`fn()`中存在，进入`fn`协程，执行输出：`100 \n fn end`

`await`其实就是使用`Promise`为之后的代码，产生一个微任务，简化一下形如：

``` js
function fn () {
  return new Promise((resolve) => {
    console.log('fn start')
    resolve(100)
  }).then(res => {
    let x = res
    console.log(x)
    console.log('fn end')
  })
}
```

当然，`async/await` 内部更加的复杂多变，这里不展开叙述了。
