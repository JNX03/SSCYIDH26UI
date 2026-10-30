import { cp, mkdir, rm } from 'node:fs/promises';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
for (const file of ['index.html', 'src', 'favicon.svg']) await cp(file, `dist/${file}`, { recursive: true });
console.log('Built Design Gym into dist/');

await mkdir('dist/host',{recursive:true});
await cp('index.html','dist/host/index.html');
