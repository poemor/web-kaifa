# 定位参照与小角标

让角标相对卡片定位，保留正常内容流。

## 定位参照与小角标是什么意思

relative保留元素在文档流的位置，并可提供定位参照；absolute脱离普通流，相对包含块定位。本节只做角标，不用定位拼整页。

## 让角标找到自己的参照

正常流中的元素会给后续内容留下位置。`position:relative` 仍保留原来位置；不写偏移时，看起来没有移动，但可作为子元素定位的参照。`position:absolute` 脱离正常流，其他内容不再为它留位置。

**本例将 relative 写在卡片上，让角标的偏移相对这张卡片计算。** 最近的这类祖先建立 absolute 使用的包含块。`top:8px` 指到参照区域上边的偏移，`right:8px` 指到右边的偏移。卡片的 padding 为正文留出空间，减少角标覆盖正文的机会。

这个参照选择是逐层向外找的，不是“永远相对父元素”。删掉卡片的 relative 后，若没有其他定位祖先，角标改用初始包含块作为参照，会跑到页面区域的角上。

fixed 常把元素固定在视口中、sticky 在满足滚动和偏移条件时黏住；z-index 影响相应层叠上下文中的叠放顺序。本节不靠这些布局整页，先把一个角标的参照和空间占用讲清。

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
/* 卡片保留正常流位置，同时为角标提供定位参照。 */
.card { position: relative; padding: 32px; border: 1px solid; }
/* 角标不占正文空间；从卡片的参照区域上边、右边各偏移 8px。 */
.badge { position: absolute; top: 8px; right: 8px; }
  </style>
</head>
<body>
<article class="card"><span class="badge">新</span><h1>周末活动</h1><p>正文照常排列。</p></article>
</body>
</html>
```

## 逐步读懂这个例子

card的relative为badge提供参照。角标离卡片右上角8px，正文仍按正常流排列。absolute不会为角标保留一块正文空间，因此卡片padding要避免遮挡。

## 自己改一处再观察

去掉card的relative，观察角标相对位置，再恢复。

### 参考答案

角标可能改为相对其他包含块定位，不再贴着卡片。

## 本节容易混淆的地方

fixed常相对视口，sticky需满足滚动和top等条件。z-index也受层叠上下文影响，数字大不是万能。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：两张卡片各有自己的角标

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用正常流、relative、absolute 和偏移，不加入新定位机制。

独立写两张不同内容的卡片；只给第二张放一个左下角的“限量”角标，距左边与下边各 12px，正文不能被遮挡。先写出角标相对谁、是否为后续内容留位置，再选择参照与留白。

自查：角标始终属于第二张卡片，不跑到页面角落或第一张上；正文仍按流排列且可读。去掉第二张的参照后观察位置变化，再恢复；必须能解释 padding 为什么要容纳脱流角标，而不是靠数个空行。
