import { cpSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const inspectorPkg = require.resolve('@modelcontextprotocol/inspector/package.json');
const inspectorRoot = dirname(inspectorPkg);
const src = resolve(inspectorRoot, 'client/dist');
const dest = resolve(dirname(fileURLToPath(import.meta.url)), 'public');

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });

const indexPath = resolve(dest, 'index.html');
const html = readFileSync(indexPath, 'utf8');
const preloadScript = `<script>
  if (localStorage.getItem('_owInit') !== '3') {
    localStorage.setItem('lastSseUrl', 'https://inspector.openwallet.vn/proxy/');
    localStorage.setItem('lastTransportType', 'streamable-http');
    localStorage.setItem('lastConnectionType', 'direct');
    localStorage.setItem('_owInit', '3');
  }
</script>`;
writeFileSync(indexPath, html.replace('</head>', preloadScript + '\n</head>'));
console.log('Inspector UI built with pre-configured defaults.');
