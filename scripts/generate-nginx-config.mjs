import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const deployment = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
const quote = value => '"' + value.replaceAll('\\', '\\\\').replaceAll('"', '\\"').replaceAll('$', '\\$') + '"';
const headers = deployment.headers.find(rule => rule.source === '/(.*)').headers
    .map(header => `    add_header ${header.key} ${quote(header.value)} always;`).join('\n');
const config = `server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    client_max_body_size 10m;
${headers}
    location / {
        try_files $uri $uri/index.html $uri.html =404;
    }
    location /assets/ { expires 1y; try_files $uri =404; }
    location = /sw.js { expires -1; try_files $uri =404; }
    location /css/ { expires -1; try_files $uri =404; }
    location /api/ai-proxy/kilo/ {
        proxy_pass https://api.kilo.ai/api/gateway/;
        proxy_ssl_server_name on;
        proxy_set_header Host api.kilo.ai;
        proxy_buffering off;
        proxy_read_timeout 120s;
    }
    location /api/ai-proxy/tokenrouter/ {
        proxy_pass https://api.tokenrouter.com/v1/;
        proxy_ssl_server_name on;
        proxy_set_header Host api.tokenrouter.com;
        proxy_buffering off;
        proxy_read_timeout 120s;
    }
}
`;
const destination = process.argv[2];
if (!destination) throw new Error('Supply an output file path.');
writeFileSync(resolve(destination), config);
console.log(`Generated nginx routing, AI proxies and shared security headers: ${destination}`);
