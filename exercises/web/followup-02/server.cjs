// Teaching server: local only, static allow-list, no database or accounts.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const ROOT = __dirname;
const files = new Map([
  ['/', ['index.html', 'text/html;charset=utf-8']],
  ['/index.html', ['index.html', 'text/html;charset=utf-8']],
  ['/style.css', ['style.css', 'text/css;charset=utf-8']],
  ['/app.js', ['app.js', 'text/javascript;charset=utf-8']],
  ['/events.json', ['events.json', 'application/json;charset=utf-8']]
]);
function json(response, status, data) {
  response.writeHead(status, { 'Content-Type': 'application/json;charset=utf-8', 'Cache-Control': 'no-store' });
  response.end(JSON.stringify(data));
}
function createServer() {
  return http.createServer((request, response) => {
    try {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.setHeader('Allow', 'GET, HEAD');
      return json(response, 405, { error: '本机教学服务器只支持读取' });
    }
    if (url.pathname === '/api/events') {
      const keyword = url.searchParams.get('keyword') || '';
      if (keyword.length > 40) return json(response, 400, { error: '关键词超过40字' });
      const items = JSON.parse(fs.readFileSync(path.join(ROOT, 'events.json'), 'utf8'));
      const found = items.filter(item => item.title.includes(keyword.trim()));
      return json(response, 200, { items: found, count: found.length });
    }
    const selected = files.get(url.pathname);
    if (!selected) return json(response, 404, { error: '没有这个资源，请核对文件路径' });
    const body = fs.readFileSync(path.join(ROOT, selected[0]));
    response.writeHead(200, { 'Content-Type': selected[1], 'Cache-Control': 'no-store' });
    response.end(request.method === 'HEAD' ? undefined : body);
    } catch (error) {
      // Invalid local files must give an HTTP error, not crash the process.
      console.error('本地资源读取失败：', error.message);
      if (!response.headersSent) json(response, 500, { error: '本地资源读取失败，请检查服务器终端与文件内容' });
      else response.end();
    }
  });
}
module.exports = { createServer };
if (require.main === module) {
  createServer().listen(8762, '127.0.0.1', () => console.log('打开 http://127.0.0.1:8762/ ，Ctrl+C 停止'));
}
