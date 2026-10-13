# 文字样式与长度单位

用rem、百分比和行高控制一小段正文。

## 文字样式与长度单位是什么意思

px表示CSS像素；rem相对根元素字号；百分比取决于属性所参照的容器；没有单位的line-height是当前字号的倍数。先用可读正文理解单位，再组合复杂响应式。

## 用具体数字理解单位

**单位必须连在数字后面：写 `16px`，不能写成 `16 px`。** px 是 CSS 像素，不一定等于屏幕硬件的一个像素；rem 以根元素 html 的字号为参照。根字号 16px 时，1rem=16px、30rem=480px。

`font-size` 控制字号；`line-height:1.7` 是当前字号的 1.7 倍，16px 的文字对应约 27.2px 行高。`margin:1rem` 在四边留外部间距；`max-width:30rem` 只是宽度上限，小屏可比这个更窄。

百分比要问“这个属性相对谁”：普通块元素的 `width:50%` 通常按包含它的容器宽度算；`font-size:120%` 按父元素的字号算。`50%` 不自动表示半个屏幕。`em` 通常相对当前字号，用在 font-size 时相对父字号。

打开开发者工具，点选 p，在 Computed 查看 font-size 和 line-height；缩窄窗口，观察是否自然换行。例子不锁死高度，文字变大时内容应能继续占据需要的空间。

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
/* 根字号为 16px，因此本例的 1rem 等于 16px。 */
html { font-size: 16px; }
/* 外边距随根字号变化；max-width 设上限；无单位行高随当前字号变化。 */
body { margin: 1rem; max-width: 30rem; line-height: 1.7; }
p { font-size: 1rem; }
  </style>
</head>
<body>
<h1>阅读练习</h1>
<p>正文应该有足够的行高和边距，让内容容易阅读。试着缩窄窗口，观察文字如何换行。</p>
</body>
</html>
```

## 逐步读懂这个例子

根字号16px时，1rem等于16个CSS像素，30rem约480px。无单位行高1.7随文字字号变化。max-width给出上限，而不是要求小屏也固定480px。

## 自己改一处再观察

根字号改成20px，再比较1rem边距与正文大小。

### 参考答案

1rem随根字号变成20px；固定px值不会自动按同样比例改变。

## 本节容易混淆的地方

不要把所有百分比都解释成屏幕百分比，也不要以缩小字体解决小屏溢出。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：比较可缩放文字与固定文字

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用 rem/px、max-width、font-size、line-height 与已经讲过的选择器。

新写两个短阅读区：第一段用 1.25rem 字号、1.6 无单位行高与 24rem 宽度上限；第二段用 12px 字号。根字号先由你设为 16px，再设为 20px；运行前分别手算。

自查：第一段字号依次 20px/25px，行高约 32px/40px，上限 384px/480px；第二段仍为 12px。小窗口可比上限窄且自然换行。把数字和单位之间故意加空格会使该声明无效，恢复后再核对计算值。
