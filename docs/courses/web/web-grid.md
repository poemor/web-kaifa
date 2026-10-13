# Grid 的列、间距与 fr

用两列网格排列四张卡片，再改成三列。

## Grid 的列、间距与 fr是什么意思

Grid同时安排行与列。grid-template-columns定义列，fr表示分配剩余空间的份额，gap给行列间隔。适合卡片列表等二维结构。

## 列轨道与自动排位

Grid 把容器划分成行列轨道，再按源码顺序安放直接子项。`grid-template-columns:1fr 1fr` 声明两个列轨道；两项之后的第三项自动进入下一行，不需要手写 top/left。

**fr 是可分配空间的份额，不是像素，也不是直接把容器总宽当百分比。** 例如容器宽 612px，gap 为 12px，扣掉一处列间距后，两列各分约 300px。`gap` 同时指定行间与列间的间隔。

`repeat(3,1fr)` 表示把 1fr 重复三次，等价于 `1fr 1fr 1fr`。`minmax(0,1fr)` 把轨道最小尺寸设为 0、最大参与 1fr 分配，便于收缩；长单词是否换行仍需文本规则，后面溢出章节会处理。

本例 .cards 的四个 article 是直接子项，形成两列两行。article 只是为每张独立卡片提供语义；把 grid 写在 article 上不会自动排列它的兄弟卡片。打开开发者工具的 Layout（布局）或 grid 标记，可叠加网格线观察。

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
/* 父容器声明两列；四个直接子项会按源码顺序排成两行。 */
.cards { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
/* 内边距只控制每张卡片自己的内容空间。 */
article { padding: 16px; background: #edf2f7; }
  </style>
</head>
<body>
<div class="cards"><article>一</article><article>二</article><article>三</article><article>四</article></div>
</body>
</html>
```

## 逐步读懂这个例子

两列等分空间，四项形成两行。改成repeat(3,1fr)后每行最多三项，第四项进入下一行。1fr不是1像素，也不保证长内容永远不会撑宽。

## 自己改一处再观察

增加第五张卡片，改成repeat(3,minmax(0,1fr))，观察排列。

### 参考答案

前三项第一行，后两项第二行。minmax(0,1fr)允许列轨道按空间收缩。

## 本节容易混淆的地方

Grid只布局直接子项。不要用绝对定位手工算每张卡片的位置。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。
