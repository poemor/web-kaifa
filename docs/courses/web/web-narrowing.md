# 联合类型与缩小范围

根据状态判断哪些字段存在，避免无意义的可选字段。

## 让类型对应真实状态

加载中没有结果，失败有错误信息，成功才有结果数组。**先判断处于哪种状态，再读取那个状态实际拥有的字段。** 联合类型用竖线 | 表示“可能是其中一种形状”；它不是 JavaScript 条件里的双竖线 ||。

## 完整文件与运行入口

继续使用 followup-03 的独立副本，保留原版；将 src/main.ts 完整替换为下方代码。#app 容器由已有 index.html 提供。保存，在此目录运行 npm.cmd run typecheck，再 npm.cmd run dev；macOS/Linux 使用 npm。打开 http://127.0.0.1:8803/，Ctrl+C 停止。

```typescript
// 三种状态分别拥有真实存在的字段，不使用到处可选的属性。
type State =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "success"; items: string[] };

function text(state: State): string {
  if (state.kind === "loading") return "加载中";
  if (state.kind === "error") return state.message;
  // 前面两个分支已返回；这里剩下 success，items 才一定存在。
  return "成功：" + state.items.length + "项";
}

const states: State[] = [
  { kind: "loading" },
  { kind: "error", message: "加载失败" },
  { kind: "success", items: ["编程交流", "读书会"] }
];
const root = document.querySelector("#app");
if (root === null) throw new Error("缺少 #app 容器");
const list = document.createElement("ul");
for (const state of states) {
  const result = text(state);
  console.log(result);
  const item = document.createElement("li");
  item.textContent = result;
  list.append(item);
}
root.replaceChildren(list);
export {};
```

## 按判断缩小范围

kind 在每个形状中都是固定字符串，称为字面量类型；它作为判别字段区分三种形状。`string[]` 表示字符串数组，`State[]` 表示每项都符合 State 的数组。

text 首先判断 loading，成立立即 return；否则可能是 error 或 success。第二个判断确认 error，才能读取 message。这个分支也 return，最后剩下 success，所以可读 items.length。缩小范围来自程序实际判断，不是凭作者希望“应该已经成功”。

## 输出与独立失败实验

页面三项与 Console 三行依次是“加载中”“加载失败”“成功：2项”。先预测空 success 数组会显示什么，再改为 []，结果应为成功：0项。

把 state.items.length 临时搬进 loading 分支，typecheck 应报该属性不存在。给 loading 对象强加 items，不代表状态设计变得正确；不要用 any 或 as 关闭检查。恢复后，再独立添加一个空结果状态，明确它有哪些字段，并修改 text 处理它。

## 回到实际请求

这节使用固定数组以便专注类型。实际 fetch 的成功、失败、加载流程仍由前面异步代码决定；联合类型只是表达这些真实情况，不能制造请求结果。若把类型用于外部 JSON，仍先验证真实值再构造合适的 State。
