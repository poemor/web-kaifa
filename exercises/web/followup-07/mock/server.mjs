import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
const mode=process.env.MOCK_MODE??'normal',origin=process.env.MOCK_ORIGIN??'http://127.0.0.1:5173';let next=2;const events=[{id:1,title:'图论训练',location:'教室 A'}];
const send=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(value));};
export function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Access-Control-Allow-Headers','Content-Type');
  if(req.method==='OPTIONS'){res.writeHead(204);res.end();return;}
  if(req.url!=='/api/events'){send(res,404,{error:{code:'not_found',message:'路径不存在'}});return;}
  if(req.method==='GET'){
    const respond=()=>mode==='error'?send(res,500,{error:{code:'mock_error',message:'受控 500 演示'}}):send(res,200,mode==='empty'?[]:mode==='shape'?{items:events}:events);
    if(mode==='slow')delay(6000).then(respond);else respond();return;
  }
  if(req.method==='POST'){
    let raw='',size=0,large=false;req.on('data',chunk=>{size+=chunk.length;if(size>8192)large=true;else raw+=chunk;});req.on('end',()=>{if(large){send(res,413,{error:{code:'body_too_large',message:'请求体过大'}});return;}try{const value=JSON.parse(raw);if(typeof value.title!=='string'||!value.title.trim()||value.title.length>100||typeof value.location!=='string'){send(res,400,{error:{code:'validation',message:'标题与地点形状不正确'}});return;}const item={id:next++,title:value.title.trim(),location:value.location.trim()};events.push(item);send(res,201,item);}catch{send(res,400,{error:{code:'invalid_json',message:'JSON 语法错误'}});}});return;
  }
  send(res,405,{error:{code:'method',message:'本 mock 只演示 GET / POST'}});
}
const port=Number(process.env.MOCK_PORT??8777);
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))http.createServer(handler).listen(port,'127.0.0.1',()=>console.log(`mock: http://127.0.0.1:${port}; MOCK_MODE=${mode}`));
