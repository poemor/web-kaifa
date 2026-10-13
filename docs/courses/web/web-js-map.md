# 数组 map 与数据转换

把每项转换成新的值，区分转换与筛选。

## 数组 map 与数据转换是什么意思

map为数组每项调用转换函数，返回一组转换后的结果。filter决定留不留，map决定变成什么。这两种方法可组合，但先分别理解。

## 每项产生一个对应的新值

map 接收转换函数，对每项调用一次，把每次返回的值放进新数组。**filter 回答“保留吗”，map 回答“变成什么”。** 对本例的普通三项数组，map 返回三项，而 filter 可以返回更少项。

`function (price) { return price*2; }` 是匿名函数：没有单独取名，但仍有参数与函数体。把它直接放进 map 的括号，map 就得到一个可调用的函数。三次输入是 10、20、30，三次返回是 20、40、60。

同一函数也可写为箭头函数 `price => price*2`，箭头左边是参数，右边的表达式自动作为返回值；如果写 `price => { price*2; }`，花括号表示函数体，此时必须明确 return，否则每项得到 undefined。后面 DOM 筛选将使用这种短写。

原 prices 不会因本例的数值转换被改写。但“map 返回新数组”不表示回调永远没有副作用：若回调主动改共享对象，仍会改它。先让转换函数只计算结果，DOM 创建与追加使用明确的循环。

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
const prices = [10, 20, 30];
// map 把每个价格交给这个匿名函数，收集它的返回值。
const doubled = prices.map(function (price) {
  // 每项返回自己的转换结果；漏 return 会得到 undefined。
return price * 2;
});
console.log(JSON.stringify(doubled));
</script>
</body>
</html>
```

控制台预期：

```output
[20,40,60]
```

## 逐步读懂这个例子

匿名函数作为回调接收当前price，返回翻倍值。map结果长度与原数组一致；原prices仍是10、20、30。箭头函数price=>price*2表达同一计算。

## 自己改一处再观察

把数值转换成“价格：10”等字符串，再比较map和filter的结果长度。

### 参考答案

map得到三条文字，不负责删除不合格项。filter后map可以先选数据再变形。

## 本节容易混淆的地方

不要用map来主要进行DOM副作用却丢掉返回值。只做逐项操作时选择合适的循环。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。
