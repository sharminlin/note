# grid 网格布局

## 容器属性

``` css
.container {
  display: grid; // 指定布局类型
  grid-template-columns: 10px 10px 10px; // 指定列宽与列数
  grid-template-rows: 10px 10px 10px; // 指定行高与行数
}
```

### repeat()

接受两个参数，第一个参数是重复的次数，第二个参数是所要重复的值。

``` css
.container {
  display: grid; // 指定布局类型
  grid-template-columns: repeat(3, 10px); // 3列等宽10px
}
```

也可以这样：

``` css
.container {
  grid-template-columns: repeat(2, 10px 20px); // 2*2=4列，展开排列即：10px 20px 10px 20px
}
```

### auto-fill

自动填充次数，针对未知容器宽度根据配置列宽分割列数

``` css
.container {
  grid-template-columns: repeat(auto-fill, 10px 20px); // n*2列，展开排列即：10px 20px 10px 20px ...直至容器放不下
}
```

### fr 比例单位值

`fr`单位值等比例容器剩余空间

``` css
.container {
  display: grid;
  grid-template-columns: 150px 1fr 1fr; // 表示容器有3列，第一列固定150px，二三列1:1等分剩余宽度
}
```

### minmax(min, max)

指定占据的长度范围。

``` css
.container {
  display: grid;
  grid-template-columns: 150px minmax(10px, 1fr) 1fr;
}
```


### auto

不多说，同字面意思，自动

### 网格线的名称

使用方括号`[]`，在长度之前可命名**行列线**的名称，注意是`线`的名字：

``` css
.container {
  display: grid;
  grid-template-columns: [c1] 150px [c2] 10px [c3] 10px [c4];
  grid-template-rows: [r1] 150px [r2] 10px [r3] 10px [r4];
}
```

### grid-gap 行列间距

``` css
.container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  grid-row-gap: 5px; // 行间距
  grid-column-gap: 5px; // 列间距
}
```

```
grid-gap：<grid-row-gap> <grid-column-gap>
```

### grid-template-areas

单元格区域名划分

### grid-auto-flow

划分网格以后，容器的子元素会按照顺序，自动放置在每一个网格。默认的放置顺序是"先行后列"。


- row 先行后列
- column 先列后行
- row-dense 先行后列，但会依次填满空缺
- column-dense 先列后行，但会依次填满空缺

### 设置网格之内的内容的水平垂直位置

属性：

1. justify-items 水平位置
2. align-items 垂直位置

值：

- start：对齐单元格的起始边缘。
- end：对齐单元格的结束边缘。
- center：单元格内部居中。
- stretch：拉伸，占满单元格的整个宽度（默认值）。

简写:`place-items: <align-items> <justify-items>`

### 整个内容区域水平垂直位置

类似于flex的justify-content，属性：

1. justify-content 水平位置
2. align-content 垂直

值：

- start - 对齐容器的起始边框。
- end - 对齐容器的结束边框。
- center - 容器内部居中。
- stretch - 项目大小没有指定时，拉伸占据整个网格容器。
- space-around - 每个项目两侧的间隔相等。所以，项目之间的间隔比项目与容器边框的间隔大一倍。
- space-between - 项目与项目的间隔相等，项目与容器边框之间没有间隔。
- space-evenly - 项目与项目的间隔相等，项目与容器边框之间也是同样长度的间隔。

简写：`place-content: <justify-content> <align-content>;`

### grid-auto-columns/grid-auto-rows

指定游离于网格布局之外的单元格内容


## 项目属性

### 自定义项目占据哪个单元格

- grid-column-start：左边框所在的垂直网格线
- grid-column-end：右边框所在的垂直网格线
- grid-row-start：上边框所在的水平网格线
- grid-row-end：下边框所在的水平网格线

### span

关键字`span`表示该项目占据的单元格个数

``` css
.item-1 {
  grid-column-start: span 2;
}
```

### 简写

- grid-column: start / end
- grid-row: start / end

### grid-area

指定项目放在哪一个区域。和`grid-template-areas`配合

### 指定单元格内容水平垂直位置

- justify-self 单元格内容的水平位置，同`justify-items`，但只作用于指定项目
- align-self 单元格内容的垂直位置，同`align-items`，但只作用于指定项目

简写：`place-self: <align-self> <justify-self>;`
