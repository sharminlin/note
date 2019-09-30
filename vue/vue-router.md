# vue-router 源码阅读手记
一篇关于vue-router源码阅读手记。<br>
源码主要分成三部分，一是`VueRouter`类，一是`History`类，一是两个组件`RouterView`和`RouterLink`。

## 1 Install
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

## 2 VueRouter

### 2.1 router.init

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

该函数将注入`router`的组件（app）存于`apps`属性中，之后在app组件销毁时，删除之。<br />
`this.app`存储的是当前注册组件，一个组件树下，会取最底层的一个注入过`router`的组件。<br />
然后调用`transitionTo`初次加载路由组件，该函数在`history class`之中，我们之后会讲到。最后注册`history`的路由更新回调函数。

### 2.2 new VueRouter()
``` js
import Router from 'vue-router'

export default new Router({
  mode: 'hash',
  base: '/',
  routes: [
    {
      path: '/login',
      component: LoginComponent,
      name: 'Login',
      meta: {}
    },
    {
      path: '/home',
      component: HomeComponent,
      name: 'Home',
      meta: {}
    }
  ]
})
```

如上，我们通常在使用`vue-router`的时候会传入`mode`、`base`和`routes`三个参数，接下来看看`new Router()`发生了什么。

### 2.2.1 Constructor

``` js
// ./index.js

constructor (options: RouterOptions = {}) {
  this.app = null
  this.apps = []
  this.options = options
  this.beforeHooks = []
  this.resolveHooks = []
  this.afterHooks = []
  this.matcher = createMatcher(options.routes || [], this)

  // 路由模式处理
  let mode = options.mode || 'hash'
  // 当浏览器不支持history api
  this.fallback = mode === 'history' && !supportsPushState && options.fallback !== false
  if (this.fallback) {
    mode = 'hash'
  }
  if (!inBrowser) {
    mode = 'abstract'
  }
  this.mode = mode

  switch (mode) {
    case 'history':
      this.history = new HTML5History(this, options.base)
      break
    case 'hash':
      this.history = new HashHistory(this, options.base, this.fallback)
      break
    case 'abstract':
      this.history = new AbstractHistory(this, options.base)
      break
    default:
      if (process.env.NODE_ENV !== 'production') {
        assert(false, `invalid mode: ${mode}`)
      }
  }
}
```

代码其实非常简单，着重的有两点
1. `createMatcher`函数，该函数对raw routes做了一系列处理
2. 对路由模式做了兼容处理，一是不支持H5的浏览器降级为`hash`；一是非浏览器，比如原生移动端中，转为`abstract`模式。这三种模式都有对应的类`HTML5History`、`HashHistory`、`AbstractHistory`。这三个类都继承于`Base`。

下面我们继续深入，看看`createMatcher`的实现：

#### 2.2.2 createMatcher
``` js
// ./create-matcher.js
export type Matcher = {
  match: (raw: RawLocation, current?: Route, redirectedFrom?: Location) => Route;
  addRoutes: (routes: Array<RouteConfig>) => void;
};

export function createMatcher (
  routes: Array<RouteConfig>,
  router: VueRouter
): Matcher {
  // createRouteMap生成以下：
  // pathList 所有路由路径集合
  // pathMap 根据路径映射对应路由信息的map对象
  // nameMap 根据路由名称映射对应路由信息的map对象
  const { pathList, pathMap, nameMap } = createRouteMap(routes)

  // 动态增加路由的方法
  function addRoutes (routes) {
    createRouteMap(routes, pathList, pathMap, nameMap)
  }

  // 通过raw获取实际的路由信息
  function match (
    raw: RawLocation,
    currentRoute?: Route,
    redirectedFrom?: Location
  ): Route {
   // ...
  }

  // 当路由设置了redirect，返回该路由重定向指向的路由信息
  function redirect (
    record: RouteRecord,
    location: Location
  ): Route {
    // ...
  }

  // 当路由设置了alias，通过别名返回该路由信息
  function alias (
    record: RouteRecord,
    location: Location,
    matchAs: string
  ): Route {
    // ...
  }

  function _createRoute (
    record: ?RouteRecord,
    location: Location,
    redirectedFrom?: Location
  ): Route {
    // ...
  }

  return {
    match,
    addRoutes
  }
}
```

在最开始，声名了一个类型`Matcher`，而该类型正是`createMatcher`返回值类型，包含两个函数方法`match`和`addRoutes`。<br />
对于`addRoutes`我们应该非常熟悉，这是动态更新路由的api，它的实现是基于`createRouteMap`方法，该方法主要是将raw routes整合返回三个参数，这三个参数的解释在注释中已经非常详尽。因此这里我们先理解`match`整体流程，再去看`createRouteMap`的具体实现。<br />

``` js
// 通过raw location抓取目标路由节点信息
function match (
  raw: RawLocation,
  currentRoute?: Route,
  redirectedFrom?: Location
): Route {
  const location = normalizeLocation(raw, currentRoute, false, router)
  const { name } = location

  if (name) {
    // 通过name获取路由信息
    const record = nameMap[name]
    if (process.env.NODE_ENV !== 'production') {
      warn(record, `Route with name '${name}' does not exist`)
    }
    if (!record) return _createRoute(null, location)

    // 取出path中的路由参数key值
    const paramNames = record.regex.keys
      .filter(key => !key.optional)
      .map(key => key.name)

    if (typeof location.params !== 'object') {
      location.params = {}
    }

    // 合并当前路由参数至目标路由参数中，前提：当前路由参数在paramNames中，且目标路由参数中不存在
    if (currentRoute && typeof currentRoute.params === 'object') {
      for (const key in currentRoute.params) {
        if (!(key in location.params) && paramNames.indexOf(key) > -1) {
          location.params[key] = currentRoute.params[key]
        }
      }
    }

    // 将参数合入path中，比如path为/user/:id，id为1，则返回填充过参数的路径/user/1
    location.path = fillParams(record.path, location.params, `named route "${name}"`)
    return _createRoute(record, location, redirectedFrom)
  } else if (location.path) {
    location.params = {}
    // 使用路由的匹配规则匹配pathList存储的route
    for (let i = 0; i < pathList.length; i++) {
      const path = pathList[i]
      const record = pathMap[path]
      if (matchRoute(record.regex, location.path, location.params)) {
        return _createRoute(record, location, redirectedFrom)
      }
    }
  }
  // no match
  return _createRoute(null, location)
}
```

在一开始便调用了`normalizeLocation`函数，限于篇幅原因这里便不贴出代码详细讲解了。顾名思义，该函数用于规范化传入的`raw`并赋值给`next`属性，该属性类型为`Location`，定义如下：

``` ts
export interface Location {
  name?: string
  path?: string
  hash?: string
  query?: Dictionary<string | (string | null)[] | null | undefined>
  params?: Dictionary<string>
  append?: boolean
  replace?: boolean
}
```

再看`normalizeLocation`的返回值，其实就是路径、参数、哈希值。

``` js
return {
  _normalized: true,
  path,
  query,
  hash
}
```

除了`normalizeLocation`之外，其他都是一些简单的逻辑，我尽量详细的写在了注释中。但是可以发现，其中有一个函数方法频繁出现，即`_createRoute`，`match`方法正是返回的该方法执行之后的结果：

``` js
function _createRoute (
  record: ?RouteRecord,
  location: Location,
  redirectedFrom?: Location
): Route {
  if (record && record.redirect) {
    return redirect(record, redirectedFrom || location)
  }
  if (record && record.matchAs) {
    return alias(record, location, record.matchAs)
  }
  return createRoute(record, location, redirectedFrom, router)
}
```

该函数用于在`createRoute`之前，判断一些前提
1. 该路由是否设置了重定向`redirect`，从而去获取重定向之后的路由信息
2. 该路由是否是设置了别名的路由的子路由，从而使用别名去获取路由信息

这里对于`redirect`和`alias`就不做详细的阐述了，我们还先着重的看看`createRoute`的具体实现：

``` js
// ./util/route.js

export function createRoute (
  record: ?RouteRecord,
  location: Location,
  redirectedFrom?: ?Location,
  router?: VueRouter
): Route {
  // location.query路由参数附加在path中的处理函数，未设置则会调用默认处理函数
  const stringifyQuery = router && router.options.stringifyQuery

  let query: any = location.query || {}
  try {
    query = clone(query)
  } catch (e) {}

  const route: Route = {
    name: location.name || (record && record.name),
    meta: (record && record.meta) || {},
    path: location.path || '/',
    hash: location.hash || '',
    query,
    params: location.params || {},
    fullPath: getFullPath(location, stringifyQuery),
    matched: record ? formatMatch(record) : [] // 存储当前路由节点到顶层的路由栈
  }
  if (redirectedFrom) {
    route.redirectedFrom = getFullPath(redirectedFrom, stringifyQuery)
  }
  return Object.freeze(route)
}
```

这是创建路由节点的方法，这些属性相信都是非常熟悉，值得一提的是`matched`属性，这会在跳转路由时用到。<br />
接下来，我们来看看是处理存储route tree的函数`createRouteMap`:

#### 2.2.3 createRouteMap

先回顾一下，该方法返回3个变量`pathList, pathMap, nameMap`，并且动态路由api`addRoutes`也会使用该方法

``` js
// ./create-router-map.js
export function createRouteMap (
  routes: Array<RouteConfig>,
  oldPathList?: Array<string>,
  oldPathMap?: Dictionary<RouteRecord>,
  oldNameMap?: Dictionary<RouteRecord>
): {
  pathList: Array<string>,
  pathMap: Dictionary<RouteRecord>,
  nameMap: Dictionary<RouteRecord>
} {
  // the path list is used to control path matching priority
  const pathList: Array<string> = oldPathList || []
  // $flow-disable-line
  const pathMap: Dictionary<RouteRecord> = oldPathMap || Object.create(null)
  // $flow-disable-line
  const nameMap: Dictionary<RouteRecord> = oldNameMap || Object.create(null)

  routes.forEach(route => {
    addRouteRecord(pathList, pathMap, nameMap, route)
  })

  // 将通配符*号放置最后
  for (let i = 0, l = pathList.length; i < l; i++) {
    if (pathList[i] === '*') {
      pathList.push(pathList.splice(i, 1)[0])
      l--
      i--
    }
  }

  if (process.env.NODE_ENV === 'development') {
    // warn if routes do not include leading slashes
    const found = pathList
    // check for missing leading slash
      .filter(path => path && path.charAt(0) !== '*' && path.charAt(0) !== '/')

    if (found.length > 0) {
      const pathNames = found.map(path => `- ${path}`).join('\n')
      warn(false, `Non-nested routes must include a leading slash character. Fix the following routes: \n${pathNames}`)
    }
  }

  return {
    pathList,
    pathMap,
    nameMap
  }
}
```

看了之后是不是觉得超级简单，其实最重要的还是遍历`route`树，调用的`addRouteRecord`方法：

``` js
function addRouteRecord (
  pathList: Array<string>,
  pathMap: Dictionary<RouteRecord>,
  nameMap: Dictionary<RouteRecord>,
  route: RouteConfig,
  parent?: RouteRecord,
  matchAs?: string
) {
  const { path, name } = route
  // ...

  const pathToRegexpOptions: PathToRegexpOptions =
    route.pathToRegexpOptions || {}
  const normalizedPath = normalizePath(path, parent, pathToRegexpOptions.strict)

  if (typeof route.caseSensitive === 'boolean') {
    pathToRegexpOptions.sensitive = route.caseSensitive
  }

  const record: RouteRecord = {
    path: normalizedPath,
    regex: compileRouteRegex(normalizedPath, pathToRegexpOptions), // 路由路径匹配规则
    components: route.components || { default: route.component },
    instances: {}, // 存储加载的组件实例
    name,
    parent,
    // 设置了alias之后的子路由的path别名，所有子路由都会存在该值。这会使得获取路径更加容易
    // 例入{ alias: '/a2', path: '/a', children: [{ path: '/b', matchAs: '/a2/b }] }
    matchAs, 
    redirect: route.redirect,
    beforeEnter: route.beforeEnter, // 路由独享的守卫
    meta: route.meta || {},
    props: // 通过 props 解耦 boolean | object
      route.props == null
        ? {}
        : route.components
          ? route.props
          : { default: route.props }
  }

  if (route.children) {
    // ...

    // 递归收集路由信息
    route.children.forEach(child => {
      // matchAs值的由来
      const childMatchAs = matchAs
        ? cleanPath(`${matchAs}/${child.path}`)
        : undefined
      addRouteRecord(pathList, pathMap, nameMap, child, record, childMatchAs)
    })
  }

  if (!pathMap[record.path]) {
    pathList.push(record.path) // pathList 所有路由路径集合
    pathMap[record.path] = record // pathMap 根据路径映射对应路由信息的map对象
  }

  // 如果该路由具备别名，则其子路由的将以该别名生成一条分支树
  if (route.alias !== undefined) {
    const aliases = Array.isArray(route.alias) ? route.alias : [route.alias]
    for (let i = 0; i < aliases.length; ++i) {
      const alias = aliases[i]
      // ...

      const aliasRoute = {
        path: alias,
        children: route.children
      }
      addRouteRecord(
        pathList,
        pathMap,
        nameMap,
        aliasRoute,
        parent,
        record.path || '/' // matchAs
      )
    }
  }

  if (name) {
    // nameMap 根据路由名称映射对应路由信息的map对象
    if (!nameMap[name]) {
      nameMap[name] = record 
    } else if (process.env.NODE_ENV !== 'production' && !matchAs) {
      warn(
        false,
        `Duplicate named routes definition: ` +
          `{ name: "${name}", path: "${record.path}" }`
      )
    }
  }
}
```

该方法为整合raw routes的实际方法，将生成一个新的route tree，节点类型为`RouteRecord`，类型定义如下：

``` ts
export interface RouteRecord {
  path: string
  regex: RegExp
  components: Dictionary<Component>
  instances: Dictionary<Vue>
  name?: string
  parent?: RouteRecord
  redirect?: RedirectOption
  matchAs?: string
  meta: any
  beforeEnter?: (
    route: Route,
    redirect: (location: RawLocation) => void,
    next: () => void
  ) => any
  props:
    | boolean
    | Object
    | RoutePropsFunction
    | Dictionary<boolean | Object | RoutePropsFunction>
}
```

### 2.3 小结
到此为止，我们就将`VueRouter`中的`this.matcher = createMatcher(options.routes || [], this)`该执行语句的过程理了一遍。`matcher`包含两个函数方法`match`和`addRoutes`。<br />

`match`用于通过raw location获取目标路由信息。在实现过程中，处理了`new VueRouter()`时传入的raw routes，生成3个参数用于存储处理过的`RouteRecord`类型的节点，`pathList`、`pathMap`和`nameMap`。<br />
`addRoutes`为动态路由的实现api，该方法会改变上面的3个存储参数。

## 3 History
现在，我们切换视角，看看路由api的实现。<br />
在上面提到过，`vue-router`有3种路由模式，`hash（哈希） | history（H5 api） | abstract（非浏览器）`，分别为类`HashHistory | HTML5History | AbstractHistory`的实例，而这三个类都继承于`BaseHistory`。这三者的代码逻辑基本一致，下面就以`HTML5History`为例，来看看如何操作路由变化。

### 3.1 HTML5History's constructor

``` js
// ./history/html5.js

constructor (router: Router, base: ?string) {
  super(router, base)

  const expectScroll = router.options.scrollBehavior
  const supportsScroll = supportsPushState && expectScroll

  // 用于切换路由后，控制页面滚动条滚动
  if (supportsScroll) {
    setupScroll()
  }

  const initLocation = getLocation(this.base)
  // 监听h5 history api popstate事件
  // 调用history.pushState()或者history.replaceState()不会触发popstate事件. popstate事件只会在浏览器某些行为下触发,
  // 比如点击后退、前进按钮(或者在JavaScript中调用history.back()、history.forward()、history.go()方法).
  window.addEventListener('popstate', e => {
    const current = this.current

    // Avoiding first `popstate` event dispatched in some browsers but first
    // history route not updated since async guard at the same time.
    // 当网页加载时,各浏览器对popstate事件是否触发有不同的表现,Chrome 和 Safari会触发popstate事件, 而Firefox不会.
    const location = getLocation(this.base)
    if (this.current === START && location === initLocation) {
      return
    }

    this.transitionTo(location, route => {
      if (supportsScroll) {
        handleScroll(router, route, current, true)
      }
    })
  })
}
```

该构造函数只做了两件事：
1. 如果支持滚动，则设置切换路由后，控制页面滚动条位置。坐标为路由渲染组件的`(pageXOffset, pageYOffset)`。具体实现限于篇幅，这里就略过不提了，有兴趣的可以自行阅读源码
2. 设置监听路由变化的回调函数。响应该事件的操作只会在浏览器某些行为下触发。

接下来就是非常重要的方法`transitionTo`，该方法定义在`BaseHistory`中。

### 3.2 transitionTo

``` js
// ./history/base.js

transitionTo (
  location: RawLocation,
  onComplete?: Function,
  onAbort?: Function
) {
  // 获取目标路由信息
  const route = this.router.match(location, this.current)
  this.confirmTransition(
    route,
    () => {
      this.updateRoute(route)
      onComplete && onComplete(route)
      this.ensureURL() // 改变url

      // fire ready cbs once
      if (!this.ready) {
        // 路由导航完毕的回调
        this.ready = true
        this.readyCbs.forEach(cb => {
          cb(route)
        })
      }
    },
    err => {
      if (onAbort) {
        onAbort(err)
      }
      if (err && !this.ready) {
        this.ready = true
        // 路由导航失败的回调
        this.readyErrorCbs.forEach(cb => {
          cb(err)
        })
      }
    }
  )
}
```

该方法在获取到目标路由之后，再次调用了方法`confirmTransition`，如果成功，则更新路由信息，重渲染视图，改变url，执行成功回调；如果失败，则抛出错误，执行失败回调。

#### 3.2.1 confirmTransition
``` js
// ./history/base.js

confirmTransition (route: Route, onComplete: Function, onAbort?: Function) {
    const current = this.current
    const abort = err => {
      // after merging https://github.com/vuejs/vue-router/pull/2771 we
      // When the user navigates through history through back/forward buttons
      // we do not want to throw the error. We only throw it if directly calling
      // push/replace. That's why it's not included in isError
      if (!isExtendedError(NavigationDuplicated, err) && isError(err)) {
        if (this.errorCbs.length) {
          this.errorCbs.forEach(cb => {
            cb(err)
          })
        } else {
          warn(false, 'uncaught error during route navigation:')
          console.error(err)
        }
      }
      onAbort && onAbort(err)
    }

    // 真实路由（带参）未发生变化
    if (
      isSameRoute(route, current) &&
      // in the case the route map has been dynamically appended to
      route.matched.length === current.matched.length
    ) {
      this.ensureURL()
      return abort(new NavigationDuplicated(route))
    }

    // 比对当前路由栈和预跳转路由栈
    // updated（共存的祖先路由栈）
    // deactivated（将失效的所有路由组件列表）
    // activated（将激活的所有路由组件列表）
    const { updated, deactivated, activated } = resolveQueue(
      this.current.matched,
      route.matched
    )

    const queue: Array<?NavigationGuard> = [].concat(
      // in-component leave guards
      // 获取所有失活组件的beforeRouteLeave路由守卫钩子
      extractLeaveGuards(deactivated),
      // 全局守卫钩子
      this.router.beforeHooks,
      // 获取所有更新组件的 beforeRouteUpdate路由守卫钩子
      extractUpdateHooks(updated),
      // 获取待激活组件路由配置上直接定义的beforeEnter守卫
      activated.map(m => m.beforeEnter),
      // 加载所有待激活的异步组件
      resolveAsyncComponents(activated)
    )

    this.pending = route
    // 存储的待执行的路由守卫队列的迭代器
    const iterator = (hook: NavigationGuard, next) => {
      if (this.pending !== route) {
        return abort()
      }
      try {
        // 调用路由守卫，实参与形参对应关系：
        // router 即to
        // current 即from
        // (to) => {} 即除了组件内的beforeRouteEnter以外，都是对应next。
        // beforeRouteEnter在调用时会额外的处理回调，该回调即next(vm => {})
        hook(route, current, (to: any) => {
          if (to === false || isError(to)) {
            // next(false) -> abort navigation, ensure current URL
            this.ensureURL(true)
            abort(to)
          } else if (
            typeof to === 'string' ||
            (typeof to === 'object' &&
              (typeof to.path === 'string' || typeof to.name === 'string'))
          ) {
            // next('/') or next({ path: '/' }) -> redirect
            abort()
            if (typeof to === 'object' && to.replace) {
              this.replace(to)
            } else {
              this.push(to)
            }
          } else {
            // confirm transition and pass on the value
            next(to)
          }
        })
      } catch (e) {
        abort(e)
      }
    }

    // 队列执行函数，第三个参数即全部执行完毕的回调函数callback
    runQueue(queue, iterator, () => {
      // postEnterCbs所有存储待激活组件内beforeRouteEnter注册的回调函数
      const postEnterCbs = []
      const isValid = () => this.current === route
      // wait until async components are resolved before
      // extracting in-component enter guards
      // 收集待激活组件内部的beforeRouteEnter
      const enterGuards = extractEnterGuards(activated, postEnterCbs, isValid)
      // 最后全局守护beforeResolve 
      const queue = enterGuards.concat(this.router.resolveHooks)
      runQueue(queue, iterator, () => {
        if (this.pending !== route) {
          return abort()
        }
        this.pending = null
        onComplete(route)
        if (this.router.app) {
          this.router.app.$nextTick(() => {
            postEnterCbs.forEach(cb => {
              cb()
            })
          })
        }
      })
    })
  }
```

该方法看起来非常复杂，但概言之，其实就是执行所有被路由变化影响的组件的路由守卫函数。

#### 3.2.2 updated, deactivated, activated
首先我们先来理解下面的三个参数：

``` js
// 比对当前路由栈和预跳转路由栈
// updated（共存的祖先路由栈）
// deactivated（将失效的所有路由组件列表）
// activated（将激活的所有路由组件列表）
const { updated, deactivated, activated } = resolveQueue(
  this.current.matched,
  route.matched
)
```

| 当前路由栈 | 预跳转路由栈 |
| -- | -- |
| deactivated | -- |
| deactivated | activated |
| updated | updated |
| updated | updated |
| updated | updated |

`resolveQueue`代码非常好理解，就是比对`current.matched`和`route.matched`两个数组，抽取出交集段以及各自的差集段。`matched`属性在讲`createRoute`时着重提示过，存储当前路由节点到顶层的路由栈。

#### 3.2.3 runQueue
在队列之前，我们先看看路由守卫队列执行函数：
``` js
// ./util/async.js

// 顺序执行fn传入queue列表存储的路由守卫函数
export function runQueue (queue: Array<?NavigationGuard>, fn: Function, cb: Function) {
  const step = index => {
    if (index >= queue.length) {
      cb()
    } else {
      if (queue[index]) {
        fn(queue[index], () => {
          step(index + 1)
        })
      } else {
        step(index + 1)
      }
    }
  }
  step(0)
}
```

注意`fn`，其实是一个`queue`路由守卫列表的迭代器。迭代完毕后，执行`cb`回调函数。

#### 3.2.4 queue
``` js
const queue: Array<?NavigationGuard> = [].concat(
  // in-component leave guards
  // 获取所有失活组件的beforeRouteLeave路由守卫钩子
  extractLeaveGuards(deactivated),
  // 全局守卫钩子
  this.router.beforeHooks,
  // 获取所有更新组件的 beforeRouteUpdate路由守卫钩子
  extractUpdateHooks(updated),
  // 获取待激活组件路由配置上直接定义的beforeEnter守卫
  activated.map(m => m.beforeEnter),
  // 加载所有待激活的异步组件
  resolveAsyncComponents(activated)
)
```

设置路由守卫待执行队列，我们先来看看是如何获取组件的`beforeRouteLeave`和`beforeRouteUpdate`，这两者逻辑一致：

``` js
function extractGuards (
  records: Array<RouteRecord>,
  name: string,
  bind: Function,
  reverse?: boolean
): Array<?Function> {
  // flatMapComponents抽取records，guards为其第二个参数执行后的返回值，类型Array<?Function>
  const guards = flatMapComponents(records, (def, instance, match, key) => {
    // def: component, instance: 组件实例, match: 路由信息, key: component的key，默认default
    const guard = extractGuard(def, name) // 获取对应name的路由守卫
    if (guard) {
      // 该守卫可为Array<Function>类型
      // 返回bind函数执行结果
      return Array.isArray(guard)
        ? guard.map(guard => bind(guard, instance, match, key))
        : bind(guard, instance, match, key)
    }
  })
  return flatten(reverse ? guards.reverse() : guards)
}

function extractGuard (
  def: Object | Function,
  key: string
): NavigationGuard | Array<NavigationGuard> {
  if (typeof def !== 'function') {
    // extend now so that global mixins are applied.
    def = _Vue.extend(def)
  }
  return def.options[key]
}

// 获取beforeRouteLeave
function extractLeaveGuards (deactivated: Array<RouteRecord>): Array<?Function> {
  return extractGuards(deactivated, 'beforeRouteLeave', bindGuard, true)
}

// 获取beforeRouteUpdate
function extractUpdateHooks (updated: Array<RouteRecord>): Array<?Function> {
  return extractGuards(updated, 'beforeRouteUpdate', bindGuard)
}

// bind 确保调用路由守卫guard时，this指向该路由守卫所在组件的实例
function bindGuard (guard: NavigationGuard, instance: ?_Vue): ?NavigationGuard {
  if (instance) {
    return function boundRouteGuard () {
      return guard.apply(instance, arguments) // 注意这里的arguments传值
    }
  }
}
```

在这部分，我们着重看看`flatMapComponents`方法，该方法抽取`records`数组，返回一个对应`name`的路由守卫数组：

``` js
// ./util/resolve-components

/**
 * 抽取matched中的components，转化成参数传入fn中，返回扁平化后的fn执行的返回结果
 * @param {*} matched 
 * @param {*} fn 
 */
export function flatMapComponents (
  matched: Array<RouteRecord>,
  fn: Function
): Array<?Function> {
  return flatten(matched.map(m => {
    // 值components: route.components || { default: route.component }
    return Object.keys(m.components).map(key => fn(
      m.components[key],
      m.instances[key], // router-view中registerRouteInstance时，赋值的目标组件实例
      m, key
    ))
  }))
}
```

#### 3.2.5 iterator
在加载完组件之后，将执行组件的`beforeRouteEnter`，抽取过程其实基本一致，仅仅是多了一个回调函数，确保`next`时，可以获取到组件实例。<br />
理清楚队列的作用之后，我们再回过头来看看队列的迭代器。
``` js
// 存储的待执行的路由守卫队列的迭代器
const iterator = (hook: NavigationGuard, next) => {
  if (this.pending !== route) {
    return abort()
  }
  try {
    // 调用路由守卫，实参与形参对应关系：
    // router 即to
    // current 即from
    // (to) => {} 即除了组件内的beforeRouteEnter以外，都是对应next。
    // beforeRouteEnter在调用时会额外的处理回调，该回调即next(vm => {})
    hook(route, current, (to: any) => {
      if (to === false || isError(to)) {
        // next(false) -> abort navigation, ensure current URL
        this.ensureURL(true)
        abort(to)
      } else if (
        typeof to === 'string' ||
        (typeof to === 'object' &&
          (typeof to.path === 'string' || typeof to.name === 'string'))
      ) {
        // next('/') or next({ path: '/' }) -> redirect
        abort()
        if (typeof to === 'object' && to.replace) {
          this.replace(to)
        } else {
          this.push(to)
        }
      } else {
        // confirm transition and pass on the value
        next(to)
      }
    })
  } catch (e) {
    abort(e)
  }
}
```

`hook`即代表所有守卫方法，`next`即控制器。因此我们在使用所有路由守卫时，都会执行`next()`正是这个原因。

#### 3.2.6 updateRoute
最后，再附上一段更新路由的回调函数

``` js
updateRoute (route: Route) {
  const prev = this.current
  this.current = route
  // router.init中注册的回调函数
  this.cb && this.cb(route)
  // 全局守卫afterEach
  this.router.afterHooks.forEach(hook => {
    hook && hook(route, prev)
  })
}
```

### 3.3 go、push、replace
``` js
// ./hitory/html5.js
go (n: number) {
  window.history.go(n)
}

push (location: RawLocation, onComplete?: Function, onAbort?: Function) {
  const { current: fromRoute } = this
  this.transitionTo(location, route => {
    pushState(cleanPath(this.base + route.fullPath))
    handleScroll(this.router, route, fromRoute, false)
    onComplete && onComplete(route)
  }, onAbort)
}

replace (location: RawLocation, onComplete?: Function, onAbort?: Function) {
  const { current: fromRoute } = this
  this.transitionTo(location, route => {
    replaceState(cleanPath(this.base + route.fullPath))
    handleScroll(this.router, route, fromRoute, false)
    onComplete && onComplete(route)
  }, onAbort)
}
```

可以看到，`push`和`replace`都是基于`transitionTo`方法。仅只api使用的是h5的`pushState`和`replaceState`.同样，`hash`模式使用的是同样是该api，但是会优先判断是否支持。而`abstract`模式，使用的是存储url栈来控制路由跳转。详细的大家可自行阅读源码，这里便不再费口舌了。

## 4 RouterView、RouterLink
最后，我们来看看两个路由组件的实现。

### 4.1 RouterView
``` js
export default {
  name: 'RouterView',
  functional: true,
  props: {
    name: {
      type: String,
      default: 'default'
    }
  },
  render (_, { props, children, parent, data }) {
    // used by devtools to display a router-view badge
    data.routerView = true

    // directly use parent context's createElement() function
    // so that components rendered by router-view can resolve named slots
    const h = parent.$createElement
    const name = props.name
    const route = parent.$route
    const cache = parent._routerViewCache || (parent._routerViewCache = {})

    // determine current view depth, also check to see if the tree
    // has been toggled inactive but kept-alive.
    let depth = 0
    let inactive = false

    // 向上寻找app顶层注册组件，同时计算该rooter-view的深度，且确认是否包含在keep-alive组件中
    while (parent && parent._routerRoot !== parent) {
      const vnodeData = parent.$vnode && parent.$vnode.data
      if (vnodeData) {
        if (vnodeData.routerView) {
          depth++
        }
        if (vnodeData.keepAlive && parent._inactive) {
          inactive = true
        }
      }
      parent = parent.$parent
    }
    data.routerViewDepth = depth // depth存储在data中

    // 如果本次渲染，已被keep-alive缓存
    if (inactive) {
      return h(cache[name], data, children)
    }

    const matched = route.matched[depth]
    // render empty node if no matched route
    if (!matched) {
      cache[name] = null
      return h()
    }

    // 通过name取得对应组件，name默认default，存储在cache中用于keep-alive激活
    const component = cache[name] = matched.components[name]

    // 声明路由注册实例函数，install时，全局混入在组件生命周期beforeCreate，如果是rooter-view对应组件将会调用
    // 该实例instances是用于组件内部的beforeRouteEnter的next回调函数入参值
    data.registerRouteInstance = (vm, val) => {
      // val could be undefined for unregistration
      const current = matched.instances[name]
      if (
        (val && current !== vm) ||
        (!val && current === vm)
      ) {
        matched.instances[name] = val
      }
    }

    // 同一组件在不同的路由中重用，则可以用该方法在路由信息上注册实例
    ;(data.hook || (data.hook = {})).prepatch = (_, vnode) => {
      matched.instances[name] = vnode.componentInstance
    }

    // register instance in init hook
    // in case kept-alive component be actived when routes changed
    // 缓存组件被激活时，可调用
    data.hook.init = (vnode) => {
      if (vnode.data.keepAlive &&
        vnode.componentInstance &&
        vnode.componentInstance !== matched.instances[name]
      ) {
        matched.instances[name] = vnode.componentInstance
      }
    }

    // 解耦路由参数
    let propsToPass = data.props = resolveProps(route, matched.props && matched.props[name])
    if (propsToPass) {
      // clone to prevent mutation
      propsToPass = data.props = extend({}, propsToPass)
      // pass non-declared props as attrs
      const attrs = data.attrs = data.attrs || {}
      for (const key in propsToPass) {
        if (!component.props || !(key in component.props)) {
          attrs[key] = propsToPass[key]
          delete propsToPass[key]
        }
      }
    }

    return h(component, data, children)
  }
}
```

该组件为函数式组件，仅只负责渲染。在`route`发生变化时，将重新执行`render`函数。如果你对函数式组件存在疑惑，可移步[官网](https://cn.vuejs.org/v2/guide/render-function.html#%E5%87%BD%E6%95%B0%E5%BC%8F%E7%BB%84%E4%BB%B6)。

### 4.2 RouterLink
``` js
export default {
  name: 'RouterLink',
  props: {
    to: {
      type: toTypes,
      required: true
    },
    tag: {
      type: String,
      default: 'a'
    },
    exact: Boolean,
    append: Boolean,
    replace: Boolean,
    activeClass: String,
    exactActiveClass: String,
    event: {
      type: eventTypes,
      default: 'click'
    }
  },
  render (h: Function) {
    const router = this.$router
    const current = this.$route

    // 目标路由信息
    const { location, route, href } = router.resolve(
      this.to,
      current,
      this.append
    )

    // 一大堆class名的处理
    const classes = {}
    const globalActiveClass = router.options.linkActiveClass
    const globalExactActiveClass = router.options.linkExactActiveClass
    // Support global empty active class
    const activeClassFallback =
      globalActiveClass == null ? 'router-link-active' : globalActiveClass
    const exactActiveClassFallback =
      globalExactActiveClass == null
        ? 'router-link-exact-active'
        : globalExactActiveClass
    const activeClass =
      this.activeClass == null ? activeClassFallback : this.activeClass
    const exactActiveClass =
      this.exactActiveClass == null
        ? exactActiveClassFallback
        : this.exactActiveClass

    // 如果该路由为重定向路由
    const compareTarget = route.redirectedFrom
      ? createRoute(null, normalizeLocation(route.redirectedFrom), null, router)
      : route

    classes[exactActiveClass] = isSameRoute(current, compareTarget)
    classes[activeClass] = this.exact
      ? classes[exactActiveClass]
      : isIncludedRoute(current, compareTarget)

    // 点击事件
    const handler = e => {
      if (guardEvent(e)) {
        if (this.replace) {
          router.replace(location, noop)
        } else {
          router.push(location, noop)
        }
      }
    }

    // 注册点击事件
    const on = { click: guardEvent }
    if (Array.isArray(this.event)) {
      this.event.forEach(e => {
        on[e] = handler
      })
    } else {
      on[this.event] = handler
    }

    const data: any = { class: classes }

    // 作用域插槽
    const scopedSlot =
      !this.$scopedSlots.$hasNormal &&
      this.$scopedSlots.default &&
      this.$scopedSlots.default({
        href,
        route,
        navigate: handler,
        isActive: classes[activeClass],
        isExactActive: classes[exactActiveClass]
      })

    if (scopedSlot) {
      if (scopedSlot.length === 1) {
        return scopedSlot[0]
      } else if (scopedSlot.length > 1 || !scopedSlot.length) {
        if (process.env.NODE_ENV !== 'production') {
          warn(
            false,
            `RouterLink with to="${
              this.props.to
            }" is trying to use a scoped slot but it didn't provide exactly one child.`
          )
        }
        return scopedSlot.length === 0 ? h() : h('span', {}, scopedSlot)
      }
    }

    // a标签
    if (this.tag === 'a') {
      data.on = on
      data.attrs = { href }
    } else {
      // 在插槽中查找a标签，并添加click事件和href路径属性
      const a = findAnchor(this.$slots.default)
      if (a) {
        // in case the <a> is a static node
        a.isStatic = false
        const aData = (a.data = extend({}, a.data))
        aData.on = aData.on || {}

        // 原生存在和on中同样事件时，将原生事件转换成数组Array<Event>
        for (const event in aData.on) {
          const handler = aData.on[event]
          if (event in on) {
            aData.on[event] = Array.isArray(handler) ? handler : [handler]
          }
        }

        // 再将on中的事件附加到原生事件中
        for (const event in on) {
          if (event in aData.on) {
            // on[event] is always a function
            aData.on[event].push(on[event])
          } else {
            aData.on[event] = handler
          }
        }

        const aAttrs = (a.data.attrs = extend({}, a.data.attrs))
        aAttrs.href = href
      } else {
        // doesn't have <a> child, apply listener to self
        data.on = on
      }
    }

    return h(this.tag, data, this.$slots.default)
  }
}
```

该组件同样使用渲染函数，不同于`RouterView`的是该组件非函数式，它接受两个props`to`和`tag`。将元素的点击事件绑定在`tag`上。

## 总结
至此，`vue-router`源码阅读完毕。<br />
虽然看似长篇大论，但整个代码逻辑并不难。限于篇幅，其中还有许多工具函数以及部分逻辑代码或省略，或一笔带过。毕竟这也不是一篇扫盲式的文章的说，虽然我觉得自己已经极尽详细地了。如果你有兴趣的话，我已经将注释过的代码上传至git，你可以clone下来详细阅读：[vue-router](https://github.com/SharminHall/vue-router) (注：微信对外链貌似有限制，建议使用电脑端)。<br />

在阅读过程中，事实上在涉及到关于vue底层的一些原理时，我也不甚了解。路漫漫其修远兮。如有不足，或者错误之处，还望指正，不甚感激，共勉。
