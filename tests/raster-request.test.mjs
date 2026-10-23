import test from 'node:test';
import assert from 'node:assert/strict';
import { createRasterRequestLoader } from '../client/raster-request.mjs';

const deferred = () => { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; };
const turn = () => new Promise(resolve => setTimeout(resolve, 5));
const options = { debounceMs: 0, retryDelaysMs: [0, 0] };
const httpError = status => Object.assign(new Error('Render failed'), { status });

test('a slow obsolete viewport never replaces the latest image and is disposed', async () => {
  const a = deferred(), b = deferred(), seen = [], disposed = [];
  const loader = createRasterRequestLoader({ ...options, load: key => key === 'a' ? a.promise : b.promise, onSuccess: value => seen.push(value), disposeResult: value => disposed.push(value) });
  const first = loader.request('a', 'a');
  await turn();
  const second = loader.request('b', 'b');
  await turn();
  b.resolve('new'); await second;
  a.resolve('old'); await first;
  assert.deepEqual(seen, ['new']);
  assert.deepEqual(disposed, ['old']);
  assert.equal(loader.getState().signature, 'b');
  loader.dispose();
});

test('an obsolete failure does not overwrite success or report an error', async () => {
  const old = deferred(), errors = [];
  const loader = createRasterRequestLoader({ ...options, load: key => key === 'old' ? old.promise : 'new', onError: error => errors.push(error) });
  const first = loader.request('old', 'old'); await turn();
  await loader.request('new', 'new');
  old.reject(httpError(500)); await first;
  assert.deepEqual(errors, []);
  assert.equal(loader.getState().status, 'success');
  loader.dispose();
});

test('429, 503 and network failures retry at most twice, then the same key can recover', async () => {
  for (const error of [httpError(429), httpError(503), new TypeError('Network request failed')]) {
    let attempts = 0, errors = 0;
    const loader = createRasterRequestLoader({ ...options, retryDelaysMs: [0, 0, 0, 0], load: () => { attempts++; if (attempts <= 3) throw error; return 'recovered'; }, onError: () => errors++ });
    assert.equal((await loader.request('same', {})).status, 'error');
    assert.equal(attempts, 3);
    assert.equal(errors, 1);
    assert.equal((await loader.request('same', {})).status, 'success');
    assert.equal(attempts, 4);
    assert.equal((await loader.request('same', {})).status, 'cached');
    loader.dispose();
  }
});

test('permanent HTTP and ordinary application errors do not retry', async () => {
  for (const error of [httpError(400), httpError(403), httpError(404), httpError(500), new Error('Invalid geometry')]) {
    let calls = 0;
    const loader = createRasterRequestLoader({ ...options, load: () => { calls++; throw error; } });
    await loader.request('key', {});
    assert.equal(calls, 1);
    loader.dispose();
  }
});

test('debounce coalesces repeated keys and cancellation prevents delayed load', async () => {
  let calls = 0;
  const loader = createRasterRequestLoader({ ...options, debounceMs: 30, load: () => { calls++; return 'image'; } });
  const first = loader.request('same', {});
  assert.equal(loader.request('same', {}), first);
  loader.cancel();
  assert.equal((await first).status, 'superseded');
  assert.equal(calls, 0);
  loader.dispose();
});

test('dispose aborts current work and releases a late value without callbacks', async () => {
  const work = deferred(); let signal, calls = 0, closed = 0;
  const loader = createRasterRequestLoader({ ...options, load: (_, request) => { signal = request.signal; return work.promise; }, onSuccess: () => calls++, onError: () => calls++ });
  const pending = loader.request('key', {}); await turn();
  loader.dispose();
  assert.equal(signal.aborted, true);
  work.resolve({ close() { closed++; } }); await pending;
  assert.equal(closed, 1); assert.equal(calls, 0);
  assert.equal((await loader.retry()).status, 'disposed');
  assert.equal((await loader.request('new', {})).status, 'disposed');
});

test('an explicit retry can refresh a successful signature and transient recovery reports once', async () => {
  let calls = 0, successes = 0;
  const loader = createRasterRequestLoader({ ...options, load: () => { calls++; if (calls === 1) throw httpError(503); return 'ok'; }, onSuccess: () => successes++ });
  await loader.request('key', {});
  assert.equal(calls, 2); assert.equal(successes, 1);
  await loader.retry();
  assert.equal(calls, 3); assert.equal(successes, 2);
  loader.dispose();
});
