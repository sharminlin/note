# Vue Function-based API RFC 理解笔记

原文链接[Vue Function-based API RFC](https://zhuanlan.zhihu.com/p/68477600)<br />

## example
惯例，先挂例子，哈哈哈
``` JS
import { value, computed, watch, onMounted } from 'vue'

const App = {
  template: `
    <div>
      <span>count is {{ count }}</span>
      <span>plusOne is {{ plusOne }}</span>
      <button @click="increment">count++</button>
    </div>
  `,
  setup() {
    // reactive state
    const count = value(0)
    // computed state
    const plusOne = computed(() => count.value + 1)
    // method
    const increment = () => { count.value++ }
    // watch
    watch(() => count.value * 2, val => {
      console.log(`count * 2 is ${val}`)
    })
    // lifecycle
    onMounted(() => {
      console.log(`mounted`)
    })
    // expose bindings on render context
    return {
      count,
      plusOne,
      increment
    }
  }
}
```

直接看例子，初看能看出几点<br />
1. 从上往下，我们发现从`vue`这个包里引入了好几个东西`value, computed, watch, onMounted`，先放着待会儿就知道（看命名多半也知道个大概，哈哈）
2. 整个组件声明没变化，也是一个对象。但里面就不一样了，多了个`setup`函数，这个函数我有所耳闻，核心更改都在这里面了。然后以前的data、methods、computed、watch等等都没了。没错，都集成到了setup里面。

## setup()
新的组件选项，setup，用于设置组件的logic。在组件实例被创建，初始化了props后调用（所以props没有集成进来哦~，props作为setup的参数传入，setup(props)）。他可以返回在里面定义的任何值，并且是响应式的。没错，他替代了data()，但又不止data()，除此之外的methods、computed、watch，甚至是生命周期都在里面被声明定义。

## value()
替代data()，从例子中可以看出，传入的值就是初始值了（真像useState），返回了一个对象。没错，就是对象，该对象仅有一个值：value（即使用时是count.value）。该对象被称为**value wrapper （包装对象）**。如果想声明一个没有包装对象的`响应式对象`（通常在使用了value()后，我不建议这样做，因为这会使你的项目变得混乱），你可以使用`state`函数。
``` JS
import { state } from 'vue'

const object = state({
  count: 0
})

object.count++
```

需要注意的一点是，`包装对象会在渲染模板中，或响应对象中自动展开`。也就是使说：在上面两个条件里，是不需要也不能使用.value的。

>以上这些关于包装对象的细节可能会让你觉得有些复杂，但实际使用中你只需要记住一个基本的规则：只有当你直接以变量的形式引用一个包装对象的时候才会需要用 .value 去取它内部的值 —— 在模版中你甚至不需要知道它们的存在。

其次，setup甚至可以返回一个渲染函数，但我并认为这能在实际开发中使用。因为我对JS结构DOM总是敬而远之。
``` JS
import { value, createElement as h } from 'vue'

const MyComponent = {
  setup(initialProps) {
    const count = value(0)
    const increment = () => { count.value++ }

    return (props, slots, attrs, vnode) => (
      h('button', {
        onClick: increment
      }, count.value)
    )
  }
} 
```
可以使用渲染函数，当然也可以使用render函数。但并不建议这样搭配使用，这样会造成不必要的解构操作。

## computed()
没错，这替代了2.X里的`computed`组件选项。但在理解上并没有太大的改变。`computed()`支持传入一个计算函数，同时返回的是一个`包装对象`，至于计算属性的使用我想这里不需要赘述了。<br />
当然，该函数第二个参数支持传入一个setter，替换原先的get和set使用形式。

## watch()
监听函数。替代`watch`组件选项（这好像是废话）。该函数接受两个参数，第一个参数被称为数据源，有三种类型
1. 一个返回任意值的函数
2. 一个包装对象
3. 一个包含上述两种数据源的数组

第二个是回调，在数据源发生变化时触发。下面是第一种类型的例子：

``` JS
// count原始值为0
watch(
  // getter
  () => count.value + 1,
  // callback
  (value, oldValue) => {
    console.log('count + 1 is: ', value)
  }
)
// -> count + 1 is: 1

count.value++
// -> count + 1 is: 2
```
可以看到，输出了两次`count + 1 is:`。这是因为watch在创建时会执行一次callback。这个行为可以通过选项`lazy`自定义（补充说明，设置选项对象为第三个参数= =）。<br />
回调函数和以前的监听函数是一致的。值得注意的有两点
1. value值是第一个参数的返回值，因此当数据源有函数类型时，该函数必须返回一个值。
2. vue3必须严格区分包装对象和响应式对象，否则会增加不必要的代码阅读难度。包装对象作为第一个实参，则在回调函数中的value即是其.value值。而响应式对象，是需要使用函数类型。比如原文中的props。

### stop
该watch()函数会返回一个停止观察的函数
```JS
const stop = watch()

stop()
```

### clean
callback的第三个参数即是来注册清理操作的函数。调用这个函数可以注册一个清理函数。清理函数会在下属情况下被调用：
1. 在回调被下一次调用前
2. 在 watcher 被停止前

```JS
watch(idValue, (id, oldId, onCleanup) => {
  const token = performAsyncOperation(id)
  // 注册清除函数
  onCleanup(() => {
    // id 发生了变化，或是 watcher 即将被停止.
    // 取消还未完成的异步操作。
    token.cancel()
  })
})
```

## 生命周期函数
> 所有现有的生命周期钩子都会有对应的 onXXX 函数（只能在 setup() 中使用）

## 依赖注入provide & inject
同样两者搭配使用，且都在setup中使用
``` JS
import { value, provide, inject } from 'vue'

const CountSymbol = Symbol()

// Ancestor
setup () {
  const count = value(0)
  provide({
    [CountSymbol]: count
  })
}

// Descendent
setup() {
  const count = inject(CountSymbol)
  return {
    count
  }
}
```

## createComponent
这应该是一个类似于react纯函数组件的生成函数。但目前来讲，我不是特别希望使用这个API，或者没有找到更好的方法来使用它。

