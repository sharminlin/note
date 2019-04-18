# 微信小程序

## 组件

### input

#### 1. focus属性自动聚焦失效
实现一个类似序列号的输入框，思路：将实际的input隐藏，将绑定值按UI分割显示。则用户点击序列号展示框时，设input的focus属性为true，期望自动拉起键盘。

```
<view class="invit-code-box" catch:tap="handleTapInput">
  <block wx:for="{{maxLength}}" wx:key="index">
    <view class="code-input">{{code.length >= index + 1 ? code[index] : ''}}</view>
  </block>
</view>
<input class="code-input-hide" password value="{{value}}" maxlength="{{maxLength}}" focus="{{isFocus}}" bindinput="handleInput" bindblur="handleBlur" />
```

实际操作中发现，当input框设置为`display: none`或者 `width: 0; height: 0; min-height: 0`时，在手机端无法响应。
解决方案：宽高为0时给input框设置`height: 1rpx` 或者 定位移至屏幕外
