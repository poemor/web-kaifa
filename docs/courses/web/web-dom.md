# DOM 与读取页面元素

把HTML里的一个元素找出来，修改它的文字。

## DOM 与读取页面元素是什么意思

DOM是浏览器提供的文档对象树。document.querySelector使用CSS选择器取得一个元素；textContent读取或设置文字。语言基础中的值与函数仍然适用，现在只是操作对象换成页面元素。

## 从 HTML 源码到可操作的文档树

浏览器读 HTML 后，在内存中建立元素之间的父子关系，叫 DOM（Document Object Model，文档对象模型）。JavaScript 通过浏览器提供的 document 对象访问这份树，不是直接修改磁盘文本。

**DOM 是当前页面的内存结构；改它会改变显示，但不会自动保存源码。** `document.querySelector("#title")` 使用前面 CSS 的选择器语法，返回第一个匹配元素；没有匹配时返回 null。heading 保存的是该元素对象的引用。

`heading.textContent="新标题"` 给对象的 textContent 属性赋值，浏览器就把元素内的文字更新到屏幕。script 放在 h1 之后，这个元素已被解析，才找得到它。若把脚本搬到元素之前，必须另行处理执行时机。

打开后看 Elements，h1 里是新标题；再看磁盘文件或“查看网页源代码”，仍是旧标题。刷新会重新读源码再执行脚本。将选择器改为 #missing，null 没有可赋值的 textContent，控制台会报 TypeError。恢复后再继续下一节事件。

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
<h1 id="title">旧标题</h1>
<script>
// 通过 CSS 的 ID 选择器寻找已存在的 h1，得到元素对象。
const heading = document.querySelector("#title");
// 修改当前 DOM 的文字，磁盘文件里的旧标题不会自动被改写。
heading.textContent = "新标题";
</script>
</body>
</html>
```

## 逐步读懂这个例子

script放在元素之后，因此执行时标题已存在。#title匹配id=title的元素。赋值修改DOM中的文字，屏幕显示新标题；磁盘里的HTML原文仍写旧标题。

## 自己改一处再观察

故意将选择器改成#missing，查看控制台错误，再恢复。

### 参考答案

找不到元素得到null，直接访问textContent会报错。恢复后能得到新标题。

## 本节容易混淆的地方

开发者工具里临时改DOM不会自动保存到源码。使用innerHTML处理不可信文字会把它当HTML解释，文字显示优先textContent。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：同步两个页面信息

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用 querySelector、textContent、已学变量与条件，不需要事件。

独立写一个 h1 与一段有不同 id 的 p，原文为“设备待检查”和“尚无结果”。脚本找到两者，分别改为“设备在线”和“已检查1台”。同时为找不到某个元素的情况决定怎样报告，不继续访问 null。

自查：Elements 和屏幕有两段新文字，磁盘原文仍是旧文字。故意让一项选择器不匹配时能在 Console 找到自己的失败说明，且不会将 null 当元素赋值；恢复后两项都正确。只改其中一个对象不能算两项同步完成。
