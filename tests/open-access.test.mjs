import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

async function isolatedServer(mode, run) {
  const tempBase = path.resolve(os.tmpdir());
  const data = fs.mkdtempSync(path.join(tempBase, 'itcad-open-access-test-'));
  const drawing = { drawing: 'Synthetic open-access test fixture', sourceSHA256: 'c'.repeat(64), datasetId: 'synthetic-open-access', fieldReadiness: { status: 'blocked' }, views: [], assets: [], warnings: ['Synthetic fixture only'] };
  const key = crypto.randomUUID();
  const packet = path.join(data, 'packets', key);
  fs.mkdirSync(packet, { recursive: true });
  fs.writeFileSync(path.join(packet, 'drawing.json'), JSON.stringify(drawing), 'utf8');
  fs.writeFileSync(path.join(data, 'active-package'), key, 'utf8');
  fs.writeFileSync(path.join(data, 'team-origin'), 'https://synthetic-open-test.lhr.life', 'utf8');
  fs.writeFileSync(path.join(data, 'team.pid'), 'synthetic-test-only', 'utf8');
  fs.writeFileSync(path.join(data, 'cloud-origin'), 'https://synthetic-open-test.trycloudflare.com', 'utf8');
  if (mode === 'file') fs.writeFileSync(path.join(data, 'access-mode'), 'open', 'utf8');
  const reserved = net.createServer();
  reserved.listen(0, '127.0.0.1');
  await once(reserved, 'listening');
  const port = reserved.address().port;
  await new Promise(resolve => reserved.close(resolve));
  const env = { ...process.env, ITFIELD_DATA_DIR: data, ITFIELD_HOST: '127.0.0.1' };
  // Never inherit a maintainer's open mode into the default-paired assertion.
  delete env.ITFIELD_ACCESS_MODE;
  if (mode === 'env') env.ITFIELD_ACCESS_MODE = 'open';
  const child = spawn(process.execPath, ['server/local.mjs', '--itfield-port=' + port], { cwd: root, env, stdio: ['ignore', 'ignore', 'pipe'] });
  child.stderr.resume();
  const base = 'http://127.0.0.1:' + port;
  try {
    let ready = false;
    for (let i = 0; i < 120; i++) {
      if (child.exitCode !== null) throw new Error('Isolated access-mode server exited during startup');
      try { ready = (await fetch(base + '/api/health')).ok; if (ready) break; } catch {}
      await pause(25);
    }
    assert.ok(ready, 'Isolated server must start');
    await run({ base, data, drawing });
  } finally {
    if (child.exitCode === null) { const exit = once(child, 'exit'); child.kill(); await exit; }
    const resolved = path.resolve(data);
    assert.ok(resolved.startsWith(tempBase + path.sep) && path.basename(resolved).startsWith('itcad-open-access-test-'));
    fs.rmSync(resolved, { recursive: true, force: true });
  }
}

for (const mode of ['env', 'file']) {
  test(`explicit open mode via ${mode}: no-cookie read/write, plain links, and origin/engineering guards`, { timeout: 30000 }, async () => {
    await isolatedServer(mode, async ({ base, data, drawing }) => {
      const health = await (await fetch(base + '/api/health')).json();
      assert.equal(health.accessMode, 'open');
      const opened = await fetch(base + '/api/drawing');
      assert.equal(opened.status, 200);
      assert.equal(opened.headers.get('set-cookie'), null);
      assert.equal((await opened.json()).datasetId, drawing.datasetId);
      assert.deepEqual((await (await fetch(base + '/api/records')).json()).records, []);
      const record = { id: `${drawing.sourceSHA256}-${drawing.datasetId}-fixture`, opId: crypto.randomUUID(), sourceSHA256: drawing.sourceSHA256, title: 'Synthetic test only', status: 'installed', version: 0, notes: 'Not a construction record', checks: [{ id: 'location', label: 'Synthetic location', result: 'pass' }], photos: [] };
      const post = (value, origin = base, query = '') => fetch(base + '/api/records' + query, { method: 'POST', headers: { 'content-type': 'application/json', origin }, body: JSON.stringify(value) });
      const saved = await post(record);
      assert.equal(saved.status, 200);
      assert.equal(saved.headers.get('set-cookie'), null);
      assert.equal((await saved.json()).version, 1);
      const viewerQuery = await fetch(base + '/api/records?view=synthetic-not-a-credential&role=viewer');
      assert.equal(viewerQuery.status, 200);
      assert.equal((await viewerQuery.json()).records.length, 1);
      assert.equal((await post({ ...record, opId: crypto.randomUUID(), version: 1 }, base, '?view=synthetic-not-a-credential')).status, 200);
      assert.equal((await post({ ...record, opId: crypto.randomUUID(), version: 2 }, 'https://foreign.invalid')).status, 403);
      assert.equal((await post({ ...record, opId: crypto.randomUUID(), version: 2, status: 'accepted' })).status, 422);
      const infoResponse = await fetch(base + '/api/server-info');
      assert.equal(infoResponse.status, 200);
      const info = await infoResponse.json();
      assert.equal(info.teamLink, 'https://synthetic-open-test.lhr.life/field/index.html');
      assert.equal(info.managerTeam, 'https://synthetic-open-test.lhr.life/field/manager.html');
      assert.equal(info.cloudflare, 'https://synthetic-open-test.trycloudflare.com/field/index.html');
      assert.ok(info.managerLocal.endsWith('/field/manager.html'));
      const links = [info.local, info.managerLocal, info.managerTeam, info.teamLink, info.cloudflare, ...info.tablet];
      for (const link of links) { const url = new URL(link); assert.equal(url.hash, ''); assert.equal(url.search, ''); }
      const serialized = JSON.stringify(info);
      for (const file of ['pair-token', 'viewer-token']) assert.ok(!serialized.includes(fs.readFileSync(path.join(data, file), 'utf8').trim()), 'Public links must not expose dormant paired-mode credentials');
    });
  });
}

test('default paired mode denies no-cookie requests and ignores viewer-style query credentials', { timeout: 30000 }, async () => {
  await isolatedServer('paired', async ({ base }) => {
    assert.equal((await (await fetch(base + '/api/health')).json()).accessMode, 'paired');
    for (const url of ['/api/drawing', '/api/records', '/api/server-info', '/api/manager?view=synthetic-not-a-credential', '/api/drawing?pair=synthetic-not-a-credential']) assert.equal((await fetch(base + url)).status, 401);
    assert.equal((await fetch(base + '/api/records?role=operator', { method: 'POST', headers: { 'content-type': 'application/json', origin: base }, body: '{}' })).status, 401);
  });
});
