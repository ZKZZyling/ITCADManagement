const TOKEN = /^[a-f0-9]{48}$/i;

function failure(code, message, status) {
  const error = new Error(message);
  error.code = code;
  if (status !== undefined) error.status = status;
  return error;
}

/** Read an invitation without persisting its bearer token or changing the URL. */
export function parsePairingInput(input, currentOrigin) {
  const value = typeof input === 'string' ? input.trim() : '';
  if (TOKEN.test(value)) return value;
  let invitation, origin;
  try {
    invitation = new URL(value);
    origin = new URL(currentOrigin).origin;
  } catch {
    throw failure('PAIR_INPUT', 'Enter the pairing code or a complete invitation link.');
  }
  if (!['http:', 'https:'].includes(invitation.protocol) || invitation.username || invitation.password) {
    throw failure('PAIR_INPUT', 'Use an HTTP or HTTPS invitation link.');
  }
  if (invitation.origin !== origin) {
    throw failure('PAIR_ORIGIN', 'This invitation belongs to a different server address.');
  }
  const fragment = new URLSearchParams(invitation.hash.slice(1));
  const entries = [...fragment.entries()];
  // Credentials belong only in the fragment: a query is sent to the server and logs.
  if (invitation.search || entries.length !== 1 || entries[0][0] !== 'pair' || !TOKEN.test(entries[0][1])) {
    throw failure('PAIR_INPUT', 'The invitation must contain one valid pairing code in its fragment.');
  }
  return entries[0][1];
}

async function request(fetcher, url, options) {
  try { return await fetcher(url, options); }
  catch (error) {
    if (error?.name === 'AbortError') throw error;
    throw failure('NETWORK', 'Cannot reach the server. Check the connection and try again.');
  }
}

/** Pair if requested, then prove that the browser can use the resulting session cookie. */
export async function ensurePairing({ token, fetcher = fetch, signal } = {}) {
  const pairing = token !== undefined && token !== null && token !== '';
  if (pairing) {
    if (typeof token !== 'string' || !TOKEN.test(token)) throw failure('PAIR_INPUT', 'Invalid pairing code format.');
    const paired = await request(fetcher, '/api/pair', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store', signal,
      headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token }),
    });
    if (paired.status === 401) throw failure('PAIR_INVALID', 'The pairing code is invalid or has changed.', 401);
    if (paired.status === 403) throw failure('PAIR_ORIGIN', 'The server did not accept this origin.', 403);
    if (!paired.ok) throw failure('HTTP_ERROR', `Pairing failed (HTTP ${paired.status}).`, paired.status);
  }
  const response = await request(fetcher, '/api/drawing', { credentials: 'same-origin', cache: 'no-store', signal });
  if (response.status === 401) throw failure(pairing ? 'PAIR_COOKIE' : 'AUTH_REQUIRED', pairing
    ? 'Pairing succeeded, but this browser did not retain the session cookie.'
    : 'Pair this browser with the server to continue.', 401);
  if (response.status === 403) throw failure('PAIR_ORIGIN', 'The server did not accept this origin.', 403);
  if (!response.ok) throw failure('HTTP_ERROR', `Cannot open drawing data (HTTP ${response.status}).`, response.status);
  return response.json();
}
