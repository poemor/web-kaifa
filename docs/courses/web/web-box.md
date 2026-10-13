# 盒模型与 box-sizing

手算内容、内边距与边框合成的实际宽度。

## 盒模型与 box-sizing是什么意思

元素的盒子由内容、padding、border组成，margin在盒子外。默认content-box的width只指定内容宽；border-box让width包含内边距与边框。

## 从里面往外数四层

盒子从里面往外是：内容 content → 内边距 padding → 边框 border → 外边距 margin。内容是文字或图片；padding 是内容和边框之间的空隙；border 是包住它们的线；margin 隔开相邻盒子。

**content-box 的 width 是内容宽度；border-box 的 width 包含内容、padding 与 border。** 两者都不把 margin 算进声明的宽度。`padding:20px` 表示上下左右各 20px。`border:1px solid` 是简写，分别是线宽 1px、实线，颜色未写时使用当前文字颜色。

默认 content-box：300+20+20+1+1=342px。改为 border-box：整体 300px，内容=300−20−20−1−1=258px。这里“整体”指边框外边缘之间的宽度，不含 margin。

按 F12，Elements 中选中 card，找 Computed 的盒模型图；分别查看内容、内边距和边框。先在纸上算，再测。这个固定宽度只是测量实验；在手机窗口中若连同页面边距超过可用空间，后面的响应式章节会处理。

## 先看一个完整例子

在自己的独立练习文件夹新建 index.html，保存下面完整内容，用浏览器打开。修改后先保存，再刷新。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>本节小练习</title>
  <style>
/* content-box：300 内容宽 + 左右 padding 40 + 左右 border 2 = 342px。 */
.card { width: 300px; padding: 20px; border: 1px solid; box-sizing: content-box; }
  </style>
</head>
<body>
<!-- div 是普通容器；card 类用来选择这一个盒子。 -->
<div class="card">活动卡片</div>
</body>
</html>
```

## 逐步读懂这个例子

内容宽300px，两侧padding各20px，边框各1px，总宽342px。改为border-box后，总宽300px，内容宽258px。margin增加外部间距，不计入border-box声明的300px内部。

## 自己改一处再观察

在开发者工具中查看宽度，改为border-box再测；将padding改成30px再预测。

### 参考答案

content-box总宽362px；border-box仍总宽300px，内容238px。

## 本节容易混淆的地方

示例刻意固定300px用于测量，在320px手机且页面有边距时可能溢出。正式布局需给max-width或适应容器。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：做一张可手算的价格牌

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用盒模型、width、padding、border 和两种 box-sizing，不要求布局工具。

独立写一个价格牌盒子，声明宽度 240px、四边 padding 12px、边框 2px。先分别预测 content-box 和 border-box 的内容宽、边框外缘宽度，再创建自己的 HTML/CSS 并测量；可以另给 margin，但必须区分其范围。

自查：content-box 内容为 240px、外缘 268px；border-box 外缘 240px、内容 212px。外边距不计入上述两种外缘宽。Computed 盒模型图应与计算一致，不把阴影或 margin 当成内容。
