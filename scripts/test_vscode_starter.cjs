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
console.log('PASS: downloaded four JSON configurations, process tasks, paths with spaces, shell-specific executable startup, saved edits/rebuild and build failure dependency boundary.');
