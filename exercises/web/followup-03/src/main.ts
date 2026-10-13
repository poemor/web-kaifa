import "./style.css";
import { filterEvents, type EventItem } from "./events";
import { loadEvents, type Scenario } from "./api";
const root = document.querySelector<HTMLDivElement>("#app");
if (!root) throw new Error("缺少 #app 容器");
root.innerHTML = `<main><h1>活动搜索：TypeScript 版</h1><p>本地演示数据，不提供报名服务。</p><div class="filters"><label>搜索活动<input id="keyword" type="search"></label><label>数据场景<select id="scenario"><option value="normal">正常</option><option value="empty">空数据</option><option value="invalid">字段错误</option><option value="http">HTTP错误</option><option value="broken">JSON错误</option><option value="business">业务错误</option></select></label><button id="reload" type="button">重新加载</button></div><p id="status" role="status"></p><ul id="list" class="cards"></ul></main>`;
function required<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);
  if (!element) throw new Error(`缺少元素 ${selector}`);
  return element;
}
const input = required<HTMLInputElement>("#keyword");
const select = required<HTMLSelectElement>("#scenario");
const list = required<HTMLUListElement>("#list");
const status = required<HTMLParagraphElement>("#status");
let events: EventItem[] = [];
let loaded = false;
let controller: AbortController | undefined;
function render() {
  if (!loaded) return;
  const found = filterEvents(events, input.value);
  list.replaceChildren();
  for (const event of found) {
    const card = document.createElement("li");
    card.className = "card";
    const title = document.createElement("h2");
    title.textContent = event.title;
    const detail = document.createElement("p");
    detail.textContent = `${event.startTime} · ${event.location}`;
    card.append(title, detail);
    list.append(card);
  }
  status.textContent =
    events.length === 0
      ? "暂时没有活动"
      : found.length === 0
        ? "没有匹配活动，请修改关键词"
        : `找到 ${found.length} 个活动`;
}
async function reload() {
  controller?.abort();
  const current = new AbortController();
  controller = current;
  events = [];
  loaded = false;
  list.replaceChildren();
  status.textContent = "正在加载…";
  try {
    events = await loadEvents(select.value as Scenario, current.signal);
    if (!current.signal.aborted) {
      loaded = true;
      render();
    }
  } catch (error: unknown) {
    if (!current.signal.aborted)
      status.textContent =
        error instanceof Error ? error.message : "未知错误，请重试";
  }
}
input.addEventListener("input", render);
select.addEventListener("change", reload);
required<HTMLButtonElement>("#reload").addEventListener("click", reload);
void reload();
