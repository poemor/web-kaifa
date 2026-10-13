# async、await 与错误处理

在async函数中等待Promise，再用try/catch处理失败。

## async、await 与错误处理是什么意思

async函数返回Promise。await在该函数内等待结果，并让函数之后的语句在结果准备好后继续；不会把整个浏览器线程阻塞在那里。try/catch可处理await得到的拒绝。

## 暂停这个函数，不是暂停整个页面

async 写在函数前，表示这个函数总是返回一个 Promise。await 读取某个 Promise 的完成值：未完成时让这个函数先挂起，当前其他代码可以继续；完成后恢复此函数的下一行。

**await 拿到成功值；await 遇到拒绝会在这里表现为抛错。** 因而本例的 try/catch 可以接住 Promise.reject 的错误。它不是把任何函数都变成后台线程，await 之前的同步重计算仍会占用当前执行线程。

load() 开始 → 执行到 await → 等待完成 → const value 得到数字 5 → 输出 5。定义 load 只保存函数，最后的 load() 才实际启动它。它返回的 Promise 不是数字 5；如果调用者想读取函数的返回结果，调用者也要使用 await 或 then。

将 resolve 改成 reject(new Error("加载失败"))，预期 catch 打印加载失败，不打印成功数字。把 console.log("调用之后") 写在 load() 后面，可以观察这条同步日志先于函数里的等待结果。本例已经在内部处理错误，不额外抛出；若函数移除了内部 catch，调用者就必须处理返回 Promise 的拒绝。

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
// async 函数返回 Promise；定义时还没有启动。
async function load() {
  try {
    // 等待这份 Promise，成功值才赋给 value；失败会进入 catch。
const value = await Promise.resolve(5);
    console.log(value);
  } catch (error) {
    console.log(error.message);
  }
}
// 调用函数才开始执行；内部 try/catch 负责这次演示的错误。
load();
</script>
</body>
</html>
```

控制台预期：

```output
5
```

## 逐步读懂这个例子

load开始后在await处等待值，成功时打印5。拒绝会进入catch。调用load本身得到Promise，所以不写await的调用处仍需考虑失败处理。

## 自己改一处再观察

将resolve替换为reject(new Error("加载失败"))，观察catch。

### 参考答案

打印加载失败，不继续打印成功数据。

## 本节容易混淆的地方

await仅在支持的位置使用，本例放在async函数中。catch覆盖的是包在try中的操作。

参考：[MDN Web 学习文档](https://developer.mozilla.org/zh-CN/docs/Learn_web_development)。

## 独立变式：等待完成后返回账单

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用 async/await、已有Promise、数字计算和调用者处理；不请求网络。

独立写一个 async 函数，等待一个完成值20后加运费3并返回。调用者读取这个函数的完成值，而不是只把 Promise 输出为账单；调用后立刻另打印一条同步日志。再让等待对象拒绝为“价格不可用”。

自查：同步日志先出现，成功账单为23。拒绝时只报告价格不可用，不报告已生成0元或23元账单。必须能区分函数内部等待的值、函数返回的Promise和调用者读到的最终数字。
