import type {EventItem, EventInput} from './types';
const base=import.meta.env.VITE_API_BASE??'http://127.0.0.1:8777';
// 编译器不会替服务器验证 JSON。unknown 强迫我们先检查字段。
function isEvent(value:unknown):value is EventItem {
  if(!value||typeof value!=='object')return false;
  const x=value as Record<string,unknown>;
  return typeof x.id==='number'&&Number.isSafeInteger(x.id)&&x.id>0&&typeof x.title==='string'&&typeof x.location==='string';
}
async function call(path:string,options:RequestInit={}) {
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),5000);
  const cancel=()=>controller.abort();options.signal?.addEventListener('abort',cancel,{once:true});
  if(options.signal?.aborted)controller.abort();
  try {
    const res=await fetch(base+path,{...options,signal:controller.signal,headers:{'Content-Type':'application/json',...options.headers}});
    const body:unknown=await res.json();
    if(!res.ok){const e=body as {error?:{message?:string}};throw new Error(e?.error?.message??`HTTP ${res.status}`);}
    return body;
  } finally {clearTimeout(timer);options.signal?.removeEventListener('abort',cancel);}
}
export async function listEvents(signal:AbortSignal):Promise<EventItem[]> {
  const value=await call('/api/events',{signal});
  if(!Array.isArray(value)||!value.every(isEvent))throw new Error('接口数据形状不符合 EventItem[]，检查 Network 的 Response');
  return value;
}
export async function createEvent(input:EventInput):Promise<EventItem>{
  const value=await call('/api/events',{method:'POST',body:JSON.stringify(input)});
  if(!isEvent(value))throw new Error('创建响应形状错误');return value;
}
