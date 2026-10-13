# 图片、src 与 alt

使用一个可离线显示的图片，解释src与alt的职责。

## 图片、src 与 alt是什么意思

img使用src定位图像，alt提供图片的文字替代。img没有结束标签。下面用内嵌SVG小图保证例子离线可用；自己的照片应放在images文件夹并写真实相对路径。

## 图像地址与图像内容不是同一件事

`src` 是图像来源，`alt` 是无法依靠图像时的文字替代，`width` 和 `height` 是展示尺寸。**`alt` 要说明图片提供的信息，不能把文件名当说明。** 本节图像表示“蓝色矩形中的白色圆形”。

本例的 `data:image/svg+xml,...` 是数据地址：图片内容直接放进地址字符串中，`%3C` 等是对特殊字符的编码。你现在不用背这些编码，也不用手写它们；完整复制后先观察图像与 alt 的作用。SVG 是用文字描述形状的图像格式，PNG/JPEG 则通常由像素组成。

换成自己的图片时，在同一练习目录新建 `images`，放入 `photo.png`，把 src 改为 `images/photo.png`，再把 alt 改成对这张图片的有效描述。扩展名和大小写要与实际文件一致。后面会用 CSS 限制展示宽度；设置宽高不会缩小磁盘上的文件体积。

图片是空元素，写一个 `<img ...>` 即可，不要另写 `</img>`。预期出现 120×80 的蓝底白圆。加载失败时的 alt 显示方式可能因浏览器和空间而不同，也可在开发者工具检查属性值。

## 先看一个完整例子

在自己的独立练习文件夹新建 index.html，保存下面完整内容，用浏览器打开。修改后先保存，再刷新。

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>本节小练习</title>
</head>
<body>
<h1>活动示意图</h1>
<!-- 图片数据内嵌，离线也能显示；alt 描述它传达的信息。 -->
<img width="120" height="80" alt="蓝色矩形中的白色圆形" src="data:image/svg+xml,%3Csvg%20xmlns=%22http://www.w3.org/2000/svg%22%20width=%22120%22%20height=%2280%22%3E%3Crect%20width=%22120%22%20height=%2280%22%20fill=%22royalblue%22/%3E%3Ccircle%20cx=%2260%22%20cy=%2240%22%20r=%2220%22%20fill=%22white%22/%3E%3C/svg%3E">
</body>
</html>
```

## 逐步读懂这个例子

图应是蓝底白圆。宽高是图的展示尺寸。alt描述图传达的信息，图片加载失败或使用屏幕阅读器时也有用途。数据地址表示图像内容直接放在文档里，不需要另一个网络请求。

## 自己改一处再观察

将src换成不存在的images/missing.png，观察替代文字；再恢复。

### 参考答案

图片不显示时可看到替代文字，说明图片路径与替代描述是不同工作。

## 本节容易混淆的地方

alt不是鼠标悬停提示。只有装饰用途的图片可用空alt，但信息图应描述其意义。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。
