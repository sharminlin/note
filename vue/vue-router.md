# vue-router 源码阅读手记
一篇关于vue-router源码阅读手记。<br>
源码主要分成两部分，一是`VueRouter`类，一是`History`类。

## VueRouter

### install
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

### router.init

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

### new VueRouter()
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

``` js
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
1. `createMatcher`函数，该函数对raw route做了一系列处理
2. 对路由模式做了兼容处理，一是不支持H5的浏览器降级为`hash`；一是非浏览器，比如原生移动端中，转为`abstract`模式。这三种模式都有对应的类`HTML5History`、`HashHistory`、`AbstractHistory`。这三个类都继承于`Base`。

下面我们继续深入，看看`createMatcher`的实现

### createMatcher
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
对于`addRoutes`我们应该非常熟悉，这是动态更新路由的api，它的实现是基于`createRouteMap`方法，该方法主要是将raw route整合返回三个参数，这三个参数的解释在注释中已经非常详尽。因此这里我们先理解`match`再去看`createRouteMap`的具体实现。<br />

``` js
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

除了`normalizeLocation`之外，其他都是一些简单的逻辑，我尽量详细的写在了注释中。但是可以发现，其中有一个函数方法频繁出现，即`_createRoute`：

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
2. 该路由是否设置别名的路由的子路由，从而使用别名去获取路由信息

这里对于`redirect`和`alias`就不做详细的阐述了，我们还是着重的看看`createRoute`的具体实现：

``` js
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

  // 如果该路由具备别名，将以别名映射该路由pathMap
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

该方法即整合raw route的实际方法，将生成一个新的route tree，节点类型为`RouteRecord`，类型定义如下：

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

