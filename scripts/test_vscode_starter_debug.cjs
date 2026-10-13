const fs=require('node:fs'),path=require('node:path'),net=require('node:net'),cp=require('node:child_process'),assert=require('node:assert/strict');
// Independent DAP regression. Requires a supported patched Go SDK, Delve and Python.
// Set GO_TOOLCHAIN_EXE / VSCODE_QA_DLV to use isolated tools; no global settings change.
const ROOT=path.resolve(__dirname,'..');
process.chdir(ROOT);
const QA=path.join(ROOT,'.qa','vscode-debug-peer');
fs.mkdirSync(QA,{recursive:true});
const unpack=cp.spawnSync(process.env.VSCODE_QA_PYTHON||'python',['-c',
  'import zipfile,json,base64,sys; z=zipfile.ZipFile(sys.argv[1]); print(json.dumps({n:base64.b64encode(z.read(n)).decode() for n in z.namelist()}))',
  path.join(ROOT,'assets/downloads/vscode-go-starter.zip')],{encoding:'utf8',windowsHide:true});
assert.equal(unpack.status,0,'Cannot read starter ZIP; check Python and assets/downloads/vscode-go-starter.zip: '+unpack.stderr);
const destination=path.join(QA,'run-'+Date.now());
fs.mkdirSync(destination);
const members=JSON.parse(unpack.stdout);
assert.equal(Object.keys(members).length,7,'Starter ZIP must contain exactly seven source/config files');
for(const [name,encoded] of Object.entries(members)){
  const target=path.resolve(destination,name);
  assert(target.startsWith(destination+path.sep),'Unsafe ZIP entry: '+name);
  fs.mkdirSync(path.dirname(target),{recursive:true});
  fs.writeFileSync(target,Buffer.from(encoded,'base64'));
}
const workspace=path.join(destination,'vscode-first-program');
const go=process.env.GO_TOOLCHAIN_EXE||'go';
const env={...process.env,GOTOOLCHAIN:'local',GOWORK:'off'};for(const k of Object.keys(env))if(k.toLowerCase()==='path')delete env[k];env.PATH=(process.env.GO_TOOLCHAIN_EXE?path.dirname(path.resolve(go))+path.delimiter:'')+process.env.PATH;delete env.GOROOT;
const dlv=process.env.VSCODE_QA_DLV||'dlv';const transcript=[];let socket,child;
const events=[];let seq=1;const pending=new Map();const watchers=[];
function event(name,filter=()=>true){const seen=events.findIndex(e=>e.event===name&&filter(e));if(seen>=0)return Promise.resolve(events.splice(seen,1)[0]);return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('DAP event timeout: '+name)),30000);watchers.push({name,filter,resolve:e=>{clearTimeout(timer);resolve(e);}});});}
function request(command,args={}){const n=seq++;return new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('DAP request timeout: '+command)),90000);pending.set(n,{resolve:r=>{clearTimeout(timer);r.success?resolve(r):reject(new Error(JSON.stringify(r)));}});const payload=Buffer.from(JSON.stringify({seq:n,type:'request',command,arguments:args}));transcript.push({direction:'request',command,args});socket.write('Content-Length: '+payload.length+'\r\n\r\n');socket.write(payload);});}
(async()=>{
const version=cp.spawnSync(go,['version'],{env,encoding:'utf8',windowsHide:true});assert.equal(version.status,0,'Go unavailable; set GO_TOOLCHAIN_EXE to an installed supported SDK');const match=/go(\d+)\.(\d+)\.(\d+)/.exec(version.stdout);assert(match&&(+match[1]>1||(+match[1]===1&&(+match[2]>26||(+match[2]===26&&+match[3]>=9)))),'Use supported patched Go >=1.26.9; no SDK is installed by this test');const debuggerVersion=cp.spawnSync(dlv,['version'],{env,encoding:'utf8',windowsHide:true});assert.equal(debuggerVersion.status,0,'Delve unavailable; set VSCODE_QA_DLV to a dlv executable');
child=cp.spawn(dlv,['dap','--listen=127.0.0.1:0'],{cwd:workspace,env,windowsHide:true});let diagnostic='';child.stdout.on('data',b=>{diagnostic+=b.toString();});child.stderr.on('data',b=>{diagnostic+=b.toString();});
try{
const port=await new Promise((resolve,reject)=>{const deadline=setTimeout(()=>reject(new Error('Delve start timeout '+diagnostic)),15000);const check=setInterval(()=>{const match=/DAP server listening at:\s*127\.0\.0\.1:(\d+)/.exec(diagnostic);if(match){clearInterval(check);clearTimeout(deadline);resolve(+match[1]);}},50);});
socket=net.createConnection({host:'127.0.0.1',port});await new Promise((r,j)=>{socket.once('connect',r);socket.once('error',j);});let buffer=Buffer.alloc(0);
socket.on('data',chunk=>{buffer=Buffer.concat([buffer,chunk]);while(true){const end=buffer.indexOf('\r\n\r\n');if(end<0)return;const match=/Content-Length:\s*(\d+)/i.exec(buffer.subarray(0,end).toString());const length=+match[1];if(buffer.length<end+4+length)return;const message=JSON.parse(buffer.subarray(end+4,end+4+length).toString());buffer=buffer.subarray(end+4+length);transcript.push({direction:'received',...message});if(message.type==='response'){pending.get(message.request_seq)?.resolve(message);pending.delete(message.request_seq);}else if(message.type==='event'){const index=watchers.findIndex(w=>w.name===message.event&&w.filter(message));if(index>=0)watchers.splice(index,1)[0].resolve(message);else events.push(message);}}});
await request('initialize',{clientID:'independent-tutorial-QA',adapterID:'go',pathFormat:'path',linesStartAt1:true,columnsStartAt1:true,supportsVariableType:true,supportsRunInTerminalRequest:false});
const settings=JSON.parse(fs.readFileSync(path.join(workspace,'.vscode/launch.json'),'utf8')).configurations[0];assert.equal(settings.mode,'debug');assert.equal(settings.console,'internalConsole');
const resolved=Object.fromEntries(Object.entries(settings).map(([k,v])=>[k,typeof v==='string'?v.replaceAll('${workspaceFolder}',workspace):v]));
const launch=request('launch',resolved);await event('initialized');
const filename=path.join(workspace,'main.go'),source=fs.readFileSync(filename,'utf8').split(/\r?\n/),line=source.findIndex(s=>s.includes('fmt.Println(message)'))+1;
const bp=await request('setBreakpoints',{source:{name:'main.go',path:filename},breakpoints:[{line}],sourceModified:false});assert(bp.body.breakpoints[0].verified);
await request('configurationDone');await launch;const stopped=await event('stopped');assert.equal(stopped.body.reason,'breakpoint');const threadId=stopped.body.threadId;
const stack=await request('stackTrace',{threadId,startFrame:0,levels:10});const frame=stack.body.stackFrames[0];assert.equal(frame.line,line);assert.match(frame.name,/main\.main/);
const scopes=await request('scopes',{frameId:frame.id});const locals=scopes.body.scopes.find(s=>s.name==='Locals');assert(locals);
const variables=await request('variables',{variablesReference:locals.variablesReference});const name=variables.body.variables.find(v=>v.name==='name'),message=variables.body.variables.find(v=>v.name==='message');assert.equal(name.value,'"Go"');assert.equal(message.value,'"你好，Go"');
const watch=await request('evaluate',{expression:'message',context:'watch',frameId:frame.id});assert.equal(watch.body.result,'"你好，Go"');
await request('next',{threadId});await event('stopped');const after=await request('stackTrace',{threadId,startFrame:0,levels:1});assert.equal(after.body.stackFrames[0].line,line+1);
await request('continue',{threadId});await event('terminated');
await new Promise(r=>setTimeout(r,100));const output=transcript.filter(m=>m.type==='event'&&m.event==='output').map(m=>m.body?.output||'').join('')+diagnostic;assert.match(output,/你好，Go/);assert.match(output,/编译后的程序也能独立运行/);
try{await request('disconnect',{terminateDebuggee:true});}catch{};
const result={go,dlv,configuration:resolved,breakpointLine:line,frame,name,message,watch:watch.body.result,nextLine:after.body.stackFrames[0].line,output,transcript};fs.writeFileSync(path.join(QA,'dap-results.json'),JSON.stringify(result,null,2));console.log(JSON.stringify({passed:true,breakpointLine:line,name,message,nextLine:after.body.stackFrames[0].line,output}));
}finally{if(socket)socket.destroy();if(child&&!child.killed)child.kill();}
})().catch(e=>{fs.writeFileSync(path.join(QA,'dap-failure.json'),JSON.stringify({error:e.message,transcript},null,2));console.error(e);process.exitCode=1;});
