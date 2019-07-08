# 微信小程序canvas画图常用API封装

``` JS
const SystemInfoRes = wx.getSystemInfoSync()
const rate = 750 / SystemInfoRes.windowWidth

/**
 * 计算实际大小
 * @param {*} size 
 */
export function shiftSize(size) {
  return parseInt(size / rate)
}

/**
 * 文本换行渲染
 * @param {Object} obj
 */
export function textWrap(ctx, {
  x = 0,
  y = 0,
  maxWidth = 640, // 文本域最大宽度
  lineHeight = 40, //行高
  maxLine = 1, // 最多显示几行
  color = '#000',
  size = '16',
  align = 'left',
  baseline = 'top',
  text = '',
  bold = false
}) {
  let tr = getTextLine(ctx, { maxWidth, text, size })

  for (let i = 0; i < tr.length; i++) {
    if (i < maxLine) {
      let txtAttr = {
        x: x,
        y: y + (i * lineHeight),
        color: color,
        size: size,
        align: align,
        baseline: baseline,
        text: tr[i],
        bold: bold
      }

      // 在最大行，且存储的文本数组在下一项还有值，则替换省略号
      if (i == maxLine - 1 && tr[i + 1]) {
        txtAttr.text = txtAttr.text.substring(0, txtAttr.text.length - 3) + '...';
      }

      drawText(ctx, txtAttr);
    } else {
      break;
    }
  }
}

/**
 * 获取文本折行
 * @param {Object} obj
 * @return {Array} arrTr
 */
export function getTextLine(ctx, {
  size = 16,
  text = '',
  maxWidth = 640
}) {
  ctx.setFontSize(size)
  let arrText = text.split('')
  let line = ''
  let arrTr = [] // 一行文本一项

  for (let i = 0; i < arrText.length; i++) {
    var testLine = line + arrText[i]
    var metrics = ctx.measureText(testLine)
    var width = metrics.width

    // 大于最大宽，且不为第一个，则换行
    if (width > maxWidth && i > 0) {
      arrTr.push(line)
      line = arrText[i]
    } else {
      line = testLine
    }

    if (i == arrText.length - 1) {
      arrTr.push(line)
    }
  }

  return arrTr;
}

/**
 * 渲染文字
 * @param {Object} obj
 */
export function drawText(ctx, {
  text = '',
  color = '#fff',
  size = '16',
  align = 'left',
  baseline = 'top',
  family = 'sans-serif',
  bold = false,
  x = 0,
  y = 0
}) {
  ctx.save()
  ctx.setFillStyle(color)
  ctx.setFontSize(shiftSize(size))
  ctx.setTextAlign(align)
  ctx.setTextBaseline(baseline)
  if (bold) {
    ctx.font = `normal bold ${shiftSize(size)}px ${family}`
  }
  ctx.fillText(text, shiftSize(x), shiftSize(y))
  ctx.restore()
}

/**
 * 画一个圆形图片
 */
export function drawCircleImg(ctx, {
  x = 0,
  y = 0,
  size = 50,
  imgPath = '',
  color = '#fff',
  hasShadow = false,
  offsetX = 0,
  offsetY = 0,
  shadowColor = '#f4f4f4',
  shadowBlur = 5
}) {
  let r = size / 2 // 半径
  let center_x = x + r
  let center_y = y + r

  ctx.save()
  ctx.beginPath() // 开始创建一个路径

  ctx.setStrokeStyle(color)

  hasShadow && ctx.setShadow(shiftSize(offsetX), shiftSize(offsetY), shiftSize(shadowBlur), shadowColor)

  ctx.arc(shiftSize(center_x), shiftSize(center_y), shiftSize(r), 0, 2 * Math.PI, false) // 画一个圆形裁剪区域
  ctx.stroke()
  ctx.clip() // 裁剪

  ctx.drawImage(imgPath, shiftSize(x), shiftSize(y), shiftSize(size), shiftSize(size)) // 绘制图片

  ctx.restore()
}

/** 
 * 该方法用来绘制一个有填充色的圆角矩形 
 * @param cxt:canvas的上下文环境 
 * @param x:左上角x轴坐标 
 * @param y:左上角y轴坐标 
 * @param width:矩形的宽度 
 * @param height:矩形的高度 
 * @param radius:圆的半径 
 * @param fillColor:填充颜色 
 **/
export function fillRoundRect(cxt, x, y, width, height, radius, /*optional*/ fillColor) {
  //圆的直径必然要小于矩形的宽高          
  if (2 * radius > width || 2 * radius > height) { return false; }

  cxt.save();
  cxt.translate(x, y);
  //绘制圆角矩形的各个边  
  drawRoundRectPath(cxt, width, height, radius);
  cxt.fillStyle = fillColor || "#000"; //若是给定了值就用给定的值否则给予默认值  
  cxt.fill();
  cxt.restore();
}

/**
 * 该方法用来绘制圆角矩形 
 * @param cxt:canvas的上下文环境 
 * @param x:左上角x轴坐标 
 * @param y:左上角y轴坐标 
 * @param width:矩形的宽度 
 * @param height:矩形的高度 
 * @param radius:圆的半径 
 * @param lineWidth:线条粗细 
 * @param strokeColor:线条颜色 
 **/
export function strokeRoundRect(cxt, x, y, width, height, radius, /*optional*/ lineWidth, /*optional*/ strokeColor) {
  //圆的直径必然要小于矩形的宽高          
  if (2 * radius > width || 2 * radius > height) { return false; }

  cxt.save();
  cxt.translate(x, y);
  //绘制圆角矩形的各个边  
  drawRoundRectPath(cxt, width, height, radius);
  cxt.lineWidth = lineWidth || 2; //若是给定了值就用给定的值否则给予默认值2  
  cxt.strokeStyle = strokeColor || "#000";
  cxt.stroke();
  cxt.restore();
}

function drawRoundRectPath(cxt, width, height, radius) {
  cxt.beginPath(0);
  //从右下角顺时针绘制，弧度从0到1/2PI  
  cxt.arc(width - radius, height - radius, radius, 0, Math.PI / 2);

  //矩形下边线  
  cxt.lineTo(radius, height);

  //左下角圆弧，弧度从1/2PI到PI  
  cxt.arc(radius, height - radius, radius, Math.PI / 2, Math.PI);

  //矩形左边线  
  cxt.lineTo(0, radius);

  //左上角圆弧，弧度从PI到3/2PI  
  cxt.arc(radius, radius, radius, Math.PI, Math.PI * 3 / 2);

  //上边线  
  cxt.lineTo(width - radius, 0);

  //右上角圆弧  
  cxt.arc(width - radius, radius, radius, Math.PI * 3 / 2, Math.PI * 2);

  //右边线  
  cxt.lineTo(width, height - radius);
  cxt.closePath();
}
```