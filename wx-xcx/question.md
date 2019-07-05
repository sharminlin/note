# 微信小程序

## 组件

### button

#### 1. 样式覆盖
当button需要自定义ui时，需要覆盖原生样式

``` css
.btn {
  display: inline-block;
  padding: 0;
  margin: 0;
  font-size: 30rpx;
  background-color: #fff;
}
.btn::after {
  border: 0;
}
```

### input

#### 1. height高度
小程序input框有一个最小高度 `min-height: 1.4rem;` 当设置height小于该值时，自然无反应

``` css
min-height: 0
```

#### 2. focus属性自动聚焦失效
实现一个类似序列号的输入框，思路：将实际的input隐藏，将绑定值按UI分割显示。则用户点击序列号展示框时，设input的focus属性为true，期望自动拉起键盘。

``` html
<view class="invit-code-box" catch:tap="handleTapInput">
  <block wx:for="{{maxLength}}" wx:key="index">
    <view class="code-input">{{code.length >= index + 1 ? code[index] : ''}}</view>
  </block>
</view>
<input class="code-input-hide" password value="{{value}}" maxlength="{{maxLength}}" focus="{{isFocus}}" bindinput="handleInput" bindblur="handleBlur" />
```

实际操作中发现，当input框设置为`display: none`或者 `width: 0; height: 0; min-height: 0`时，在手机端无法响应。<br />
解决方案：宽高为0时给input框设置`height: 1rpx` 或者 定位移至屏幕外

### textarea
#### placeholder显示在遮罩层之上
这个属于微信原生bug，解决方案是当显示遮罩时，将textarea隐藏，关闭时显示。暂时还没有更好的解决方案。

#### 在一个fixed弹窗层中，按住textarea滑动会使得其中文字随页面同时滑动
按照官网的解释，需要在textarea中添加fixed属性。<br />
**但是如果弹窗中包含滚动区域，会出现另一种不预知的情况：textarea中的文字固定在页面上，无法滚动**。在经过各种办法之后依然无法解决这种场景下的BUG，无奈只好使用view+input做一个伪装的textarea输入效果。

### image

#### 1. display: inline-block
当图片设置为行内模块时，与行内文字未对齐。<br />
使用`vertical-align: top`，使其与文字顶线对齐即可

## 样式

#### 背景图设置
wxss中无法设置路径图片，必须写入base64格式。可以写在行内样式中并且使用网络图片**注意必须是https链接，且是合法域名**

## API
### wx.switchTab
该API在跳转时，无法携带参数。因此必须避免tabBar页面需要参数。

### 提示 wx.showToast、wx.showModal、wx.showLoading
由于多数时候，在后台请求出错时，会使用showToast来提示，但是后台传过来的msg为`null`，导致控制台报错，小程序直接死掉。<br />
一看官方文档，这三个API的title为必填值，实在非常之坑。使用时一定要注意。

### onShareAppMessage页面分享回调
业务需要在分享时，生成一个动态的图片。该动态图片预使用canvas画图，生成imgPath。<br />
预期在分享时生成，因此引入了async/await特性，然而该`onShareAppMessage`回调为同步执行，在await时，该函数并没有阻塞分享的交互。大坑- -

### wx.downloadFile下载文件
调用该api会返回一个临时文件路径，之后再调用wx.saveFile可以保存至本地沙盒目录。但是此时在手机上寻找该文件简直是一件几乎不可能的事情。因此考虑使用wx.openDocument打开预览文件，此时用户可发送文件。<br />

到此为止一切都很顺利，唯一的不友好的地方在于downloadFile获取到的文件名为压缩过的乱码。在一系列寻找问题之后，找到微信操作文件对象`FileSystemManager`，使用其函数renameSync可以更改文件名。<br />

第一次尝试：`wx.downloadFile` -> `wx.saveFile` -> `rename` -> `wx.openDocument`。结果直接报错，无权限更改文件。再次努力寻找解决方法后，终于得见曙光，以下是代码实现
```JS
wx.downloadFile({
  url: '', // 服务器文件路径
  success (res) {
    wx.hideLoading()
    if (res.statusCode === 200) {
      let catalog = wx.env.USER_DATA_PATH // 微信文件缓存目录

      // 源文件名
      let originalFile = truncationFile(that.data.actualDetail.offerUrl) // truncationFile该方法分割文件目录和文件名，文件名带斜杠，此处不贴上了
      let newPath = catalog + originalFile.fileName

      // 重名名
      let FileSystemManager = wx.getFileSystemManager()
      FileSystemManager.renameSync(res.tempFilePath, newPath)

      // 预览
      wx.openDocument({
        filePath: newPath,
        success: function(res) {
          console.log('打开文档成功')
        },
        fail: function(res) {
          console.log(res);
        },
        complete: function(res) {
          console.log(res);
        }
      })
    }
  },
  fail: function () {
    wx.hideLoading()
    wx.showToast({ icon: 'none', title: '下载失败' })
  }
})
```

### wx.requestPayment 调用支付
前台发起订单，后台调用微信api生成支付信息，返回支付参数，前端再使用`wx.requestPayment`发起支付。<br />
需要注意的是该api的所有非function入参都是string，另外其中`package`的值为`统一下单接口返回的 prepay_id 参数值，提交格式如：prepay_id=***`。不正确会报error: total_fee is invalide。好吧，这是没认真看文档的错~~
