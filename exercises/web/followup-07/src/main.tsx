import {useEffect,useState} from 'react';
import {createRoot} from 'react-dom/client';
import {listEvents,createEvent} from './api';
import {EventCard} from './EventCard';import {EventForm} from './EventForm';import {EventDetail} from './EventDetail';import {Notice} from './Notice';
import type {LoadState} from './types';import './style.css';
function App(){
  const [state,setState]=useState<LoadState>({kind:'loading'}),[refresh,setRefresh]=useState(0),[route,setRoute]=useState(location.hash||'#/events');
  useEffect(()=>{const change=()=>setRoute(location.hash||'#/events');addEventListener('hashchange',change);return()=>removeEventListener('hashchange',change);},[]);
  useEffect(()=>{const controller=new AbortController();setState({kind:'loading'});listEvents(controller.signal).then(items=>{if(!controller.signal.aborted)setState({kind:'ready',items});}).catch(err=>{if(!controller.signal.aborted)setState({kind:'error',message:err instanceof Error?err.message:'请求失败'});});return()=>controller.abort();},[refresh]);
  const id=Number(route.match(/^#\/events\/(\d+)$/)?.[1]),detail=state.kind==='ready'?state.items.find(x=>x.id===id):undefined;
  return <main><h1>社团活动管理：前端起点</h1><p>本课连接受控 mock HTTP 服务；重启 mock 会丢失新数据，第 08 课才切换自己编写的 API，第 09 课才用数据库。</p><a href="#/events">活动列表</a><button onClick={()=>setRefresh(x=>x+1)}>重新获取</button>
    {state.kind==='loading'&&<Notice message="正在请求 /api/events…"/>}
    {state.kind==='error'&&<Notice message={`读取失败：${state.message}。检查后端终端和 Network，再点重新获取。`}/>}
    {state.kind==='ready'&&(id?detail?<EventDetail item={detail} onBack={()=>location.hash='/events'}/>:<Notice message="当前列表中不存在这个活动 ID"/>:<><Notice message={state.items.length?`服务器返回 ${state.items.length} 条`:'服务器返回空列表'}/><ul>{state.items.map(item=><EventCard key={item.id} item={item} onOpen={()=>location.hash=`/events/${item.id}`}/>)}</ul></>)}
    <EventForm onSave={async input=>{await createEvent(input);location.hash='/events';setRefresh(x=>x+1);}}/>
  </main>;
}
createRoot(document.querySelector('#root')!).render(<App/>);
