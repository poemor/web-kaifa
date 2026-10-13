# 数组与元素访问

保存多项数据，访问下标并追加一项。

## 数组与元素访问是什么意思

数组按顺序保存一组值，下标从0开始。length是元素数，push在末尾追加。数组可以混合类型，但本节保持元素形状一致以便理解。

## 数组的顺序与索引

数组字面量使用方括号，`[60,80]` 里各项用逗号分开；`scores[0]` 的方括号表示按索引读取。**第一项的索引是 0；最后一项的索引是 length−1。** 有三项时有效索引是 0、1、2，不是 1、2、3。

`scores.push(100)` 在末尾增加一项，会修改原数组；`scores.length` 读取元素个数，属性不加括号；`scores[1]=90` 可改第二项。const 禁止把 scores 重新赋成另一个数组，不禁止修改原数组内容。

用前面学过的 for 可以从 i=0 开始，每轮检查 `i<scores.length`，再把 `scores[i]` 加进循环外的 total。不要用 <=，否则多读一次 undefined，后续数字计算可能得到 NaN。空数组 length=0，从第一轮就不进入循环，总和应为 0。

本节保持数组元素都是数字。数组也可保存文字或对象，但同一组数据的形状越一致，后续处理越容易说明和校验。

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
<h1>JavaScript 小实验</h1>
<p>按 F12 打开开发者工具，在 Console（控制台）看输出。</p>
<script>
// 数组用 [] 写出两项；索引从 0 开始。
const scores = [60, 80];
// push 修改原数组，在末尾添加第三项；const 不禁止这类内部修改。
scores.push(100);
console.log(scores[0]);
console.log(scores.length);
// 三项的有效索引是 0、1、2；3 处不存在元素，读到 undefined。
console.log(scores[3]);
</script>
</body>
</html>
```

控制台预期：

```output
60
3
undefined
```

## 逐步读懂这个例子

初始两项，push后有三项，下标0、1、2。下标3没有这项，读取undefined。const固定scores这个绑定，并不禁止对数组内容进行push。

## 自己改一处再观察

用for把三个分数相加，验证空数组结果。

### 参考答案

总分240；空数组没有轮次，总分0。

## 本节容易混淆的地方

JavaScript读取越界不像Go那样一定panic，得到undefined也可能在后面的计算中造成NaN。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。
