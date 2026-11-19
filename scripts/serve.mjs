import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

const root = resolve('dist');
const prefix = '/Boldemort/';
const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.svg': 'image/svg+xml',
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, 'http://localhost').pathname,
    );
    if (!pathname.startsWith(prefix))
      throw new Error('Outside deployment base');
    const path = resolve(root, pathname.slice(prefix.length) || 'index.html');
    if (!path.startsWith(root + sep) || !(await stat(path)).isFile())
      throw new Error('Unknown file');
    response.setHeader(
      'Content-Type',
      mime[extname(path)] ?? 'application/octet-stream',
    );
    createReadStream(path).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
}).listen(Number(process.env.PORT ?? 4173), '127.0.0.1');
