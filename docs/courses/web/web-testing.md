# 纯函数测试与失败实验

用独立期望值检测筛选函数，改错后看到失败。

## 先写可以独立判断的需求

这里需求是“去掉关键词两端空白后，保留标题任何位置包含关键词的项；空查询显示全部；没有匹配返回空数组”。纯函数只根据输入计算输出，不依赖页面和外部可变状态，也不修改调用者的数据。**测试的期望值来自需求，不能调用被测函数再把它自己的结果当期望。**

## 两个完整文件

新建独立 filter-test 目录，保存下面两份文件。需要已安装支持内置测试运行器的现代 Node；不需要 npm ci、浏览器、DOM 或外部测试库。mjs 扩展名告诉 Node 按 JavaScript 模块规则处理。

filter.mjs：

```javascript
// 同样输入得到同样结果，不读页面，不改原数组。
export function filterTitles(titles, query) {
  const keyword = query.trim();
  return titles.filter(title => title.includes(keyword));
}
```

filter.test.mjs：

```javascript
import test from "node:test";
import assert from "node:assert/strict";
import { filterTitles } from "./filter.mjs";

// 期望值来自需求：关键词在标题中间也算匹配。
test("关键词在标题中间", () => {
  assert.deepEqual(filterTitles(["周末编程", "读书"], "编"), ["周末编程"]);
});

test("空白查询显示全部", () => {
  assert.deepEqual(filterTitles(["编程"], "   "), ["编程"]);
});

test("没有匹配得到空数组", () => {
  assert.deepEqual(filterTitles(["编程"], "不存在"), []);
});
```

## 先读一次断言

node: 前缀指 Node 内置模块，不是要从网上安装的包。test(名称,回调) 登记一项测试；assert.deepEqual(实际,期望) 比较数组等结构和值。深比较不是用数组对象的 === 引用比较。第一项实际来自函数调用，期望是手写的 ["周末编程"]；不相等时断言抛错，运行器把这项记为失败。

## 运行与可观察结果

```sh
# 当前目录应包含刚保存的两个 mjs 文件。
node --test filter.test.mjs
```

正常应报告 3 项通过、0 项失败并结束，命令退出状态为成功。具体日志符号随 Node 版本不同，不需要背。若提示找不到文件，先检查终端目录与文件名；若语法错误，先看文件/行号；若断言错误，比较实际与期望，不先把期望改成实际。

## 让测试检出一个确定错误

只把 filter.mjs 的 includes 改成 startsWith（仅匹配开头），保持测试不变，重新运行。第一项必须失败，因为“编”在“周末编程”的中间；另外两项可以仍通过。恢复 includes 后三项应通过。**先证明测试能发现这个错误，再把通过当作证据。**

独立添加“不修改原数组”和“边界空格被去掉”的测试，先写期望再实现。这里验证的是筛选函数，不能推断页面键盘、网络断开或服务器权限也正确；这些需要组件与流程测试。参考：[Node 测试运行器](https://nodejs.org/api/test.html)。
