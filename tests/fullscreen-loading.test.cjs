// Run with Node.js; tests execute the actual Vue SFC scripts without a browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function fakeClock() {
  let now = 100000;
  let nextId = 1;
  const timers = new Map();
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  return {
    Date: ClockDate,
    setTimeout(fn, delay) {
      const id = nextId++;
      timers.set(id, { fn, at: now + Math.max(0, Number(delay) || 0) });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    tick(duration) {
      const end = now + duration;
      while (true) {
        const due = [...timers].filter(([, timer]) => timer.at <= end)
          .sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        now = due[1].at;
        timers.delete(due[0]);
        due[1].fn();
      }
      now = end;
    },
    count() { return timers.size; }
  };
}

function loadSfc(relative, globals = {}) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const script = source.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1]
    .replace(/^[ \t]*import[\s\S]*?from\s+['"][^'"]+['"][ \t]*;?/gm, '')
    .replace(/export\s+default/, 'module.exports =');
  const context = {
    module: { exports: {} },
    console: { log() {} },
    mapState: () => ({}),
    mapMutations: () => ({}),
    hasPromoPrice: () => false,
    formatPromoPrice: value => String(value),
    formatPromoUnit: value => value,
    ...globals
  };
  vm.runInNewContext(script, context, { filename: relative });
  return context.module.exports;
}

function instance(options, props = {}) {
  const state = { ...props, ...options.data() };
  for (const [key, method] of Object.entries(options.methods || {})) state[key] = method.bind(state);
  return state;
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function flush() { for (let i = 0; i < 5; i++) await Promise.resolve(); }

function bookFixture(props = {}) {
  const clock = fakeClock();
  const options = loadSfc('components/book-loading/book-loading.vue', clock);
  const state = instance(options, { loading: true, delay: 0, minDuration: 400, fullscreen: true, ...props });
  options.watch.loading.handler.call(state);
  return { clock, options, state };
}

function homeFixture({ cache = '', response = { data: { rows: [] } } } = {}) {
  const clock = fakeClock();
  const writes = [];
  const commits = [];
  const options = loadSfc('pages/index/index.vue', {
    ...clock,
    uni: {
      getStorageSync: () => cache,
      setStorageSync: (...args) => writes.push(args)
    },
    getStore: () => Promise.resolve(response)
  });
  const state = instance(options, {
    $store: {
      commit: (...args) => commits.push(args),
      dispatch: (...args) => commits.push(args)
    }
  });
  state._homeAlive = true;
  return { clock, options, state, writes, commits };
}

async function main() {
  let passed = 0;
  const test = async (label, check) => {
    await check();
    passed++;
    console.log('PASS ' + label);
  };

  await test('fast response keeps the full-screen animation visible for 400 ms, then closes', () => {
    const { clock, state } = bookFixture();
    assert.equal(state.visible, true);
    clock.tick(100);
    state.loading = false;
    state.syncVisibility();
    clock.tick(299);
    assert.equal(state.visible, true);
    clock.tick(1);
    assert.equal(state.visible, false);
    assert.equal(clock.count(), 0);
  });

  await test('a completed slow request closes immediately without another artificial delay', () => {
    const { clock, state } = bookFixture();
    clock.tick(800);
    state.loading = false;
    state.syncVisibility();
    assert.equal(state.visible, false);
    assert.equal(clock.count(), 0);
  });

  await test('a new request cancels a pending close and stays visible until it finishes', () => {
    const { clock, state } = bookFixture();
    clock.tick(100);
    state.loading = false;
    state.syncVisibility();
    clock.tick(100);
    state.loading = true;
    state.syncVisibility();
    clock.tick(500);
    assert.equal(state.visible, true);
    state.loading = false;
    state.syncVisibility();
    assert.equal(state.visible, false);
  });

  await test('page hide cancels pending show and close timers; showing the page can resume loading', () => {
    const { clock, state, options } = bookFixture({ delay: 220 });
    assert.equal(state.visible, false);
    assert.equal(clock.count(), 1);
    options.onPageHide.call(state);
    assert.equal(clock.count(), 0);
    clock.tick(1000);
    assert.equal(state.visible, false);
    options.onPageShow.call(state);
    clock.tick(220);
    assert.equal(state.visible, true);
    state.loading = false;
    state.syncVisibility();
    assert.equal(clock.count(), 1);
    options.onPageHide.call(state);
    assert.equal(clock.count(), 0);
    assert.equal(state.visible, false);
  });

  await test('component destruction clears either kind of timer', () => {
    for (const delay of [0, 220]) {
      const { clock, state, options } = bookFixture({ delay });
      if (!delay) { state.loading = false; state.syncVisibility(); }
      assert.equal(clock.count(), 1);
      options.beforeDestroy.call(state);
      assert.equal(clock.count(), 0);
      assert.equal(state._pageHidden, true);
    }
  });

  for (const fail of [false, true]) {
    await test('home waits for all three content requests' + (fail ? ' even when one fails' : ''), async () => {
      const { clock, state } = homeFixture();
      const requests = [deferred(), deferred(), deferred()];
      [state.setSwiper, state.loadPromo, state.getStoreList] = requests.map(request => () => request.promise);
      const task = state.loadHome();
      assert.equal(state.homeLoading, true);
      requests[0].resolve();
      if (fail) requests[1].reject(new Error('simulated network failure'));
      else requests[1].resolve();
      await flush();
      assert.equal(state.homeLoading, true);
      requests[2].resolve();
      await task;
      assert.equal(state.homeLoading, false);
      assert.equal(clock.count(), 0);
    });
  }

  await test('home watchdog releases a hung request after 12 seconds', async () => {
    const { clock, state } = homeFixture();
    const pending = deferred();
    state.setSwiper = () => pending.promise;
    state.loadPromo = () => Promise.resolve();
    state.getStoreList = () => Promise.resolve();
    const task = state.loadHome();
    clock.tick(11999);
    assert.equal(state.homeLoading, true);
    clock.tick(1);
    assert.equal(state.homeLoading, false);
    pending.resolve();
    await task;
    assert.equal(clock.count(), 0);
  });

  await test('home unload cancels its watchdog and prevents a late loading-state write', async () => {
    const { clock, state, options } = homeFixture();
    const pending = deferred();
    state.setSwiper = () => pending.promise;
    state.loadPromo = () => Promise.resolve();
    state.getStoreList = () => Promise.resolve();
    const task = state.loadHome();
    options.onUnload.call(state);
    assert.equal(clock.count(), 0);
    let lateWrites = 0;
    const savedLoading = state.homeLoading;
    Object.defineProperty(state, 'homeLoading', {
      get: () => savedLoading,
      set: () => { lateWrites++; }
    });
    pending.resolve();
    await task;
    clock.tick(20000);
    assert.equal(lateWrites, 0);
  });

  await test('invalid cached JSON and an empty store list do not crash or invent a store', async () => {
    const { state, writes, commits } = homeFixture({ cache: '{broken json' });
    assert.equal(state.cachedStore(), null);
    await state.getStoreList();
    assert.equal(state.storeList.length, 0);
    assert.equal(writes.length, 0);
    assert.equal(commits.some(([name]) => name === 'setStore'), false);
  });

  await test('valid store rows recover from invalid cache; object caches survive empty responses', async () => {
    const fresh = { roomId: 8, roomName: 'test store' };
    const recovery = homeFixture({ cache: 'invalid', response: { data: { rows: [fresh] } } });
    await recovery.state.getStoreList();
    assert.equal(recovery.state.storeList[0].roomId, 8);
    assert.equal(JSON.parse(recovery.writes[0][1]).roomId, 8);
    const cached = homeFixture({ cache: fresh });
    await cached.state.getStoreList();
    assert.equal(cached.commits.find(([name]) => name === 'setStore')[1].roomId, 8);
  });

  console.log('Full-screen loading checks passed: ' + passed + '.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
