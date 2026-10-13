import type {EventItem} from './types';
export function EventCard({item,onOpen}:{item:EventItem;onOpen:()=>void}) {
  return <li><h2>{item.title}</h2><p>{item.location||'地点待定'}</p><button onClick={onOpen}>查看详情 #{item.id}</button></li>;
}
