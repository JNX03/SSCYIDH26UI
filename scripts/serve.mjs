import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
const root = resolve(process.argv.includes('--dist') ? 'dist' : '.');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.json':'application/json'};
const server = http.createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, `.${['/','/host','/host/'].includes(path) ? '/index.html' : path}`);
    if (!file.startsWith(`${root}/`)) { res.writeHead(403); res.end(); return; }
    const data = await readFile(file);
    res.writeHead(200, {'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control':'no-cache'});
    res.end(data);
  } catch { res.writeHead(404); res.end('Not found'); }
});
const port=Number(process.env.PORT || 4173);
server.listen(port, '0.0.0.0', () => console.log(`Local: http://localhost:${port}`));
