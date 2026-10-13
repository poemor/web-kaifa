'use strict';
const form = document.querySelector('#search-form');
const keyword = document.querySelector('#keyword');
const status = document.querySelector('#status');
const list = document.querySelector('#events');
const reload = document.querySelector('#reload');
let events = [];
let ready = false;
function render() {
  list.replaceChildren();
  if (!ready) return;
  const found = events.filter(item => item.title.includes(keyword.value.trim()));
  status.textContent = found.length ? `找到 ${found.length} 项活动` : '没有匹配活动，请清空关键词重试';
  for (const item of found) {
    const li = document.createElement('li');
    li.textContent = `${item.id} · ${item.title}`;
    list.append(li);
  }
}
async function load() {
  ready = false;
  list.replaceChildren();
  reload.disabled = true;
  status.textContent = '正在读取……';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch('./events.json', { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data) || !data.every(item => item && Number.isSafeInteger(item.id) && typeof item.title === 'string')) throw new Error('活动数据结构错误');
    events = data;
    ready = true;
    render();
  } catch (error) {
    status.textContent = `读取失败：${error.name === 'AbortError' ? '8秒内未完成' : error.message}。检查Network后点击重新读取。`;
  } finally {
    clearTimeout(timeout);
    reload.disabled = false;
  }
}
form.addEventListener('submit', event => {
  event.preventDefault();
  if (keyword.value && !keyword.value.trim()) { status.textContent = '不能只填空格；清空可查看全部'; return; }
  render();
});
reload.addEventListener('click', load);
load();
