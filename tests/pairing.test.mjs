import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePairingInput, ensurePairing } from '../client/pairing.mjs';

// Synthetic fixture only; never use a live workspace credential in tests.
const token = 'a'.repeat(48);
const origin = 'https://example.test';
const response = (status, value = {}) => ({ status, ok: status >= 200 && status < 300, json: async () => value });
const coded = code => error => error.code === code;
function queued(...results) {
  const calls = [];
  const fetcher = async (...args) => {
    calls.push(args);
    const value = results.shift();
    if (value instanceof Error) throw value;
    assert.ok(value, 'Unexpected extra request');
    return value;
  };
  return { calls, fetcher };
}

test('Invitation accepts raw codes and same-origin links without touching browser storage', () => {
  assert.equal(parsePairingInput(` ${token} `, origin), token);
  assert.equal(parsePairingInput(`${origin}/field/index.html#pair=${token}`, origin), token);
  assert.equal(parsePairingInput(`http://localhost:42873/field/index.html#pair=${token}`, 'http://localhost:42873'), token);
});

test('Invitation rejects missing, ambiguous, query, malformed, and non-HTTP credentials', () => {
  for (const value of ['', null, 'a'.repeat(47), '/field/index.html#pair=' + token,
    `${origin}/field/index.html`, `${origin}/#pair=bad`,
    `${origin}/?pair=${token}`, `${origin}/?other=1#pair=${token}`,
    `${origin}/#pair=${token}&pair=${token}`, `${origin}/#pair=${token}&other=1`,
    `https://user:password@example.test/#pair=${token}`, `file:///field/index.html#pair=${token}`]) {
    assert.throws(() => parsePairingInput(value, origin), coded('PAIR_INPUT'));
  }
});

test('Invitation distinguishes server address mismatch, including port and protocol', () => {
  for (const target of ['https://different.test', 'http://example.test', 'https://example.test:444']) {
    assert.throws(() => parsePairingInput(`${target}/#pair=${token}`, origin), coded('PAIR_ORIGIN'));
  }
});

test('Pairing proves session persistence before returning drawing; requests forbid cached auth', async () => {
  const drawing = { views: [{ id: 'fixture' }] };
  const { fetcher, calls } = queued(response(200), response(200, drawing));
  assert.deepEqual(await ensurePairing({ token, fetcher }), drawing);
  assert.equal(calls.length, 2);
  assert.equal(calls[0][0], '/api/pair');
  assert.equal(calls[0][1].method, 'POST');
  assert.deepEqual(JSON.parse(calls[0][1].body), { token });
  assert.equal(calls[1][0], '/api/drawing');
  for (const [, options] of calls) {
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.cache, 'no-store');
  }
  assert.equal(calls[1][1].body, undefined);
});

test('Existing session does not send a pairing request or bearer token', async () => {
  const { fetcher, calls } = queued(response(200, { id: 'drawing' }));
  assert.deepEqual(await ensurePairing({ fetcher }), { id: 'drawing' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], '/api/drawing');
});

test('Invalid token fails before network; rejected pairing never fetches drawing', async () => {
  let called = false;
  await assert.rejects(ensurePairing({ token: 'invalid', fetcher: async () => { called = true; } }), coded('PAIR_INPUT'));
  assert.equal(called, false);
  for (const [status, code] of [[401, 'PAIR_INVALID'], [403, 'PAIR_ORIGIN'], [429, 'HTTP_ERROR'], [500, 'HTTP_ERROR']]) {
    const { fetcher, calls } = queued(response(status));
    await assert.rejects(ensurePairing({ token, fetcher }), error => error.code === code && error.status === status);
    assert.equal(calls.length, 1);
  }
});

test('Missing session distinguishes lost cookie from an unpaired browser', async () => {
  const paired = queued(response(200), response(401));
  await assert.rejects(ensurePairing({ token, fetcher: paired.fetcher }), coded('PAIR_COOKIE'));
  const unpaired = queued(response(401));
  await assert.rejects(ensurePairing({ fetcher: unpaired.fetcher }), coded('AUTH_REQUIRED'));
});

test('Drawing errors retain status; network failures retain a recovery code without leaking token', async () => {
  for (const [status, code] of [[403, 'PAIR_ORIGIN'], [404, 'HTTP_ERROR'], [503, 'HTTP_ERROR']]) {
    await assert.rejects(ensurePairing({ fetcher: queued(response(status)).fetcher }), error => error.code === code && error.status === status);
  }
  for (const results of [[new Error(token)], [response(200), new Error(token)]]) {
    await assert.rejects(ensurePairing({ token, fetcher: queued(...results).fetcher }), error => error.code === 'NETWORK' && !error.message.includes(token));
  }
});

test('Cancellation reaches both requests and remains an AbortError for lifecycle cleanup', async () => {
  const controller = new AbortController();
  const success = queued(response(200), response(200, {}));
  await ensurePairing({ token, fetcher: success.fetcher, signal: controller.signal });
  for (const [, options] of success.calls) assert.equal(options.signal, controller.signal);
  const abort = new DOMException('Aborted', 'AbortError');
  for (const results of [[abort], [response(200), abort]]) {
    await assert.rejects(ensurePairing({ token, fetcher: queued(...results).fetcher, signal: controller.signal }), error => error === abort);
  }
});
