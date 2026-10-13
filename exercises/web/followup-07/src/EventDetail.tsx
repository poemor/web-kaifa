import type {EventItem} from './types';
export function EventDetail({item,onBack}:{item:EventItem;onBack:()=>void}){return <section><h2>{item.title}</h2><p>服务器 ID：{item.id}</p><p>地点：{item.location||'地点待定'}</p><button onClick={onBack}>返回活动列表</button></section>;}
