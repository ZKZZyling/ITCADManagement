import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';
test('static artifact has complete versioned imports and snapshot-only entry points',()=>{
 execFileSync(process.execPath,['scripts/build-manager-static.mjs']);const root=path.resolve('dist/manager'),shell=JSON.parse(fs.readFileSync(path.join(root,'field/sw-shell.json'),'utf8'));
 for(const spec of shell.files){assert.match(spec,/\?release=[a-f0-9]+$/);const file=path.join(root,spec.split('?')[0]);assert.ok(fs.existsSync(file),spec);if(file.endsWith('.js'))for(const m of fs.readFileSync(file,'utf8').matchAll(/["'](\.\/[^"']+\.js\?release=[a-f0-9]+)["']/g))assert.ok(fs.existsSync(path.resolve(path.dirname(file),m[1].split('?')[0])),m[1])}
 for(const page of ['manager','sandbox'])assert.match(fs.readFileSync(path.join(root,'field/'+page+'.html'),'utf8'),/data-mode="snapshot-only"/);
 assert.match(fs.readFileSync(path.join(root,'field/assets/manager.js'),'utf8'),/sandbox\.html\?release=/);
});
