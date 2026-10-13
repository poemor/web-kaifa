<script setup lang="ts">
import { computed, ref } from "vue";
const keyword = ref("");
const events = [
  { id: 1, title: "图论训练" },
  { id: 2, title: "算法交流" },
];
const found = computed(() =>
  events.filter((event) => event.title.includes(keyword.value.trim())),
);
</script>
<template>
  <main>
    <h1>Vue 等价搜索示例</h1>
    <p>可选分支：只展示基础输入和列表，不代表完整 React 路线均已改写。</p>
    <label>搜索活动<input v-model="keyword" type="search" /></label>
    <ul class="cards" v-if="found.length">
      <li class="card" v-for="event in found" :key="event.id">
        {{ event.title }}
      </li>
    </ul>
    <p role="status" v-else>没有匹配活动</p>
  </main>
</template>
