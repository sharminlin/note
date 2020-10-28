# transition
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
