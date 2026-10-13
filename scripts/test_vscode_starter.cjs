/* Execute the downloadable workspace tasks in a separate folder, including spaces. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync,spawnSync}=require('node:child_process');
const goExecutable=process.env.GO_TOOLCHAIN_EXE||'go';
const root=path.resolve(__dirname,'..'),qa=path.join(root,'.qa');
fs.mkdirSync(qa,{recursive:true});
const temporary=fs.mkdtempSync(path.join(qa,'vscode starter '));
const folder=path.join(temporary,'vscode-first-program');
execFileSync('python',['-c',"import pathlib,sys,zipfile; p=pathlib.Path(sys.argv[2]).resolve(); z=zipfile.ZipFile(sys.argv[1]); assert all((p/i.filename).resolve().is_relative_to(p) for i in z.infolist()); z.extractall(p)",path.join(root,'assets/downloads/vscode-go-starter.zip'),temporary]);
const configs={};
for(const name of ['settings','tasks','launch','extensions']){
  configs[name]=JSON.parse(fs.readFileSync(path.join(folder,'.vscode',name+'.json'),'utf8'));
  assert.deepEqual(configs[name],JSON.parse(fs.readFileSync(path.join(root,'docs/tutorials/configs/go',name+'.json'),'utf8')));
}
const tasks=configs.tasks.tasks,replace=value=>String(value).replaceAll('${workspaceFolder}',folder);
// Reproduce the reported failure from a folder containing only main.go.
const bare=path.join(temporary,'only main go');fs.mkdirSync(bare);
fs.copyFileSync(path.join(folder,'main.go'),path.join(bare,'main.go'));
const isolatedEnv={...process.env,GOWORK:'off',GO111MODULE:'on'};
const missing=spawnSync(goExecutable,['build','-gcflags','all=-N -l','.'],{cwd:bare,env:isolatedEnv,encoding:'utf8'});
assert.notEqual(missing.status,0,'F5-style project build must fail without a module');
assert.match(missing.stderr,/go\.mod file not found|cannot find main module/);
assert.equal(execFileSync(goExecutable,['run','main.go'],{cwd:bare,env:isolatedEnv,encoding:'utf8'}).trim(),'你好，Go\n编译后的程序也能独立运行','single-file success does not prove project setup');
const tutorial=fs.readFileSync(path.join(root,'docs/tutorials/go-environment.md'),'utf8');
const recovery=tutorial.match(/```sh\r?\n(go mod init example\.com\/learn\/hello)\r?\n```/);assert(recovery,'recovery must provide one copyable initialization command');
execFileSync(goExecutable,recovery[1].split(' ').slice(1),{cwd:bare,env:isolatedEnv,stdio:'pipe'});
assert.equal(fs.readFileSync(path.join(bare,'main.go'),'utf8'),fs.readFileSync(path.join(folder,'main.go'),'utf8'),'initialization keeps saved source');
assert.equal(path.resolve(execFileSync(goExecutable,['env','GOMOD'],{cwd:bare,env:isolatedEnv,encoding:'utf8'}).trim()),path.join(bare,'go.mod'));
assert.equal(execFileSync(goExecutable,['run','.'],{cwd:bare,env:isolatedEnv,encoding:'utf8'}).trim(),'你好，Go\n编译后的程序也能独立运行');
execFileSync(goExecutable,['build','-o',path.join(bare,process.platform==='win32'?'debug-check.exe':'debug-check'),'-gcflags','all=-N -l','.'],{cwd:bare,env:isolatedEnv,stdio:'pipe'});
const runTask=label=>{
  const task=tasks.find(item=>item.label===label);assert(task,'documented task exists: '+label);
  if(task.dependsOn)runTask(task.dependsOn);
  const platform=process.platform==='win32'?{}:task[process.platform==='darwin'?'osx':'linux']||{};
  assert.equal(task.type,'process');
  const command=replace(platform.command||task.command);
  return execFileSync(command==='go'?goExecutable:command,(platform.args||task.args||[]).map(replace),{cwd:replace(task.options.cwd),encoding:'utf8',timeout:60000,stdio:'pipe'}).replace(/\r\n/g,'\n').trim();
};
const original='你好，Go\n编译后的程序也能独立运行';
assert.equal(runTask('Go: 运行当前项目'),original);
runTask('Go: 编译当前项目');
assert.equal(runTask('Go: 编译并运行'),original);
if(process.platform==='win32'){
  const failure=spawnSync('cmd.exe',['/d','/c','./hello.exe'],{cwd:folder,encoding:'utf8'});assert.notEqual(failure.status,0,'cmd reproduction must fail');
  for(const command of ['hello.exe','.\\hello.exe'])assert.equal(execFileSync('cmd.exe',['/d','/c',command],{cwd:folder,encoding:'utf8'}).replace(/\r\n/g,'\n').trim(),original);
  assert.equal(execFileSync('powershell.exe',['-NoProfile','-NonInteractive','-Command','.\\hello.exe'],{cwd:folder,encoding:'utf8'}).replace(/\r\n/g,'\n').trim(),original);
}
const file=path.join(folder,'main.go'),source=fs.readFileSync(file,'utf8');
fs.writeFileSync(file,source.replace('name := "Go"','name := "小林"'));
const updated=original.replace('你好，Go','你好，小林');
assert.equal(runTask('Go: 运行当前项目'),updated);
assert.equal(runTask('Go: 编译并运行'),updated);
fs.writeFileSync(file,source.replace('greeting(name)','missingGreeting(name)'));
let failed=false;
try {runTask('Go: 编译并运行');} catch(error) {failed=true;assert(String(error.stderr).includes('undefined: missingGreeting'),'the build error must abort the dependency chain');}
assert(failed,'bad source must fail even when a previous binary exists');
console.log('PASS: missing-module failure → documented initialization → project run/debug build, source preserved; downloaded configs/tasks, paths with spaces, shell-specific startup, edits/rebuild and build failure boundary.');
