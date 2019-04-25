# context in react
版本号为15.4.2 <br />
16之后的稍后总结更新

## 概念 Concept
众所周知这是一个dangerous features，非常容易引起组件树间的共享混乱，因此尽量少的去使用它。<br />
context即上下文的意思，在组件树中，子组件可以共享祖先组件定义的context，但祖先组件无法获取子孙组件定义的context<br />
即：一条河，有很多分支，下游的可以拿到上游某个位置扔进来的东西，但上游无法获取下游新扔进来的东西
**context是响应的**

## 如何定义 How to define
定义context满足需要两个条件
1. 定义childContextTypes
```JS
static childContextTypes = {
  uname: PropTypes.string
}
```
2. 使用getChildContext
`getChildContext`是Component内置函数，它返回的就是该组件下的所有子孙组件共享的context，
```JS
getChildContext () {
  return {uname: 'sharmin'}
}
```

## 如何使用 How to use
组件只需要定义contextTypes即可通过this.context访问该对象
```JS
static contextTypes = {
  uname: PropTypes.string
}
```

## 如何改变context某个属性值 How to change
将某个属性(假定为`uname`)指向state，改变state即可响应子孙组件中使用的context.uname
