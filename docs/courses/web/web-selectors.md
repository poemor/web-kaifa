# 标签、类与 ID 选择器

只改变活动标题，区别h2、.event-title、#main-title。

## 标签、类与 ID 选择器是什么意思

标签选择器匹配同类元素，类选择器用点号匹配class，ID选择器用井号匹配id。一个class可以给多个元素复用，id在同一文档应唯一。

## 从 HTML 属性找到 CSS 匹配范围

**类名写在 HTML 的 class 中，点号只写在 CSS 选择器中。** HTML 写 `class="event-title"`；CSS 写 `.event-title`。ID 同理：HTML 的 `id="main-title"` 对应 CSS 的 `#main-title`。

| 选择器 | 匹配范围 |
| --- | --- |
| `h2` | 所有 h2 元素 |
| `.event-title` | class 含 event-title 的元素，不限标签 |
| `#main-title` | id 为 main-title 的元素；同一文档不要重复这个 id |
| `h2.event-title` | 同时是 h2 且带这个类的元素 |
| `main h2` | main 内部的后代 h2；中间空格表示后代关系 |

同一元素可写 `class="event-title featured"`，两个类名用空格分开，每个类仍单独匹配。不要写成 `class=".event-title"`，那会把点号也当成类名的一部分。

本例只有“本周活动”变成深绿色，“联系方式”保持默认。新增一条 `#main-title { color: blue; }` 时，主标题才会变蓝；只是给元素取了 id 不会自动产生样式。

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
/* 点号按 class 匹配；没有该类的 h2 不会被这条规则影响。 */
.event-title { color: darkgreen; }
  </style>
</head>
<body>
<h1 id="main-title">周末编程社</h1>
<!-- HTML 的类名不写点号，并可给其他元素复用。 -->
<h2 class="event-title">本周活动</h2>
<h2>联系方式</h2>
</body>
</html>
```

## 逐步读懂这个例子

只有带event-title类的h2变绿，另一个h2保持默认。点号属于CSS选择器，HTML属性写class="event-title"，不带点。

## 自己改一处再观察

把类加给第二个h2，再把选择器改成h2，比较影响范围。

### 参考答案

类加给两项时两项都绿；标签选择器会影响全部h2，包括没有class的。

## 本节容易混淆的地方

写.event-title与写event-title不同，后者选择同名标签而非class。不要给很多元素重复同一个id。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：区分公告与重点公告

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用标签、class、id 选择器与已学的唯一标识规则。

从空白写一个主标题和三条公告。要求前两条共享一份公告颜色，第三条不加入这份样式；主标题独有一种颜色。自行取 class/id 名称和匹配规则，不能逐个写三份重复规则。

自查：共享类匹配两条，唯一 id 只匹配主标题，第三条保持没有加入共享规则的外观。给第三条临时加入共享类应同时改变它，移除后恢复；HTML 类值无点号，CSS 匹配写法有点号，id 不重复。
