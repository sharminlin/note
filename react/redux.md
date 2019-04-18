# redux
1. store = createStore(reducer, preloadedState, enhancer)
    返回一个对象API { subscribe, getState, dispatch, … }
2. subscribe = (listener) => unsubscribe
    绑定响应事件，该事件函数获取store状态值，以改变组件状态值。
    返回一个该事件的解绑函数，用于组件销毁时调用。
3. getState = () => storeStateThree
    返回store的状态树
4. dispatch = ( action ) => action
    通过action.type触发对应type 的reducer处理逻辑
    因此，每一个action其实是去响应了所有的reducer，
    因此，type值必须在整个项目中时唯一的。
5. reducer = ( previousState, action ) => newState
    combineReducers = () => reducer
    单一的reducer没什么可以讲的，combineReducers的作用是将无数个reducer分离，避免过于臃肿难以维护。
    其中原理并不复杂，仅仅是将每个reducer作了分离，同时根据combineReducers传入的key值，将state树作相应枝干。
6. applyMiddleware  =  (…middleware) => {…store, dispatch}
    createStore其preloadedState与enhancer是可有的，根据规则，reducer和enhancer为函数，preloadedState为对象。因此在redux—createStore.js中，当第二个实参为函数，同时第三个参数undefined时，会调用：
7. enhancer( createStore )( reducer, preloadedState )
    enhancer即 中间件。enhancer( createStore ) 返回一个带有中间件的createSore函数。换句话说，即将原来的createStore进行改造。
    其中，有一个compose函数值得注意，功能表现为：
    compose(f,g,h)(…args)等同于f( g( h(…args) ) )
    这是未知个中间件组合的核心实现，核心在reduceRight()函数，该函数从右侧执行，并将其返回的值传给下一个。精妙在其第二个参数，为自执行表达式
    源码为ES6的实现，ES5的实现如下：
    
```
function compose(){
 	var fnArgs = Array.prototype.slice.call( arguments );
 
	if ( fnArgs.length == 0 ) {
		return (function(  ){  return Array.prototype.slice.call( arguments ) })
	}
	if ( fnArgs.length == 1 ) {
		return fnArgs[0]
	}

 	var last = fnArgs[fnArgs.length - 1];
 	var rest = fnArgs.slice(0, -1);

 	return ( function(){
 		var args = Array.prototype.slice.call( arguments );
		return rest.reduceRight( (args, fn)=>( fn.apply(null, args) ), last.apply(null, args) )
 	} )
}

    中间件middlewareName => ( {dispatch,  getState} )=> next => action => {
	// do something
	return next( action )
}
```

基于上面的applyMiddleware，编写中间件。上面已经提到 中间件的作用是改造dispatch。在业务逻辑中，像往常一样调用dispatch，但首先会通过中间件，最后达到原生的dispatch。
applyMiddleware.js中，最精华的一行代码：

```
dispatch = compose(...chain)(store.dispatch)
  其实，完整的可直观的调用为 compose( f, g, h )(store.dispatch)(action),实际执行为f( g( h(store.dispatch) ) )(action)。其中，f，g，h为调用中间件返回的函数：
  next=>action=>{
  // do something…
  return next( action )
}
```

令人惊叹的设计！但我必须说这真的是回调地狱的典范…
我们用异步来展现改造后的dispatch的执行流程的话，如下：

```
dispatch = (action) => {
f(action).then( (action)=>{ g(action) } )
  .then( (action)=>{ h(action) } )
  .then( (action)=>{ store.dispatch(action) } )
}
```
