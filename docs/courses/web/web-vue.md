# Vue 模板、Props 与响应式状态

用与React相同的计数目标理解Vue的写法。

## 用同一个目标比较另一条路线

Vue 使用模板表达界面，响应式值变化后安排相应的界面更新。React 与 Vue 第一遍选择一条完成即可，另一条用于比较概念。**Vue 组件仍需要 HTML、CSS、JavaScript 基础；模板不是另一门后端语言。** 此处只完成父子计数，不把基础入口宣传成完整 Vue 全栈工程。

## 真实入口与两个完整文件

使用 [框架项目](../../../assets/downloads/web-followup-04.zip) 的独立副本，先 npm.cmd ci，运行 npm.cmd run dev。vue.html 的 #vue-app 容器由 src/vue-main.ts 读取，createApp(VueSearch).mount("#vue-app") 把根组件放进去；已有 Vite 配置带 Vue 插件，才能处理 .vue 文件。

在副本中完整替换 src/VueSearch.vue：

```vue
<script setup lang="ts">
import { ref } from "vue";
import CountLabel from "./CountLabel.vue";
// ref 建立 Vue 能跟踪的响应式值；脚本中通过 .value 访问。
const count = ref(0);
function add() {
  count.value += 1;
}
</script>

<template>
  <main>
    <h1>Vue 计数练习</h1>
    <!-- 冒号绑定表达式，把当前数字传给子组件，而不是字符串 count。 -->
    <CountLabel :count="count" />
    <!-- @click 是 v-on:click 的缩写；点击发生后才调用 add。 -->
    <button type="button" @click="add">练习一次</button>
  </main>
</template>
```

在同目录新建 src/CountLabel.vue：

```vue
<script setup lang="ts">
// 编译器宏描述父组件应传入的 Props；子组件不直接改它。
const props = defineProps<{ count: number }>();
</script>

<template>
  <p>练习了 {{ props.count }} 次</p>
</template>
```

访问 http://127.0.0.1:8804/vue.html，Ctrl+C 停止开发服务。不要把这些内容直接塞进普通 index.html 的 script；.vue 是需要工具处理的单文件组件（SFC）。

## 脚本与模板分别做什么

script setup 声明这个组件的脚本，lang=ts 表示 TypeScript；setup 中的顶层名字可直接用于模板。ref(0) 返回一个响应式容器，脚本用 count.value 读写其中的数字；模板读取顶层 ref 时自动解包，所以 `:count="count"` 不写 .value。

冒号是 v-bind 的缩写，把表达式值传给属性或 Props；不加冒号的 count="count" 会传文字。@click 是 v-on:click 的缩写，登记事件处理函数。模板里的 `{{ ... }}` 是文字插值，Vue 显示表达式结果，不用 React 的单层 JSX 大括号写法。

## 子组件如何接收输入

defineProps 是 Vue 在 script setup 中处理的编译器宏，不需要在这里从 vue 导入。`<{ count:number }>` 描述输入对象的类型，括号调用返回可读取的 props。父组件拥有 count，子组件只读取 props.count 来显示；不要在子组件里直接修改父传输入。复杂交互可让子组件发出事件，父组件收到意图后更新自己的状态。

点击两次后，父 count.value 依次为 1、2，Vue 安排显示更新，子组件展示 2；刷新回到 0。响应式安排更新不表示任意普通对象字段变化都能自动被 Vue 跟踪。

## 故障与独立变式

先把 :count 的冒号去掉，观察传入类型和值为何错误，然后恢复。给父组件加一个 reset 函数，把 count.value 改为 0，再加 @click="reset" 的原生按钮。用键盘完成增加、重置。以后从数组筛选结果时可用 computed 表达派生值，但本节不同时加入异步列表。

## 配套验证边界

当前原项目完整的路由、请求生命周期和流程测试以 React 为主。Vue 原入口有实际基础输入/列表参考，计数替换是本节独立实验；已有 tsc 命令没有执行 vue-tsc 的完整 SFC 类型检查，不能把它通过当成 Vue 全面类型验收。应运行 npm.cmd run build 确认 Vue 插件编译，再在 /vue.html 实际验证显示和操作；完整 Vue 扩展需独立完成同样失败流程。参考：[Vue 单文件组件](https://vuejs.org/guide/scaling-up/sfc.html)、[Vue Props](https://vuejs.org/guide/components/props.html)。
