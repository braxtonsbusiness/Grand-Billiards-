import { cp, mkdir, rm } from 'node:fs/promises';

const target = 'android/app/src/main/assets/www';
await rm(target, { recursive: true, force: true });
await mkdir(`${target}/src`, { recursive: true });
await cp('index.html', `${target}/index.html`);
await cp('src', `${target}/src`, { recursive: true });
console.log(`Synced web game into ${target}/`);
