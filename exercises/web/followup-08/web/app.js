const form=document.querySelector('#editor'), status=document.querySelector('#status'), list=document.querySelector('#list');
async function request(path,options={}) {
  const res=await fetch(path,{...options,headers:{'Content-Type':'application/json',...options.headers}});
  if(res.status===204)return null;
  const body=await res.json();
  if(!res.ok)throw new Error(body.error?.message??`HTTP ${res.status}`);
  return body;
}
async function load() {
  status.textContent='正在向服务器取数据…';
  try {
    const items=await request('/api/events');list.replaceChildren();
    for(const item of items) {
      const li=document.createElement('li'),text=document.createElement('span');
      text.textContent=`${item.id} · ${item.title} · ${item.location}`;li.append(text);
      const edit=document.createElement('button');edit.textContent='编辑';edit.onclick=()=>{form.elements.id.value=item.id;form.elements.title.value=item.title;form.elements.location.value=item.location;form.elements.title.focus();status.textContent=`正在编辑 #${item.id}`;};
      const del=document.createElement('button');del.textContent='删除';del.onclick=async()=>{if(!confirm(`删除“${item.title}”？`))return;del.disabled=true;try{await request(`/api/events/${item.id}`,{method:'DELETE'});document.querySelector('#refresh').focus();await load();}catch(err){status.textContent=err.message;del.disabled=false;}};
      li.append(edit,del);list.append(li);
    }
    status.textContent=items.length?`服务器返回 ${items.length} 条活动`:'服务器返回空列表。可创建第一条活动。';
  } catch(err){status.textContent=`获取失败：${err.message}。检查 Network，确认后端仍在运行。`;}
}
form.onsubmit=async e=>{
  e.preventDefault();const id=form.elements.id.value;
  const title=form.elements.title.value.trim(),location=form.elements.location.value.trim();
  if(!title){status.textContent='标题不能只有空格';form.elements.title.focus();return;}
  const submit=form.querySelector('button');submit.disabled=true;
  try{await request(id?`/api/events/${id}`:'/api/events',{method:id?'PATCH':'POST',body:JSON.stringify({title,location})});form.reset();await load();}catch(err){status.textContent=`保存失败：${err.message}`;}finally{submit.disabled=false;}
};
document.querySelector('#cancel-edit').onclick=()=>{form.reset();status.textContent='已取消本地编辑，没有发送更新';};
document.querySelector('#refresh').onclick=load;load();
