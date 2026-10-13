# 重叠请求与过期结果

让较旧的请求不能覆盖较新的选择。

## 先分清启动顺序和完成顺序

用户先选 A、再选 B，期望页面以 B 为准。但 A 的处理可能更慢，B 完成后 A 才完成。**最后完成的结果，不一定属于最后一次选择。** 如果每次成功都直接写 DOM，页面会倒退到旧选择。这里已经学过 fetch、Promise、事件与状态，专门解决它们组合后的时间问题。

## 三个完整文件与启动

在独立目录保存下列三个文件；终端在这个目录运行 `python -m http.server 8765`，访问 http://127.0.0.1:8765/，Ctrl+C 停止。两个 JSON 都由真实本地 HTTP 请求取得，pause 只在取得数据后人为延迟处理，用于稳定制造完成先后，不能称作真实网络速度测量。

index.html：

```html
<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>过期结果实验</title>
</head>
<body>
  <button id="slow" type="button">先启动较慢结果</button>
  <button id="fast" type="button">再启动较快结果</button>
  <p id="result" role="status">尚未选择</p>
  <script>
    const result = document.querySelector("#result");
    let latest = 0;
    // 人为延迟处理结果，制造可重复的完成顺序；不是测量真实服务器速度。
    function pause(milliseconds) {
      return new Promise(resolve => setTimeout(resolve, milliseconds));
    }
    async function load(file, delay) {
      // 先增加编号，再保存本次编号；每次调用都有自己的 request。
      latest += 1;
      const request = latest;
      result.textContent = "加载中";
      try {
        const response = await fetch(file);
        if (!response.ok) throw new Error("HTTP " + response.status);
        const data = await response.json();
        if (data === null || typeof data !== "object" || typeof data.title !== "string") {
          throw new Error("title 必须是字符串");
        }
        await pause(delay);
        // 旧成功不能覆盖较新的选择。
        if (request !== latest) return;
        result.textContent = data.title;
      } catch (error) {
        // 旧失败也不能盖掉较新的正常状态。
        if (request === latest) result.textContent = "失败：" + error.message;
      }
    }
    document.querySelector("#slow").addEventListener("click", () => load("./slow.json", 600));
    document.querySelector("#fast").addEventListener("click", () => load("./fast.json", 20));
  </script>
</body>
</html>
```

slow.json：

```json
{"title":"前一次慢结果"}
```

fast.json：

```json
{"title":"最后一次快结果"}
```

## 跟踪两个编号

latest 是所有调用共同读取的最新编号；request 是每次 load 内保存的本次编号。点击 slow 后为 1，随后点击 fast 后 latest 为 2；fast 的 request=2 可以写结果，slow 稍后比较 1!==2，就 return。return 在此结束这次 load，不更新页面。catch 也比较编号，避免旧失败破坏新界面。

pause 用 `new Promise(...)` 创建待定 Promise：构造器给回调一个 resolve 函数，调用它才成功完成。`setTimeout(resolve, milliseconds)` 安排在给定毫秒后调用 resolve；1000 毫秒是一秒。await pause 等待这个模拟过程。这里的新语法只为制造实验，业务代码不必人为加延迟。

## 先预测，再故意破坏保护

先点慢按钮，在 600 毫秒内点快按钮；等一秒，最后应仍是“最后一次快结果”。删除成功分支的编号检查再做同一实验，会先出现快结果，随后被慢结果覆盖。恢复检查。再把慢文件改成坏 JSON，观察旧失败不会覆盖较新选择；若操作太慢，重新刷新后快速点击。

## 版本判断与请求取消

编号判断控制“结果是否还能写界面”；AbortController 用于通知 fetch 取消不再需要的请求。controller.signal 是可传给请求的取消信号，controller.abort() 发出取消；取消也会让 Promise 拒绝，需要在 catch 中区分已取消的旧操作。只取消并不能替代所有结果检查，尤其当请求已经完成、后续处理还在进行时。完整 React 请求清理会在后面的组件生命周期章节使用；本节的完整例子使用版本判断。

## 独立变式：三次选择与旧失败

**先合上原例，再从空白文件完成下面的目标。** 可以查本节概念和已经学过的章节，先写自己的预期；不要复制参考程序再换几个字。使用已教编号、Promise延迟、fetch和状态更新；延迟是人为实验，不是网络测速。

独立写甲、乙、丙三个读取选择，开始后的模拟等待依次600、100、300毫秒，等待后才请求各自本地JSON。快速按甲→乙→丙，先列启动与完成顺序，再写最新选择保护；再把甲资源改为不存在。

自查：约束操作发生在600毫秒内，最后始终属于最后选的丙，不属于最早启动但最后完成的甲。甲旧成功、甲旧404均不能改丙界面；若最后选的丙失败，则显示丙失败，乙成功不能覆盖。每个写界面的出口都要依据当前编号。
