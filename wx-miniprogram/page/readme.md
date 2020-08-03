# 重写的小程序Page函数

## 功能

1. 注入预置`data`数据
2. 注入小程序生命周期，支持异步同步
3. 注入`$watch`，支持watch监听
4. 支持事件`BUS`中心
5. 支持`mixins`方法注入
6. ...

## 使用示例

``` js
import { CreatePage } from './index'
import {
  handleNavigateTo
} from './handlers'
import { BUS_EVENT_NAME } from '../utils/constant'
import { getUrlAndQuery } from '../utils/query'
import { getPagePath } from '../utils/util'
import { recordPageVisitLog, sendPageVisitLog } from './fineIO'

function createPage () {
  const page = new CreatePage({
    data () {
      return {
        qiniuHost: getApp().globalData.qiniuHost, // 通用七牛云服务器地址
        host: getApp().globalData.host
      }
    },
  
    onLoad: {
      beforeHandler: function () {
        return new Promise(resolve => {
          if (!getApp().globalData.loginPromise) {
            getApp().$bus.$on(BUS_EVENT_NAME.appLaunchLogin, () => {
              resolve()
            })
          } else {
            resolve()
          }
        })
      },
      async: true
    },
  
    onShow () {
      recordPageVisitLog()
    },

    onHide () {
      getApp().$bus.$off(BUS_EVENT_NAME.sessionShopId)
      sendPageVisitLog(this)
    },

    onUnload () {
      sendPageVisitLog(this)
    },

    onShareAppMessage: {
      afterHandler (result) {
        let shareInfo = result || { path: getPagePath() }
        let shareid = wx.getStorageSync('userid') || ''
        let openid = wx.getStorageSync('openid') || ''
        let { path, query } = getUrlAndQuery(shareInfo.path)
        shareInfo.path = `${path}?openid=${openid}&shareid=${shareid}&${query}`;
        // console.log(shareInfo)
        return shareInfo
      }
    }
  })

  page.mixins({
    handleNavigateTo
  })

  return page
}

export default createPage
```
