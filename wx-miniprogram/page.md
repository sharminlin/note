# 复写小程序page函数

由于小程序的业务复杂程度，特定复写page函数，保证整体全局的代码整洁度

暂时做了如下操作：
- onLoad之前判断登录异步的逻辑处理
- data的通用数据赋值

``` js
// page.js
import { BUS_EVENT_NAME } from './eventBus'

function beforeFunc (name, pre, next, fn) {
  next[name] = function () {
    fn.call(next, pre[name].bind(next))
  }
}

// 设置拦截onload方法的方法
function beforeOnLoad (preOpt, nextOpt) {
  // onLoad之前执行此方法
  function _beforeOnLoad (cb) {
    const app = getApp()
    if (!app.hasLogin) {
      app.$bus.$on(BUS_EVENT_NAME.appLaunchLogin, () => {
        cb()
      })
    } else {
      cb()
    }
  }

  beforeFunc('onLoad', preOpt, nextOpt, _beforeOnLoad)
}

// 设置通用的data数据
function beforeData (preOpt, nextOpt) {
  const app = getApp()

  nextOpt.data = Object.assign({}, preOpt.data, {
    qiniuHost: app.globalData.qiniuHost, // 通用七牛云服务器地址
    host: app.globalData.host // 服务器地址
  })
}

const _Page = (options) => {
  // 拦截产生的新PAGE选项
  let _options = {}
  Object.keys(options).map(key => {
    switch (key) {
      // 拦截onLoad方法
      case 'onLoad':
        beforeOnLoad(options, _options)
        break;
      case 'data': 
        beforeData(options, _options)
        break;
      default:
        _options[key] = options[key]
        break;
    }
  })

  return Page(_options)
}

export default _Page

```

`eventBus`为特定给小程序写的app bus事件系统。详细代码在`interview/eventBus`中
