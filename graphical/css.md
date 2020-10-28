# animation

## 1 animation-name
## 2 animation-duration 指定周期时长
## 3 animation-timing-function

运动速度曲线

1. Keyword values
  - ease 以低速开始，然后加快，在结束前变慢
  - ease-in 以低速开始
  - ease-out 以低速结束
  - ease-in-out 以低速开始和结束
  - linear 恒速
  - step-start 
  - step-end
2. Function values
  - cubic-bezier(0.1, 0.7, 1.0, 0.1) 三次贝塞尔
  - steps(4, end)
  - frames(10)
3. Multiple animations
  - ease, step-start, cubic-bezier(0.1, 0.7, 1.0, 0.1)
4. Global values
  - inherit
  - initial
  - unset

## 4 animation-delay 动画延时
## 5 animation-iteration-count

动画执行次数：infinite | number

## 6 animation-direction 运动方向

- normal 每个循环内动画向前循环
- alternate 从起始开始，动画交替反向运行
- reverse 每个循环内反向运行动画
- alternate-reverse 从尾部开始，动画交替反向运行

## 7 animation-fill-mode

设置CSS动画在执行之前和之后如何将样式应用于其目标

- none 当动画未执行时，动画将不会将任何样式应用于目标。这是默认值。
- forwards 目标将保留由执行期间遇到的最后一个关键帧计算值
- backwards 动画将在应用于目标时立即应用第一个关键帧中定义的值
- both 动画将遵循forwards和backwards的规则，从而在两个方向上扩展动画属性

## 8 animation-play-state

动画是否运行或者暂停，它的值可以被设置为暂停和恢复的动画的重放

- running 运行
- paused 停止

# transition

指定为一个或多个 CSS 属性的过渡效果。

- transition-delay 过渡延时
- transition-duration 过渡时间
- transition-property 属性：`all` | `none` | css属性
- transition-timing-function 过渡速度曲线 同`animation-timing-function`

# transform

## 平移 translate

- `translate(x, y)`，2D变换，沿坐标轴移动指定距离
- `translate3d(x, y)`，3D变换，沿坐标轴移动指定距离
- `translateX()`、`translateY()`、`translateZ()`

## 旋转 rotate

- `rotate(angle)` 2D变换中，顺时针旋转angle角度
- `scale3d(x, y, z)` 3D变换中，相应坐标轴选择角度，左手法则
- `rotateX(angle)`、`rotateY(angle)`、`rotateZ(angle)`

## 缩放 scale

- `scale(x, y)` 2D变换，根据x，y坐标轴的方向，缩小放大相应倍数
- `scale3d(x, y, z)` 3D变换
- `scaleX()`、`scaleY()`、`scaleZ()`

## 倾斜 skew

`skew(x, y)` 根据指定坐标轴翻转角度，元素翻转给定的角度

## matrix

`matrix(1, 0, 0, 1, tx, ty)  ===  translate(tx + "px", ty + "px")`
`matrix(sx, 0, 0, sy, 0, 0)  ===  scale(sx, sy)`
`matrix(cosθ, sinθ, -sinθ, cosθ, 0, 0)  ===  rotate(θ + "deg")`
`matrix(1, tan(θy), tan(θx), 1, 0, 0)  === skew(θx + "deg", θy + "deg")`
