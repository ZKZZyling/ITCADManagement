/** Keep only the latest viewport request. Successful values belong to onSuccess;
 * stale values are disposed here. A failed key can be requested again explicitly.
 * load(context, { signal, attempt, signature }) must throw HTTP errors with status.
 */
export function createRasterRequestLoader({
  load, onSuccess = () => {}, onError = () => {}, disposeResult = value => value?.close?.(),
  debounceMs = 180, retryDelaysMs = [250, 650],
} = {}) {
  if (typeof load !== 'function') throw new TypeError('Raster load function is required');
  const delays = retryDelaysMs.slice(0, 2).map(delay => Math.max(0, Number(delay) || 0));
  let generation = 0, active = null, completedKey = null, lastRequest = null, disposed = false;
  let state = { status: 'idle', signature: null, attempt: 0 };
  const current = task => !disposed && active === task && task.generation === generation;
  const pause = (ms, signal) => new Promise(resolve => {
    if (signal.aborted) return resolve();
    const finish = () => { clearTimeout(timer); signal.removeEventListener('abort', finish); resolve(); };
    const timer = setTimeout(finish, ms);
    signal.addEventListener('abort', finish, { once: true });
  });
  const transient = error => !error?.status && (error instanceof TypeError || error?.transient === true)
    || [429, 503].includes(Number(error?.status));
  function cancel() {
    generation++;
    const previous = active;
    active = null;
    previous?.controller.abort();
    completedKey = null;
    state = { status: disposed ? 'disposed' : 'idle', signature: null, attempt: 0 };
  }
  function request(signature, context) {
    if (disposed) return Promise.resolve({ status: 'disposed' });
    if (active?.signature === signature) return active.promise;
    if (completedKey === signature) return Promise.resolve({ status: 'cached', signature });
    cancel();
    lastRequest = { signature, context };
    const task = { signature, generation, controller: new AbortController() };
    active = task;
    state = { status: 'loading', signature, attempt: 0 };
    task.promise = (async () => {
      await pause(debounceMs, task.controller.signal);
      for (let attempt = 0; current(task); attempt++) {
        state = { status: 'loading', signature, attempt };
        let value;
        try {
          value = await load(context, { signal: task.controller.signal, attempt, signature });
        } catch (error) {
          if (!current(task)) return { status: 'superseded', signature };
          if (error?.name === 'AbortError') {
            active = null;
            state = { status: 'idle', signature: null, attempt };
            return { status: 'cancelled', signature };
          }
          if (attempt < delays.length && transient(error)) {
            await pause(delays[attempt], task.controller.signal);
            continue;
          }
          active = null;
          completedKey = null;
          state = { status: 'error', signature, attempt };
          onError(error, context, { signature, attempt });
          return { status: 'error', signature, error };
        }
        if (!current(task)) {
          disposeResult(value);
          return { status: 'superseded', signature };
        }
        active = null;
        completedKey = signature;
        state = { status: 'success', signature, attempt };
        onSuccess(value, context, { signature, attempt });
        return { status: 'success', signature };
      }
      return { status: 'superseded', signature };
    })();
    return task.promise;
  }
  return {
    request,
    retry() {
      if (disposed || !lastRequest) return Promise.resolve({ status: disposed ? 'disposed' : 'idle' });
      const { signature, context } = lastRequest;
      cancel();
      return request(signature, context);
    },
    cancel,
    dispose() { disposed = true; cancel(); lastRequest = null; },
    getState: () => ({ ...state }),
  };
}
