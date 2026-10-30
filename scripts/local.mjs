import {spawn} from 'node:child_process';
import net from 'node:net';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
const port=Number(process.env.PORT||4173);
const listening=p=>new Promise(resolve=>{const socket=net.connect({host:'127.0.0.1',port:p});const finish=ok=>{socket.destroy();resolve(ok);};socket.setTimeout(500,()=>finish(false));socket.once('connect',()=>finish(true));socket.once('error',()=>finish(false));});
const [web,auth,database]=await Promise.all([port,9099,9000].map(listening));
const children=[];
function launch(args){const child=spawn(process.execPath,args,{cwd:root,stdio:'inherit',env:process.env});children.push(child);child.on('error',error=>{console.error(error.message);shutdown(1);});child.on('exit',code=>{if(code&& !stopping)shutdown(code);});}
let stopping=false;
function shutdown(code=0){if(stopping)return;stopping=true;for(const child of children)child.kill('SIGINT');if(!children.length)process.exit(code);else setTimeout(()=>process.exit(code),1500);}
if(auth!==database){console.error('Only one Firebase emulator port is in use. Stop that process before running npm run local.');process.exit(1);}
if(!web)launch(['scripts/serve.mjs']);
if(!auth)launch(['scripts/emulators.mjs','start']);
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>shutdown());
console.log(`\nJoin: http://localhost:${port}\nHost: http://localhost:${port}/host\nLocal emulator test: http://localhost:${port}/host?emulator=1\nFirebase UI: http://127.0.0.1:4000\nRealtime Database: 127.0.0.1:9000 · Anonymous Auth: 127.0.0.1:9099\n`);
if(!children.length)console.log('The game and local Firebase are already running.');
