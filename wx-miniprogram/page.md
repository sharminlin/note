# 复写小程序page函数

由于小程序的业务复杂程度，特定复写page函数，保证整体全局的代码整洁度

暂时做了如下操作：
- onLoad之前判断登录异步的逻辑处理
- data的通用数据赋值
- show/hide/unload的埋点处理
- 分享时统一加入shareid

``` js
// page.js
import { BUS_EVENT_NAME } from './eventBus'
import {
  handleNavigateTo
} from './handers'
import { getUrlAndQuery } from '../../utils/query'
import { recordPageVisitLog, sendPageVisitLog } from './fineIO'

// 必要的方法拦截
const proxyHooksMap = {
  'data': beforeData,
  'onLoad': beforeOnLoad,
  'onShow': beforeOnShow,
  'onHide': beforeOnHide,
  'onUnload': beforeOnUnload,
  'onShareAppMessage': beforeOnShareAppMessage
}

// 需要先在选项中定义的方法的拦截
const proxyDefinedHooksMap = {}

const _Page = (options) => {
  // 拦截产生的新PAGE选项
  const _options = {
    handleNavigateTo
  }

  // 执行拦截代理hooks
  for (let key in proxyHooksMap) {
    proxyHooksMap[key](options, _options)
  }

  // 未在hooks中的
  Object.keys(options).map(key => {
    if (proxyDefinedHooksMap[key]) {
      proxyDefinedHooksMap[key](options, _options)
    } else if (!proxyHooksMap[key]) {
      _options[key] = options[key]
    }
  })
  return Page(_options)
}

/**
 * 设置通用的data数据
 */
function beforeData (preOpt, nextOpt) {
  const app = getApp()

  nextOpt.data = Object.assign({}, preOpt.data, {
    qiniuHost: app.globalData.qiniuHost, // 通用七牛云服务器地址
    host: app.globalData.host // 服务器地址
  })
}

/* 
 * 设置onLoad拦截方法
 * --- func 1. 管理登录回调
 */
function beforeOnLoad (preOpt, nextOpt) {
  // onLoad之前执行此方法
  function _beforeOnLoad (cb, ...args) {
    const app = getApp()
    if (!app.globalData.loginPromise) {
      // 未登录事件回调
      app.$bus.$on(BUS_EVENT_NAME.appLaunchLogin, () => {
        cb && cb.call(this, ...args)
      })
    } else {
      cb && cb.call(this, ...args)
    }
  }

  beforeFunc('onLoad', preOpt, nextOpt, _beforeOnLoad)
}

/* 
 * 设置onShow拦截方法
 * --- func 1. 记录进入页面日志操作
 */
function beforeOnShow (preOpt, nextOpt) {
  function _beforeOnShow (cb, ...args) {
    recordPageVisitLog()
    cb && cb.call(this, ...args)
  }

  beforeFunc('onShow', preOpt, nextOpt, _beforeOnShow)
}

/* 
 * 设置onHide拦截方法
 * --- func 1. 发送页面浏览日志
 */
function beforeOnHide (preOpt, nextOpt) {
  function _beforeHide (cb, ...args) {
    sendPageVisitLog(this)
    cb && cb.call(this, ...args)
  }

  beforeFunc('onHide', preOpt, nextOpt, _beforeHide)
}

/* 
 * 设置onUnload拦截方法
 * --- func 1. 发送页面浏览日志
 */
function beforeOnUnload (preOpt, nextOpt) {
  function _beforeUnload (cb, ...args) {
    sendPageVisitLog(this)
    cb && cb.call(this, ...args)
  }

  beforeFunc('onUnload', preOpt, nextOpt, _beforeUnload)
}

/* 
 * 设置分享时的拦截方法
 * --- func 1. 为路径加上shareid值
 */
function beforeOnShareAppMessage (preOpt, nextOpt) {
  // 每一个分享都加上shareid
  function _beforeOnShareAppMessage (cb, ...args) {
    let shareInfo = cb ? cb.call(this, ...args) : { path: getApp().getPagePath() }
    let shareid = wx.getStorageSync('userid') || ''
    let { path, query } = getUrlAndQuery(shareInfo.path)
    shareInfo.path = `${path}?shareid=${shareid}&${query}`;

    return shareInfo
  }

  beforeFunc('onShareAppMessage', preOpt, nextOpt, _beforeOnShareAppMessage)
}

function beforeFunc (name, pre, next, fn) {
  next[name] = function (...args) {
    return fn.call(this, pre[name], ...args)
  }
}

export default _Page

```

`eventBus`为特定给小程序写的app bus事件系统。详细代码在`interview/eventBus`中
