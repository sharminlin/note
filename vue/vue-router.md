# vue-router 源码阅读手记
一篇关于vue-router源码阅读手记。

## install
在阅读vuex源码阅读手记中已经说明过`Vue.use()`的实现过程，这里就不赘述了。直接上手`install`。

``` js
// ./install.js
import View from './components/view'
import Link from './components/link'

export let _Vue

export function install (Vue) {
  if (install.installed && _Vue === Vue) return
  install.installed = true

  _Vue = Vue

  const isDef = v => v !== undefined // 检测是否未定义

  // 组件rooter-view的数据方法
  const registerInstance = (vm, callVal) => {
    let i = vm.$options._parentVnode

    // 等同于检测i.data.registerRouteInstance是否存在
    // 在rooter-view指向的子组件创建前，进行调用
    if (isDef(i) && isDef(i = i.data) && isDef(i = i.registerRouteInstance)) {
      i(vm, callVal)
    }
  }

  // 全局混入
  Vue.mixin({
    beforeCreate () {
      // router是否存在,如果存在，即为app组件
      if (isDef(this.$options.router)) {
        // 存储注册router的根组件实例
        this._routerRoot = this

        // VueRouter实例
        this._router = this.$options.router
        this._router.init(this)

        // 给this._route赋值当前路由，并reactive化，当发生变化时，将引起组件重绘
        Vue.util.defineReactive(this, '_route', this._router.history.current)
      } else {
        // 子组件的_routerRoot指向注册rooter的顶层组件
        this._routerRoot = (this.$parent && this.$parent._routerRoot) || this
      }
      registerInstance(this, this)
    },
    destroyed () {
      registerInstance(this)
    }
  })

  // 使组件this.$router = this._routerRoot._router
  Object.defineProperty(Vue.prototype, '$router', {
    get () { return this._routerRoot._router }
  })

  // 使组件this.$route = this._routerRoot._route
  Object.defineProperty(Vue.prototype, '$route', {
    get () { return this._routerRoot._route }
  })

  // 注册rooter-view和router-link
  Vue.component('RouterView', View)
  Vue.component('RouterLink', Link)

  const strats = Vue.config.optionMergeStrategies
  // use the same hook merging strategy for route hooks
  strats.beforeRouteEnter = strats.beforeRouteLeave = strats.beforeRouteUpdate = strats.created
}
```

在初始化时，主要做了以下几件事：
1. 全局混入生命周期`beforeCreate`，给路由顶层`app`组件加入几个属性：
  * `_routerRoot`指向`app`组件实例，之后所有的子组件的`_routerRoot`都将指向该值
  * `_router`指向`VueRouter`实例，执行`router`的`init`方法
  * 给`this._route`赋值当前路由值，并`reactive`化，当发生变化时，将引起组件重绘
  * 调用`registerInstance`方法，该方法是`router-view`的数据方法，后面会讲到
2. 给`Vue`加入两个原型属性`$router`、`$route`，设置其getter，分别获取顶层组件的`_router`和`_route`
3. 全局注册`RouterView`和`RouterLink`组件
4. 自定义选项合并策略，使组件内的路由守卫的合并策略与生命周期函数`created`相同。

这就是`install`做的全部事情.可以看到在`app`路由注入组件中，执行了`VueRouter`的`init`方法，我们先看看`init`方法做了什么，再看`new VueRouter()`的执行过程

## router.init

``` js
// ./index.js

init (app: any /* Vue component instance */) {
  process.env.NODE_ENV !== 'production' && assert(
    install.installed,
    `not installed. Make sure to call \`Vue.use(VueRouter)\` ` +
    `before creating root instance.`
  )

  this.apps.push(app)

  // set up app destroyed handler
  // https://github.com/vuejs/vue-router/issues/2639
  app.$once('hook:destroyed', () => {
    // clean out app from this.apps array once destroyed
    const index = this.apps.indexOf(app)
    if (index > -1) this.apps.splice(index, 1)
    // ensure we still have a main app or null if no apps
    // we do not release the router so it can be reused
    if (this.app === app) this.app = this.apps[0] || null
  })

  // main app previously initialized
  // return as we don't need to set up new history listener
  if (this.app) {
    return
  }

  this.app = app

  const history = this.history

  // transitionTo 促使路由变化的函数
  if (history instanceof HTML5History) {
    history.transitionTo(history.getCurrentLocation())
  } else if (history instanceof HashHistory) {
    // hash模式下的监听器
    const setupHashListener = () => {
      history.setupListeners()
    }
    history.transitionTo(
      history.getCurrentLocation(),
      setupHashListener,
      setupHashListener
    )
  }

  // listen注册路由发生变化之后，会调用的回调函数
  history.listen(route => {
    this.apps.forEach((app) => {
      app._route = route
    })
  })
}
```

该函数将注入`router`的组件（app），存储再`apps`属性中
