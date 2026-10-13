/* Content-address entry assets so a cached old router cannot accompany new HTML. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),file=path.join(root,'index.html');
const source=fs.readFileSync(file,'utf8');
const updated=source.replace(/((?:src|href)=")([^"?#]+\.(?:js|css))(?:\?v=[a-f0-9]+)?(")/g,(_,prefix,asset,end)=>{
  const content=fs.readFileSync(path.join(root,asset),'utf8').replace(/\r\n/g,'\n');
  const digest=crypto.createHash('sha256').update(content).digest('hex').slice(0,12);
  return `${prefix}${asset}?v=${digest}${end}`;
});
if(process.argv.includes('--check')){
  if(source!==updated)throw Error('Entry asset versions are stale. Run node scripts/version_site_assets.cjs');
  console.log('PASS: entry scripts and styles use current content hashes.');
}else{fs.writeFileSync(file,updated);console.log('Updated entry asset versions.');}
