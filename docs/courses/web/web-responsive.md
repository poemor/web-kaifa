# 媒体查询与移动优先

先做单列，再在空间够时切换两列。

## 媒体查询与移动优先是什么意思

媒体查询按视口等条件启用一组CSS。移动优先是先写小屏默认布局，再用min-width增加宽屏能力；断点依据内容需要决定。

## 用窗口宽度触发一组规则

视口是浏览器用于排版的可见区域；这里关心它有多少 CSS 像素宽。断点是你选择改变布局的阈值，例如 700px。**响应式布局是在空间变化时仍能阅读和操作，不只是把桌面页面缩小。**

`@media (min-width:700px) { ... }` 表示“视口至少 700px 时启用里面的规则”，边界包含 700px。外层规则始终参与，里面的 .cards 规则只追加或覆盖 grid-template-columns。小屏默认一列；宽屏才增加两列。

`meta viewport` 的 width=device-width 让手机使用设备的 CSS 视口宽度，initial-scale=1 指定初始缩放。它不会替你修复固定宽度的内容。

先拖窄浏览器，再按 F12 打开设备工具栏（通常 Ctrl+Shift+M），手动输入 360、768、1440 的宽度。检查标题、卡片、键盘操作和横向滚动，并在 699/700/701px 核对断点。将断点改为 900px 后，768px 应回到单列。

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
/* 基础规则给所有宽度使用，未声明多列时自动形成一列。 */
.cards { display: grid; gap: 12px; }
article { padding: 16px; background: #edf2f7; }
/* 视口宽度达到 700px 才添加两列，不靠手机型号判断。 */
@media (min-width: 700px) { .cards { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  </style>
</head>
<body>
<div class="cards"><article>活动一</article><article>活动二</article></div>
</body>
</html>
```

## 逐步读懂这个例子

小于700px时没有显式两列声明，默认一列。达到700px后启用两列规则。viewport声明使手机按真实CSS视口宽度解释规则，而非缩放一张桌面图。

## 自己改一处再观察

在360、768、1440px观察列数，再把断点改成900px。

### 参考答案

原版分别一列、两列、两列；900px版本的768px回到一列。

## 本节容易混淆的地方

设备模拟是检查方式之一，不能凭某个手机型号认定所有宽度都适配。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：为三张课程卡选择断点

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用 Grid、minmax/repeat、媒体查询、viewport 及已学文本/盒模型，不加入 JavaScript。

独立写三张新课程卡，先让所有宽度都是可读单列，再选择一个你认为能放下两列的阈值。写下选择理由与阈值前、恰好阈值、阈值后的预期，之后才添加自己的媒体查询。

自查：窄时三卡竖排，空间达到自己阈值后两列且第三卡进入下一行。测试阈值−1、阈值、阈值+1 和 320/768/1440px；放大文字仍能读完内容，不靠隐藏溢出遮住卡片。阈值依据内容空间，不能仅写“因为某个手机型号”。
