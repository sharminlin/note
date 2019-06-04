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
