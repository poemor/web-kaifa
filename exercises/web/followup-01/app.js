'use strict';
const KEY = 'club-followup-favorites-v1';
const source = document.querySelector('#source');
const loadButton = document.querySelector('#load');
const requestStatus = document.querySelector('#request-status');
const form = document.querySelector('#filter-form');
const keyword = document.querySelector('#keyword');
const category = document.querySelector('#category');
const onlyFavorites = document.querySelector('#favorites-only');
const message = document.querySelector('#filter-message');
const count = document.querySelector('#count');
const list = document.querySelector('#results');
const storageStatus = document.querySelector('#storage-status');
const exportButton = document.querySelector('#export-storage');
const resetButton = document.querySelector('#reset-storage');
const undoButton = document.querySelector('#undo-storage');
let events = [];
let phase = 'idle';
let favorites = new Set();
let storageMode = 'ok';
let requestNumber = 0;
let previousRaw;
let canUndo = false;
const filters = { keyword: '', category: 'all', onlyFavorites: false };

// Pure logic: the same input gives the same result; no DOM or storage here.
function filterEvents(items, options, saved) {
  const text = options.keyword.trim().toLocaleLowerCase();
  return items.filter(item =>
    item.title.toLocaleLowerCase().includes(text) &&
    (options.category === 'all' || item.category === options.category) &&
    (!options.onlyFavorites || saved.has(item.id))
  ).sort((a, b) => a.id - b.id);
}

function validateEvents(data) {
  if (!Array.isArray(data)) throw new Error('数据格式错误：需要活动数组');
  const seen = new Set();
  for (const item of data) {
    if (!item || !Number.isSafeInteger(item.id) || item.id < 1 ||
        typeof item.title !== 'string' || !item.title.trim() || item.title.length > 200 ||
        !['算法', 'Web'].includes(item.category) || typeof item.description !== 'string' ||
        item.description.length > 500 || seen.has(item.id)) {
      throw new Error('数据格式错误：编号、标题、分类、描述或重复编号不合法');
    }
    seen.add(item.id);
  }
  return data;
}

function readFavorites() {
  favorites = new Set();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== null) {
      const data = JSON.parse(raw);
      if (data?.version !== 1 || !Array.isArray(data.favorites) ||
          !data.favorites.every(id => Number.isSafeInteger(id) && id > 0)) {
        throw new Error('Invalid saved favorites');
      }
      favorites = new Set(data.favorites);
    }
    storageMode = 'ok';
    storageStatus.textContent = `本浏览器已保存 ${favorites.size} 个收藏编号；当前空记录不会自动写入。`;
  } catch (error) {
    storageMode = error instanceof SyntaxError || error.message === 'Invalid saved favorites' ? 'damaged' : 'unavailable';
    storageStatus.textContent = storageMode === 'damaged'
      ? '收藏记录损坏，原文已保留；本次收藏仅在内存变化。请先导出原文再选择重建。'
      : '浏览器禁止访问本地存储；本次收藏只保存在内存，刷新会丢失。';
  }
}

function saveFavorites() {
  if (storageMode !== 'ok') return;
  try {
    localStorage.setItem(KEY, JSON.stringify({ version: 1, favorites: [...favorites] }));
    storageStatus.textContent = `已保存 ${favorites.size} 个收藏编号；刷新本页面可验证。`;
  } catch {
    storageMode = 'unavailable';
    storageStatus.textContent = '写入失败（可能空间不足或访问被禁止）；旧记录没有被主动清空，本次变更只在内存。';
  }
}

function render() {
  list.replaceChildren();
  if (phase !== 'success') { count.textContent = ''; return; }
  const found = filterEvents(events, filters, favorites);
  count.textContent = found.length ? `找到 ${found.length} 项活动。` : '没有匹配活动，请清空关键词或切换分类。';
  for (const item of found) {
    const li = document.createElement('li');
    const heading = document.createElement('h3');
    heading.textContent = item.title;
    const label = document.createElement('p');
    label.textContent = `类别：${item.category} · 编号：${item.id}`;
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = '查看介绍';
    const description = document.createElement('p');
    description.textContent = item.description;
    details.append(summary, description);
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.id = String(item.id);
    button.dataset.action = 'favorite';
    button.setAttribute('aria-pressed', String(favorites.has(item.id)));
    button.textContent = favorites.has(item.id) ? '取消收藏' : '收藏';
    // The accessible name distinguishes repeated buttons.
    button.setAttribute('aria-label', `${button.textContent}：${item.title}`);
    li.append(heading, label, details, button);
    list.append(li);
  }
}

async function loadEvents() {
  const thisRequest = ++requestNumber;
  const url = source.value;
  phase = 'loading';
  loadButton.disabled = true;
  list.setAttribute('aria-busy', 'true');
  requestStatus.textContent = '正在读取活动，请稍候……';
  render();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}：无法读取 ${url}`);
    const data = validateEvents(await response.json());
    if (thisRequest !== requestNumber) return;
    events = data;
    phase = data.length ? 'success' : 'empty';
    requestStatus.textContent = data.length ? `读取成功：${data.length} 项活动。` : '读取成功，但数据源没有活动。';
  } catch (error) {
    if (thisRequest !== requestNumber) return;
    events = [];
    phase = 'error';
    const detail = error.name === 'AbortError' ? '8秒内未完成，可检查连接后重试' : error.message;
    requestStatus.textContent = `读取失败：${detail}。旧列表已移除；切回正常数据后可重试。`;
  } finally {
    clearTimeout(timeout);
    if (thisRequest === requestNumber) {
      loadButton.disabled = false;
      list.setAttribute('aria-busy', 'false');
      render();
    }
  }
}

loadButton.addEventListener('click', loadEvents);
form.addEventListener('submit', event => {
  event.preventDefault();
  if (keyword.value && !keyword.value.trim()) {
    message.textContent = '不能只输入空格；清空关键词可查看全部。';
    keyword.focus();
    return;
  }
  filters.keyword = keyword.value.trim();
  filters.category = category.value;
  filters.onlyFavorites = onlyFavorites.checked;
  message.textContent = '已应用当前条件；改变字段后需要重新点击“应用条件”。';
  render();
});
form.addEventListener('input', () => {
  message.textContent = '条件已修改，尚未应用；请点击“应用条件”。';
});

// One parent listener handles all current and future favorite buttons.
list.addEventListener('click', event => {
  const button = event.target.closest('button[data-action="favorite"]');
  if (!button || !list.contains(button)) return;
  const id = Number(button.dataset.id);
  if (!events.some(item => item.id === id)) return;
  favorites.has(id) ? favorites.delete(id) : favorites.add(id);
  saveFavorites();
  render();
  // Re-render replaced the focused button; restore focus deliberately.
  const replacement = list.querySelector(`button[data-id="${id}"]`);
  (replacement || onlyFavorites).focus();
});

exportButton.addEventListener('click', () => {
  try {
    const raw = localStorage.getItem(KEY);
    const blob = new Blob([raw ?? '当前没有原始记录'], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'favorites-original.txt';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    storageStatus.textContent += ' 已请求下载原文，请确认下载文件已保存。';
  } catch {
    storageStatus.textContent = '无法读取原记录，导出失败；没有改写收藏。';
  }
});
resetButton.addEventListener('click', () => {
  if (!confirm('重建会把当前存储换成空收藏。建议先导出；本次页面保留一份原文可撤销。继续吗？')) return;
  try {
    const raw = localStorage.getItem(KEY);
    localStorage.setItem(KEY, JSON.stringify({ version: 1, favorites: [] }));
    previousRaw = raw;
    canUndo = true;
    undoButton.disabled = false;
    readFavorites();
    storageStatus.textContent = '已重建空收藏；可点击“撤销重建”恢复重建前原文。';
    render();
  } catch {
    storageStatus.textContent = '重建失败，没有主动删除旧记录。';
  }
});
undoButton.addEventListener('click', () => {
  if (!canUndo) return;
  try {
    previousRaw === null ? localStorage.removeItem(KEY) : localStorage.setItem(KEY, previousRaw);
    canUndo = false;
    undoButton.disabled = true;
    readFavorites();
    storageStatus.textContent += ' 已恢复重建前原始记录。';
    render();
  } catch {
    storageStatus.textContent = '撤销写入失败，原文快照仍在本次页面内存；恢复访问后再试。';
  }
});
readFavorites();
render();
