import {useState} from 'react';
import type {EventInput} from './types';
export function EventForm({onSave}:{onSave:(input:EventInput)=>Promise<void>}){
  const [title,setTitle]=useState(''),[location,setLocation]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  return <form onSubmit={async e=>{e.preventDefault();if(!title.trim()){setError('标题不能只有空格');return;}setBusy(true);setError('');try{await onSave({title:title.trim(),location:location.trim()});setTitle('');setLocation('');}catch(err){setError(err instanceof Error?err.message:'保存失败');}finally{setBusy(false);}}}>
    <h2>新增活动</h2><label htmlFor="title">标题</label><input id="title" value={title} required maxLength={100} onChange={e=>setTitle(e.target.value)}/>
    <label htmlFor="location">地点</label><input id="location" value={location} maxLength={100} onChange={e=>setLocation(e.target.value)}/>
    <button disabled={busy}>{busy?'正在请求…':'提交给 API'}</button><p role="status">{error}</p>
  </form>;
}
