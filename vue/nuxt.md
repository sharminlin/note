# nuxt

## process.env

这里需要理清楚**运行中的环境变量**和**node环境变量**。毫无疑问`process.env`属于**node环境变量**。

`nuxt.config.js`中有一个选项`env`：

``` js
// nuxt.config.js
export default {
  env: {
    ENV: process.env.ENV
  }
}
```

它的值会在编译`cross-env ENV=prod nuxt build`时，将代码中的`process.env.ENV`编译成字符串`prod`。但这引申出一个问题：**我们的前端包在build过程中，不注入任何变量，而是在start启动服务时才注入**，从而实现一个包多个环境发布：

1. nuxt build
2. cross-env ENV=prod nuxt start

因此不能使用`env`这个选项，`nuxt`提供了**运行时环境变量**`publicRuntimeConfig`：

``` js
// nuxt.config.js
export default {
  publicRuntimeConfig: {
    ENV: process.env.ENV
  }
}
```

我们可以在代码中以`$nuxt.$config.ENV`来使用。

> $config is available anywhere from context (including pages, store and plugins)

但注意：`$nuxt`不可用在js文件的静态数据赋值中，它仅只能使用在函数运行中。

## 缓存

nuxt缓存使用的是`nuxt-ssr-cache`，在`nuxt.config.js`中，配置`cache`选项：

``` js
import cacheConfig from './cache.config'

export default {
  cache: cacheConfig
}
```

项目需要兼容移动端的写法：

``` js
// ./cache.config.js
import uaParser from 'ua-parser-js'

export default {
  // nuxt-ssr-cache pages必须length不为0才可生效
  pages: ['/'],
  key (route, context) {
    if (process.env.NODE_ENV === 'production') {
      const device = uaParser(context.req.headers['user-agent']).device
      // eslint-disable-next-line
      console.log(device.type)
      return ((device.type === 'tablet' || device.type === 'mobile') ? 'mobile' : 'pc') + route
    } else {
      return ''
    }
  },
  store: {
    type: "memory",
    // maximum number of pages to store in memory
    // if limit is reached, least recently used page
    // is removed.
    max: 100,
    // number of seconds to store this page in cache
    ttl: 60
  }
}
```

## 打包

### css

最好在`build`选项时，打开`extractCSS`开关，不然相关style会全部打进首屏渲染的html中，会影响服务端渲染的html大小。

``` js
// nuxt.config.js
export default {
  build: {
    extractCSS: process.env.NODE_ENV === 'production'
  }
}
```
