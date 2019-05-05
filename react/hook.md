# HOOK
Today(May 05 2019), I finally start learning from [React official website](https://react.docschina.org/). This is a brief note for HOOKS. You can go to its official website if you want to learn more. 

## State Hook(状态钩子)
The Hook is <font color=#ffe353>useState</font>. It return an array as a pair of <font color=#ffe353>state</font> and <font color=#ffe353> setState</font>. Like this:
``` js
const [count, setCount] = useState(0)
```
But first you need importing it from React.
```js
import { useState } from 'react'
```
Well, the hook just be used in "function components". <br />
The first argument of <font color=#ffe353>useState</font> is to initialize State Variable like "count". And the function like "setCount" is to replace "count" but not merge it. I think it's easy so.

## Effect Hook
The hook is a function named <font color=#ffe353>useEffect</font>. 
> If you’re familiar with React class lifecycle methods, you can think of useEffect Hook as componentDidMount, componentDidUpdate, and componentWillUnmount combined.

>There are two common kinds of side effects in React components: those that don’t require cleanup, and those that do.

### Effects Without Cleanup
```JS
useEffect(() => {
  // Do something
  // ...
})
```

### Effects With Cleanup
```JS
useEffect(() => {
  // Do something
  // ...
  return function cleanup () {
    // Clean something
    // ...
  }
})
```
You can return a function which named "cleanup" or others, even an arrow, when you need to clean something. It will performed at component unmounts, and every re-render. So we need to learn how to opt out of this behavior in case it creates performance issues.

### Optimizing Performance by Skipping Effects
```JS
const [count, setCount] = useState(0)

useEffect(() => {
  // Do something
  // ...
}, [count])
```
Yeah, just like this. Only re-run the effect if count changes.
