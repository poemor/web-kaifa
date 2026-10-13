# 链接与相对路径

区分外部地址、同目录文件与页面内锚点。

## 链接与相对路径是什么意思

a元素表示链接，href给出目标。以https://开头的是完整地址；about.html是当前目录中的文件；#events定位本页id为events的元素。

## 浏览器如何找到链接目标

**`href` 是目标地址；链接文字是给人看的说明。** `<a href="#events">查看活动</a>` 不会创建活动，它只让浏览器找已经存在的目标。

| 地址写法 | 浏览器如何理解 |
| --- | --- |
| `https://developer.mozilla.org/` | 完整的网上地址，含协议和主机名 |
| `about.html` 或 `./about.html` | 当前 HTML 所在目录中的另一个文件 |
| `images/photo.png` | 当前目录下 images 子目录中的图片文件 |
| `../index.html` | 先回到上一级目录，再找 index.html |
| `#events` | 当前文档内 `id="events"` 的位置 |

点击本例链接后，地址栏末尾会出现 `#events`。页面内容很短时，目标已经在屏幕内，可能看不到明显滚动；可以先确认地址和目标 id，而不是据此判断链接没有工作。目标的 `id` 不写井号，井号属于地址的片段部分。

用 Tab 聚焦链接、Enter 激活，也应该得到同一目标。外部地址需要联网；本页锚点不需要额外联网。移动文件到另一个目录后，要重新核对所有相对路径。

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
<h1>社团介绍</h1>
<!-- href 中的 # 表示寻找本页 id 为 events 的位置。 -->
<a href="#events">查看活动</a>
<!-- 这里才是真正存在的链接目标；id 的值不包含 #。 -->
<h2 id="events">周末活动</h2>
<p>一起练习网页。</p>
</body>
</html>
```

## 逐步读懂这个例子

点击链接后地址增加#events，浏览器定位到目标。href中的井号表示页面内位置，目标元素的id只写events。实际跳转新页面要创建那个文件，写文件名不是创建文件。

## 自己改一处再观察

把目标id改为schedule，先只改目标，观察失效；再同步修改href。

### 参考答案

不同名时定位失效，两处一致后恢复。

## 本节容易混淆的地方

相对路径依据当前HTML文件的位置解释。电脑盘符地址不能当成别人也能使用的网址。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：两张页面之间往返

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用已学的完整 HTML、a、href、id；不需要新的分区标签。

在新目录保存 index.html 和 about.html。首页有“关于这个练习”的链接，关于页有“回到首页”的链接；首页还要有一个跳到正文 h2 的页面内链接。先画出两个文件和三个目标的关系，再自行写地址。

自查：两次跳转后地址分别是 about.html 与 index.html，页内跳转增加与 h2 的 id 一致的 #片段。只把 about.html 移到新建的 pages 子目录，旧链接应失效；自行修正路径后往返恢复。记录每个地址相对哪份文件，不把电脑盘符当通用网址。
