# 微信小程序canvas画图常用API封装(旧版canvas)

微信小程序canvas的api在基础版本2.9.0后加入了新的canvas 2d，这里是以前的api常用画图封装，有点凌乱。新的之后再来整理一个更好的。

``` JS
const SystemInfoRes = wx.getSystemInfoSync()
const rate = 750 / SystemInfoRes.windowWidth

/**
 * 计算实际宽度
 * @param {*} width 
 */
export function shiftSize (width) {
  return parseInt(width / rate)
}

export function shiftWidth (width) {
  return parseFloat(width / rate)
}

export function shiftStandard (width) {
  return parseFloat(width / 2)
}

export const getCanvasImg = function (url) {
  return new Promise(function(resolve, reject) {
    wx.getImageInfo({
      src: url,
      success: function(res) {
        resolve(res);
      },
      fail: function (res) {
        reject(res)
      }
    })
  });
}

export function crxToImgPath (canvasId) {
  return new Promise(resolve => {
    wx.canvasToTempFilePath({
      canvasId: canvasId,
      success: function (res) {
        resolve(res.tempFilePath)
      }
    })
  })
}

export function drawLine (ctx, {
  x1 = 0,
  y1 = 0 ,
  x2 = 0,
  y2 = 0,
  lineWidth = 1,
  lineDash = 0,
  color = '333'
}) {
  ctx.save()
  ctx.beginPath()
  ctx.strokeStyle = color
  ctx.lineWidth = shiftWidth(lineWidth)
  ctx.setLineDash(lineDash) 
  ctx.moveTo(shiftSize(x1), shiftSize(y1))
  ctx.lineTo(shiftSize(x2), shiftSize(y2))
  ctx.stroke()
  ctx.closePath();
  ctx.restore()
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
  return tr.length
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
  ctx.font = `${shiftSize(size)}px sans-serif`
  ctx.setFontSize(shiftSize(size))
  let arrText = text.split('')
  let line = ''
  let arrTr = [] // 一行文本一项

  for (let i = 0; i < arrText.length; i++) {
    var testLine = line + arrText[i]
    var metrics = ctx.measureText(testLine)
    var width = metrics.width

    // 大于最大宽，且不为第一个，则换行
    if (width >= shiftSize(maxWidth) && i > 0) {
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
  family = 'PingFang-SC-Regular',
  bold = false,
  x = 0,
  y = 0
}) {
  ctx.font = `normal ${bold ? 'bold' : 'normal'} ${shiftSize(size)}px ${family}`
  ctx.setFillStyle(color)
  // ctx.fillStyle = color
  ctx.setTextAlign(align)
  ctx.setTextBaseline(baseline)
  ctx.fillText(text, shiftWidth(x), shiftWidth(y))
}

/**
 * 返回文本分行和长度
 * @param {*} ctx 
 * @param {*} text 
 * @param {*} width 
 */
export function cvsMeasureTextAndWidth (ctx, text, width) {
  let tmp = [];
  let tmp_w = 0;
  let char_array = text.split("");
  let str = "";
  for(let i = 0; i < char_array.length; i++){
    let w = ctx.measureText(char_array[i]).width;
    tmp_w += w;
    if(tmp_w <= width){
      str += char_array[i];
    } else {
      tmp.push({ str, width: tmp_w - w });
      tmp_w = w;
      str = char_array[i];
    }
    if (i >= char_array.length - 1) {
      if(str != ""){
        tmp.push({ str, width: tmp_w });
      }
    }
  }
  return tmp;
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
 * 画一个带圆角的图片
 */
export function drawRectImg(ctx, x, y, width, height, radius, imgPath) {
  if (2 * radius > width || 2 * radius > height) { return false; }

  ctx.save();
  ctx.beginPath()
  ctx.strokeStyle = 'transparent';
  //绘制圆角矩形的各个边
  drawRoundRectPath(ctx, x, y, width, height, radius);
  ctx.stroke();
  ctx.clip() // 裁剪
  ctx.drawImage(imgPath, x, y, width, height) // 绘制图片
  ctx.closePath()
  ctx.restore();
}

/**该方法用来绘制一个有填充色的圆角矩形 
  *@param ctx:canvas的上下文环境 
  *@param x:左上角x轴坐标 
  *@param y:左上角y轴坐标 
  *@param width:矩形的宽度 
  *@param height:矩形的高度 
  *@param radius:圆的半径 
  *@param fillColor:填充颜色 
  **/
export function fillRoundRect (ctx, x, y, width, height, radius, /*optional*/ fillColor) {
  //圆的直径必然要小于矩形的宽高          
  if (2 * radius > width || 2 * radius > height) { return false; }

  ctx.save();
  ctx.beginPath()
  ctx.lineWidth = 0
  // ctx.fillStyle = fillColor || "#000"; //若是给定了值就用给定的值否则给予默认值
  ctx.setFillStyle(fillColor)
  //绘制圆角矩形的各个边  
  drawRoundRectPath(ctx, x, y, width, height, radius);
  ctx.fill();
  ctx.closePath()
  ctx.restore();
}


/**该方法用来绘制圆角矩形 
  *@param ctx:canvas的上下文环境 
  *@param x:左上角x轴坐标 
  *@param y:左上角y轴坐标 
  *@param width:矩形的宽度 
  *@param height:矩形的高度 
  *@param radius:圆的半径 
  *@param lineWidth:线条粗细 
  *@param strokeColor:线条颜色 
 **/
export function strokeRoundRect(ctx, x, y, width, height, radius, /*optional*/ lineWidth, /*optional*/ strokeColor) {
  //圆的直径必然要小于矩形的宽高          
  if (2 * radius > width || 2 * radius > height) { return false; }
  ctx.save()
  ctx.beginPath()
  //绘制圆角矩形的各个边  
  ctx.lineWidth = lineWidth || 2; //若是给定了值就用给定的值否则给予默认值2
  ctx.lineDashOffset = 0
  ctx.strokeStyle = strokeColor || "#000";

  drawRoundRectPath(ctx, x, y, width, height, radius);
  ctx.stroke();
  ctx.closePath()
  ctx.restore()
}

function drawRoundRectPath(ctx, x, y, w, h, r) {
  // ctx.setStrokeStyle('transparent')
  // 左上角
  ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5)
  
  // border-top
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  // ctx.lineTo(x + w, y + r)
  // 右上角
  ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2)
  
  // border-right
  ctx.lineTo(x + w, y + h - r)
  // ctx.lineTo(x + w - r, y + h)
  // 右下角
  ctx.arc(x + w - r, y + h - r, r, 0, Math.PI * 0.5)
  
  // border-bottom
  ctx.lineTo(x + r, y + h)
  // ctx.lineTo(x, y + h - r)
  // 左下角
  ctx.arc(x + r, y + h - r, r, Math.PI * 0.5, Math.PI)
  
  // border-left
  ctx.lineTo(x, y + r)
  // ctx.lineTo(x + r, y)
}

/**
 * 画一个带边框的文字
 * @param textY: 文字y坐标
 * @param boxX: 边框x坐标
 * @param boxY: 边框y坐标
 */
export function drawTextRoundRect (ctx, {
  text = '',
  textY,
  boxX,
  boxY,
  size = 16,
  paddingLeft = 0,
  paddingRight = 0,
  radius = 0,
  color = '#000',
  bold = false,
  lineHeight,
  boxHeight,
  family,
  lineWidth = 1,
  lineColor,
  fillColor,
  baseline
}) {
  if (!text) return 0
  ctx.save()
  ctx.setFontSize(size);
  ctx.setTextAlign('left');
  var boxWidth = ctx.measureText(text).width + paddingLeft + paddingRight;

  if (fillColor) {
    fillRoundRect(ctx, shiftSize(boxX), shiftSize(boxY), shiftSize(boxWidth), shiftSize(boxHeight), shiftSize(radius), fillColor)
  } else {
    strokeRoundRect(ctx, shiftSize(boxX), shiftSize(boxY), shiftSize(boxWidth), shiftSize(boxHeight), shiftSize(radius), shiftWidth(lineWidth), lineColor)
  }
  drawText(ctx, {text, x: boxX + paddingLeft, y: textY, bold, size, text, family, color, baseline})
  ctx.restore()
  return boxWidth
}

/**
 * 根据模式画图
 * mode：
 * fit 保持纵横比缩放图片，使图片的长边能完全显示出来
 * fill 保持纵横比缩放图片，只保证图片的短边能完全显示出来
 * 
 * img: ImageInfo = { path: string, widht: number, height: number }  图片信息
 */
export function drawImageByMode (ctx, mode = 'fill', {
  dx = 0, dy = 0, dw = 0, dh = 0, // 图片容器坐标及宽高
  img, radius = 0
}) {
  if (!dw || !dh || !img) {
    throw new Error('Invalid params dw/dh/img')
    return
  }

  const dAspectRadio = dw / dh // 图片容器宽高比
  const sAspectRadio = img.width / img.height // 图片宽高比
  let imageArgs = []
  if (sAspectRadio > dAspectRadio) {
    // 表示图片宽过长
    if (mode === 'fill') {
      // fill-取短边，用sx截取宽度
      const sWidth = img.height * dAspectRadio
      imageArgs = [
        (img.width - sWidth) / 2, 0, sWidth, img.height,
        shiftSize(dx), shiftSize(dy), shiftSize(dw), shiftSize(dh)
      ]
    } else if (mode === 'fit') {
      // fit 取长边，画图坐标往下移
      const sHeight = img.width / dAspectRadio
      imageArgs = [
        0, 0, img.width, sHeight,
        shiftSize(dx), shiftSize(dy + (dh - dw / sAspectRadio) / 2), shiftSize(dw), shiftSize(dh)
      ]
    }
  } else {
    // 表示图片高过长
    if (mode === 'fill') {
      // fill-取短边，用sy截取高度
      const sHeight = img.width / dAspectRadio
      imageArgs = [
        0, (img.height - sHeight) / 2, img.width, sHeight,
        shiftSize(dx), shiftSize(dy), shiftSize(dw), shiftSize(dh)
      ]
    } else if (mode === 'fit') {
      // fit 取长边，画图坐标往右移
      const sWidth = img.height * dAspectRadio
      imageArgs = [
        0, 0, sWidth, img.height,
        shiftSize(dx + (dw - dh * sAspectRadio) / 2), shiftSize(dy), shiftSize(dw), shiftSize(dh)
      ]
    }
  }

  ctx.save();
  ctx.beginPath()
  ctx.strokeStyle = 'transparent';
  //绘制圆角矩形的各个边
  drawRoundRectPath(ctx, shiftSize(dx), shiftSize(dy), shiftSize(dw), shiftSize(dh), shiftSize(radius));
  ctx.stroke();
  ctx.clip() // 裁剪
  ctx.drawImage(img.path, ...imageArgs) // 绘制图片
  ctx.closePath()
  ctx.restore();
}

```