# 小程序 瀑布流的实现方式
业务希望在小程序中实现左右两栏瀑布流的块展示。

## 尝试
首先我们尝试使用css3的`column`特性。`column`具有几个属性，在这里不做过多赘述。瀑布流中主要使用`column-count`和`column-gap`。<br />

属性 | 作用
:-: | :-:
column-count | 将子元素块分为几列
column-gap | 列之间的间隔

根据需求，我们将给成两列，列之间间隔为20rpx，使用如下：
``` css
.water-fall {
  column-count: 2;
  column-gap: 20rpx;
}
```

同时，我们需要给子元素（注意不是列元素，是列元素中的子元素，即展示的子块）加入一个名叫`break-inside`的属性。
``` css
break-inside: auto | avoid | avoid-page | avoid-column;
```

属性值 | 描述
:-: | :-:
auto | 指定在元素中不强制也不禁止分页/分栏符
avoid | 指定在元素中避免产生分页/分栏符
avoid-page | 指定在元素中避免产生分页/分栏符
avoid-column | 指定避免在元素内部出现列分隔符。
avoid-region | 指定避免在元素内出现区域分隔符。
inherit | 继承

在这里，我们使用`avoid`。使上下元素可以填充空白区域
``` css 
.item {
  break-inside: avoid
}
```

到此为止，已经实现两栏分布的瀑布流展示。

## 问题
由于是结合了滚动加载的逻辑，在上述的实现方法之下，会出现`瀑布流加载顺序`的问题。即<br />
**column实现将预先排列左边第一列，再依次排列右侧，如下，数字表示数组元素下标**

| | |
| -- | -- |
| 0 | 4 |
| 1 | 5 |
| 2 | 6 |
| 3 | 7 |

这种情况无法暂时解决，因此准备换一种思路实现。

## 别路
在布局上，将瀑布块分成两列view，分别渲染两个list。`cell-item`为展示的单元模块。

``` html
<view class="water-fall clearfix">
  <view class="fall-left" id="fall-left">
    <block wx:for="{{wineLeftList}}" wx:key="index" wx:for-item="item" wx:if="{{item}}">
      <cell-item wine="{{item}}"></cell-item>
    </block>
  </view>

  <view class="fall-right" id="fall-right">
    <block wx:for="{{wineRightList}}" wx:key="index" wx:if="{{item}}">
      <cell-item wine="{{item}}"></cell-item>
    </block>
  </view>
</view>
```

``` scss
.waterfall {
  padding: 0 20rpx;

  .fall-left, .fall-right {
    width: 345rpx;
  }
  .fall-left {
    float: left;
  }
  .fall-right {
    float: right;
  }
}
```
在每次得到一个预渲染的单元模块之后，再计算当前左右列的高度，将之加入到该列对应`list`中。

``` JS
{
  dealWaterList (list) {
    list.map(item => {
      let leftHeight = 0
      let rightHeight = 0
      let leftLen = this.data.wineLeftList.length
      let rightRight = this.data.wineRightList.length
      let query = wx.createSelectorQuery()

      // 取得高度
      query.select('#fall-left').boundingClientRect(rect => {
          leftHeight = rect.height
        }).select('#fall-right').boundingClientRect(rect => {
          rightHeight = rect.height
        }).exec()
      
      ;
      leftHeight <= rightHeight
        ? this.setData({ [`wineLeftList[${leftLen}]`]: item })
        : this.setData({ [`wineRightList[${rightRight}]`]: item })
    })
  }
}
```

## 问题
上述逻辑看似OK，但忽略了一个问题，也就是在获取当前列高的时候，使用的`selector`方法是异步的。因此会产生一个`循环异步`的问题。<br />
可能第一反应是使用闭包，但在这里，循环的顺序是有序的，下一个循环必须等上一个循环执行完，才可以获取到新的列的高度。因此使用`async/await`实现同步阻塞循环。

## 解决
这里是解决之后的JS。

``` JS
{
  async dealWaterList (list) {
    let listLen = list.length

    for (let i = 0; i < listLen; i++) {
      let item = list[i]
      let { leftHeight, rightHeight } = await this.getWaterLRHeight()
      let leftLen = this.data.wineLeftList.length
      let rightRight = this.data.wineRightList.length

      ;
      leftHeight <= rightHeight
        ? this.setData({ [`wineLeftList[${leftLen}]`]: item })
        : this.setData({ [`wineRightList[${rightRight}]`]: item })
    }
  },

  // 获取列左右栏高度
  getWaterLRHeight () {
    return new Promise(resolve => {
      let leftHeight = 0
      let rightHeight = 0
      let query = wx.createSelectorQuery()

      query.select('#fall-left').boundingClientRect(rect => {
          leftHeight = rect.height
          console.log('left')
        }).select('#fall-right').boundingClientRect(rect => {
          rightHeight = rect.height
          console.log('right')
        }).exec(() => {
          resolve({ leftHeight, rightHeight })
        })
    })
  }
}
```

**顺便一提：**
1. 小程序的`selector`中的`exec`函数，表示在当前`selector`调用响应完全之后执行的回调函数。
2. 在添加单元块时，不使用`push`。因为会造成整个数组的重渲染。因此在某些场合尽量避免使用`push`
3. 因为单元块里面其实包含图片（其实大多数都是包含图片的- -），请使用小程序`image`组件的`mode`为`widthFix`。缩放模式，宽度不变，高度自动变化，保持原图宽高比不变。你便不必再去对图片的高度进行计算了。
4. 给单元块加一个动画也许会更友好。
``` css
.item {
  animation: waterImage 4s;
}

@keyframes waterImage {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```
