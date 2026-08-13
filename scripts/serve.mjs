import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

const root = process.argv.includes('--dist') ? 'dist' : '.';
const port = Number(process.env.PORT ?? 5173);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };

createServer((req, res) => {
  const requested = normalize(decodeURIComponent(new URL(req.url, `http://localhost:${port}`).pathname)).replace(/^\.\.(\/|\\|$)/, '');
  let file = join(root, requested === '/' ? 'index.html' : requested);
  if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html');
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(port, () => console.log(`Grand Billiards running at http://localhost:${port}`));
