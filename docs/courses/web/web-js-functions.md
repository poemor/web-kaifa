# 函数定义、参数与返回

把计算提成函数，区分返回结果与打印结果。

## 函数定义、参数与返回是什么意思

函数将一组操作命名。定义不会自动执行；调用时实参进入形参，return把结果交回调用者。函数若没有返回值，调用结果为undefined。

## 一次函数调用里发生什么

`function add(a,b) { ... }` 定义函数：add 是名字，a、b 是接收输入的参数，花括号是函数体。定义时没有执行 a+b。`add(2,3)` 才调用函数，把实参 2、3 分别送给形参 a、b。

**return 把值交给调用者；console.log 只是显示一个值。** return 还会结束这次函数执行，它后面的同一路径语句不再执行。本例 add 返回 5，total 接住返回值，最后才输出 5。

如果删除 return，只剩 `a+b;` 或 `console.log(a+b);`，计算或打印仍可能发生，但调用者拿到 undefined。因此需要继续计算的结果，要明确返回，不要把“控制台见到了数字”当作“函数已返回数字”。

参数是函数内的名字，别的函数也可以使用同名参数。调用时参数顺序有意义：减法函数 subtract(a,b) 的 a-b，与 subtract(b,a) 结果可能相反。先写一个 multiply(a,b) 并分别测试正数、零和负数，下一节再追踪名字的作用范围。

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
// 这里只定义函数；a、b 在调用时分别接收两个输入值。
function add(a, b) {
  // 返回计算结果并结束本次调用，不在这里只打印结果。
return a + b;
}
// 调用 add：参数得到 2、3，返回值 5 被保存到 total。
const total = add(2, 3);
console.log(total);
</script>
</body>
</html>
```

控制台预期：

```output
5
```

## 逐步读懂这个例子

add的a、b是函数参数。add(2,3)执行return，返回5；total接住它，console.log只是之后展示结果。把console.log放进函数而不return，调用者无法拿到计算值。

## 自己改一处再观察

用add(-2,3)与add(0,0)验证，写一个multiply函数。

### 参考答案

两次add得到1与0；multiply应return a*b。

## 本节容易混淆的地方

调用add()与把add函数本身交给别处是两件事；事件章节会使用后者。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。
