# let、const 与数据类型

保存数字、文字和布尔值，判断哪个变量可以重新赋值。

## let、const 与数据类型是什么意思

let声明可重新赋值的变量，const声明不能重新赋值的绑定。常见值有number、string、boolean、null和undefined。const对象内部字段能否改变是后续对象章节的内容。

## 先保存一个值，再改变它

变量是一个可以用名字读取的值。`let minutes = 20;` 一次做三件事：用 let 声明名字 minutes，用等号把数字 20 存进去，用分号结束语句。之后的 `minutes = 30;` 是重新赋值，不再写 let。

**等号 `=` 用来赋值，不是问两边是否相等。** `minutes > 0` 才是比较表达式，得到 true（真）或 false（假）。变量名不加引号；`"小林"` 的引号表示它是字符串文字。名字区分大小写，minutes 与 Minutes 是两个名字。

| 类型或值 | 例子 | 本节用途 |
| --- | --- | --- |
| number | `20`、`1.5` | 做数值计算 |
| string | `"小林"` | 保存文字 |
| boolean | `true`、`false` | 表示判断结果 |
| undefined | `let result;` 后的 result | 已声明但还没提供值 |
| null | `let selection = null;` | 作者明确表示目前没有选择 |

typeof 是读取类型的运算符，例如 typeof name 返回文字 string。const 要在声明时给出值，并且不能换成另一个值；后续数组/对象章节会说明“不能重新赋值”和“内部内容不能变”是不同限制。

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
// 声明可以重新赋值的变量，初始保存数字 20。
let minutes = 20;
// 这个绑定不允许重新赋值；字符串文字要放在引号内。
const name = "小林";
// 给已经存在的 minutes 重新赋值，后面的输出读到 30。
minutes = 30;
console.log(minutes);
console.log(typeof name);
console.log(minutes > 0);
</script>
</body>
</html>
```

控制台预期：

```output
30
string
true
```

## 逐步读懂这个例子

minutes先20再30。typeof返回值的类型名称。比较得到true。const name不能用name="别的名字"重新赋值，文件中的名字与字符串内容是两个层次。

## 自己改一处再观察

让minutes变成0，再比较minutes>0；然后故意重新赋值name，观察报错并还原。

### 参考答案

比较为false；给const重新赋值会出现TypeError。

## 本节容易混淆的地方

const不是“所有内容永远不可变”。undefined常来自没有提供值，null是显式的空值，二者不要混用。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：安排学习计划的三种值

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用 let/const、数字、文字、布尔比较与 typeof；不需要函数或 DOM。

从空脚本设计计划时长、学习主题、是否达到 30 分钟三种值。初始时长 20，之后改为 35；分别输出更新前后的比较结果和三种值的类型。自己选哪些名字允许重新赋值并解释。

自查：两个比较结果为 false、true，主题是 string，时长是 number，比较是 boolean。若把不可重新赋值的绑定再次赋值，应看到 TypeError；恢复后继续。名字与字符串内容分清，不重复声明来假装更新原变量。
