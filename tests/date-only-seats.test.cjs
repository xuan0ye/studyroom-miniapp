// Run with Node.js. Execute the real date helpers and Vue SFC scripts without network calls.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const TODAY = '2026-10-25';

function clock(initial = '2026-10-25T04:00:00Z') {
  let now = Date.parse(initial);
  class ClockDate extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  }
  return { Date: ClockDate, set(value) { now = Date.parse(value); } };
}

function stripImports(source) {
  return source.replace(/^[ \t]*import[\s\S]*?from\s+['"][^'"]+['"][ \t]*;?/gm, '');
}

function loadModule(relative, names, globals = {}) {
  const source = stripImports(fs.readFileSync(path.join(root, relative), 'utf8'))
    .replace(/\bexport\s+(?=(?:async\s+)?function|const|let|class)/g, '');
  const context = { module: { exports: {} }, ...globals };
  vm.runInNewContext(source + '\nmodule.exports = {' + names.join(',') + '};', context, { filename: relative });
  return context.module.exports;
}

function dateHelpers(taskClock = clock()) {
  return loadModule('utils/reservation-date.js', [
    'reservationDate', 'reservationDay', 'rememberReservationDate', 'takeReservationDate'
  ], { Date: taskClock.Date });
}

function loadSfc(relative, globals) {
  const source = fs.readFileSync(path.join(root, relative), 'utf8');
  const script = stripImports(source.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1])
    .replace(/export\s+default/, 'module.exports =');
  const context = {
    module: { exports: {} },
    console: { log() {}, error() {} },
    mapState: () => ({}),
    mapMutations: () => ({}),
    ...globals
  };
  vm.runInNewContext(script, context, { filename: relative });
  return context.module.exports;
}

function instance(options, extra = {}) {
  const state = { ...options.data(), ...extra };
  for (const [name, method] of Object.entries(options.methods || {})) state[name] = method.bind(state);
  for (const [name, getter] of Object.entries(options.computed || {})) {
    if (typeof getter === 'function') Object.defineProperty(state, name, { get: getter.bind(state), configurable: true });
  }
  return state;
}

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function flush() { for (let i = 0; i < 6; i++) await Promise.resolve(); }

function snapshot(date, available = 5) {
  return { date, available, occupied: 22 - available, total: 22, seats: {}, capturedAt: 1792900800000 };
}

function statusFixture() {
  const taskClock = clock();
  const helpers = dateHelpers(taskClock);
  const requests = [];
  const tabs = [];
  const auth = { loggedIn: true, token: 'first-token' };
  const options = loadSfc('other_pages/seat-status/seat-status.vue', {
    Date: taskClock.Date,
    ...helpers,
    SEAT_MAP_IMAGE: '/test-map.jpg',
    createSeatPositions: () => ({}),
    isLoggedIn: () => auth.loggedIn,
    uni: { getStorageSync: () => auth.token, switchTab: value => tabs.push(value) },
    getCurrentSeats(roomId, date) {
      const request = { roomId, date, ...deferred() };
      requests.push(request);
      return request.promise;
    },
    clearInterval() {}
  });
  const state = instance(options, { $store: { state: { store: { roomId: 'store-a' } } } });
  options.onLoad.call(state, {});
  return { state, options, requests, helpers, tabs, auth, taskClock };
}

function orderFixture(helpers, taskClock, roomId = 'store-a') {
  const routes = [];
  let loads = 0;
  const options = loadSfc('pages/order/order.vue', {
    Date: taskClock.Date,
    ...helpers,
    isLoggedIn: () => true,
    uni: { $u: { route: (url, params) => routes.push({ url, params }) } }
  });
  const state = instance(options, { store: { roomId }, setIndex() {} });
  state.loadDailyConfig = () => { loads++; };
  state.loadDayCards = () => { loads++; };
  options.onLoad.call(state);
  return { state, options, routes, get loads() { return loads; } };
}

async function main() {
  let passed = 0;
  async function test(label, check) {
    await check();
    passed++;
    console.log('PASS ' + label);
  }

  await test('today changes at Beijing midnight rather than UTC midnight', () => {
    const { reservationDate } = dateHelpers();
    assert.equal(reservationDate(new Date('2026-12-31T15:59:59.999Z')), '2026-12-31');
    assert.equal(reservationDate(new Date('2026-12-31T16:00:00.000Z')), '2027-01-01');
    assert.equal(reservationDate(new Date('2026-10-24T23:30:00Z')), TODAY);
  });

  await test('whole-day windows cross month, year, and leap-day boundaries', () => {
    const { reservationDay } = dateHelpers();
    for (const [date, next] of [
      ['2026-01-31', '2026-02-01'], ['2026-12-31', '2027-01-01'],
      ['2024-02-28', '2024-02-29'], ['2024-02-29', '2024-03-01'],
      ['2026-02-28', '2026-03-01']
    ]) {
      const day = reservationDay(date);
      assert.equal(day.date, date);
      assert.equal(day.startTime, date + ' 00:00:00');
      assert.equal(day.endTime, next + ' 00:00:00');
    }
  });

  await test('invalid or noncanonical dates cannot be normalized into another day', () => {
    const { reservationDay } = dateHelpers();
    for (const date of ['', '2026-2-01', '2026-02-29', '2024-02-30', '2026-04-31',
      '2026-00-10', '2026-13-01', '2026-10-00', '2026-10-25 10:00:00', null, undefined]) {
      assert.throws(() => reservationDay(date));
    }
  });

  await test('pending booking date is consumed once and room identifiers compare consistently', () => {
    const helpers = dateHelpers();
    helpers.rememberReservationDate(7, '2026-10-26');
    assert.equal(helpers.takeReservationDate('7', TODAY, '2026-11-24'), '2026-10-26');
    assert.equal(helpers.takeReservationDate(7, TODAY, '2026-11-24'), '');
  });

  await test('another room, an expired date, or a date beyond the booking window is discarded', () => {
    const helpers = dateHelpers();
    helpers.rememberReservationDate('store-a', '2026-10-26');
    assert.equal(helpers.takeReservationDate('store-b', TODAY, '2026-11-24'), '');
    assert.equal(helpers.takeReservationDate('store-a', TODAY, '2026-11-24'), '');
    for (const date of ['2026-10-24', '2026-11-25']) {
      helpers.rememberReservationDate('store-a', date);
      assert.equal(helpers.takeReservationDate('store-a', TODAY, '2026-11-24'), '');
      assert.equal(helpers.takeReservationDate('store-a', '2026-01-01', '2026-12-31'), '');
    }
  });

  await test('seat API uses the requested whole day and keeps duplicate occupied seats occupied', async () => {
    const taskClock = clock('2026-12-31T16:00:00Z');
    const helpers = dateHelpers(taskClock);
    const { createSeatPositions } = loadModule('config/seat-layout.js', ['createSeatPositions']);
    const calls = [];
    const seats = loadModule('utils/current-seats.js', ['getCurrentSeats'], {
      Date: taskClock.Date, ...helpers, createSeatPositions,
      getSeat: async (params, config) => {
        calls.push({ params, config });
        return { data: { seatCom: [
          { seatNum: 1, status: true }, { seatNum: 2, status: false }, { seatNum: 2, status: true }
        ], seatVip: [{ seatNum: 13, status: '1' }] } };
      }
    });
    const result = await seats.getCurrentSeats('store-a', '2024-02-29');
    assert.equal(calls.length, 1);
    assert.equal(calls[0].params.roomId, 'store-a');
    assert.equal(calls[0].params.startTime, '2024-02-29 00:00:00');
    assert.equal(calls[0].params.endTime, '2024-03-01 00:00:00');
    assert.equal(calls[0].config.timeout, 10000);
    assert.equal(result.date, '2024-02-29');
    assert.equal(result.total, 3);
    assert.equal(result.available, 2);
    assert.equal(result.occupied, 1);
    assert.equal(result.seats['2'].available, false);
  });

  await test('default seat query uses the Beijing date even while UTC is still yesterday', async () => {
    const taskClock = clock('2026-12-31T16:00:00Z');
    const calls = [];
    const seats = loadModule('utils/current-seats.js', ['getCurrentSeats'], {
      Date: taskClock.Date, ...dateHelpers(taskClock), createSeatPositions: () => ({}),
      getSeat: async params => { calls.push(params); return { data: { seatCom: [], seatVip: [] } }; }
    });
    const result = await seats.getCurrentSeats('store-a');
    assert.equal(calls[0].startTime, '2027-01-01 00:00:00');
    assert.equal(calls[0].endTime, '2027-01-02 00:00:00');
    assert.equal(result.date, '2027-01-01');
  });

  await test('invalid dates and missing room never reach the seat API', async () => {
    let calls = 0;
    const seats = loadModule('utils/current-seats.js', ['getCurrentSeats'], {
      ...dateHelpers(), createSeatPositions: () => ({}), getSeat: () => { calls++; }
    });
    for (const date of ['2026-02-29', '2026-10-25 09:00:00', '2026-13-01']) {
      await assert.rejects(seats.getCurrentSeats('store-a', date));
    }
    await assert.rejects(seats.getCurrentSeats('', TODAY));
    assert.equal(calls, 0);
  });

  await test('rapid date changes ignore both stale success and stale failure, including their finally blocks', async () => {
    const { state, requests } = statusFixture();
    const first = state.refresh();
    state.onDateChange({ detail: { value: '2026-10-26' } });
    state.onDateChange({ detail: { value: '2026-10-27' } });
    assert.deepEqual(requests.map(request => request.date), [TODAY, '2026-10-26', '2026-10-27']);
    requests[1].resolve(snapshot('2026-10-26'));
    await flush();
    assert.equal(state.snapshot, null);
    assert.equal(state.loading, true);
    requests[0].reject(new Error('late stale failure'));
    await first;
    assert.equal(state.snapshot, null);
    assert.equal(state.state, 'loading');
    assert.equal(state.loading, true);
    requests[2].resolve(snapshot('2026-10-27', 8));
    await flush();
    assert.equal(state.snapshot.date, '2026-10-27');
    assert.equal(state.snapshot.available, 8);
    assert.equal(state.loading, false);
    assert.equal(state.state, 'ready');
  });

  await test('same-day background refresh retains the map and suppresses duplicate pending requests', async () => {
    const { state, requests } = statusFixture();
    const previous = snapshot(TODAY, 6);
    state.snapshot = previous;
    const task = state.refresh();
    assert.equal(state.snapshot, previous);
    assert.equal(state.loading, true);
    await state.refresh();
    assert.equal(requests.length, 1);
    requests[0].resolve(snapshot(TODAY, 4));
    await task;
    assert.equal(state.snapshot.available, 4);
    assert.equal(state.loading, false);
  });

  await test('changing a day clears the old map immediately and rejects invalid or out-of-range selections', async () => {
    const { state, requests } = statusFixture();
    const previous = snapshot(TODAY);
    state.snapshot = previous;
    for (const date of ['2026-02-29', '2026-10-24', '2026-11-25', TODAY]) {
      state.onDateChange({ detail: { value: date } });
    }
    assert.equal(requests.length, 0);
    assert.equal(state.snapshot, previous);
    state.onDateChange({ detail: { value: '2026-10-26' } });
    assert.equal(state.snapshot, null);
    assert.equal(requests[0].date, '2026-10-26');
    requests[0].resolve(snapshot('2026-10-26'));
    await flush();
  });

  await test('logout invalidates an in-flight request instead of displaying protected seat data', async () => {
    const { state, requests, auth } = statusFixture();
    const task = state.refresh();
    auth.loggedIn = false;
    auth.token = '';
    await state.refresh();
    assert.equal(state.loading, false);
    assert.equal(state.state, 'guest');
    requests[0].resolve(snapshot(TODAY));
    await task;
    assert.equal(state.snapshot, null);
    assert.equal(state.state, 'guest');
  });

  await test('a response after page unload cannot restore the map or change its loading state', async () => {
    const { state, options, requests } = statusFixture();
    const task = state.refresh();
    options.onUnload.call(state);
    requests[0].resolve(snapshot(TODAY));
    await task;
    assert.equal(state.snapshot, null);
    assert.equal(state.loading, true);
  });

  await test('booking carries the viewed date into the real order page once and retains daily seat-selection routing', () => {
    const fixture = statusFixture();
    fixture.state.selectedDate = '2026-10-27';
    fixture.state.toBook();
    assert.equal(fixture.tabs[0].url, '/pages/order/order');
    const order = orderFixture(fixture.helpers, fixture.taskClock);
    order.options.onShow.call(order.state);
    assert.equal(order.state.selectDate, '2026-10-27');
    assert.match(order.state.dateLabel, /10月27日/);
    assert.equal(order.loads, 2);
    order.state.toSeat();
    const route = order.routes[0];
    assert.equal(route.url, '/other_pages/check-seat/check-seat');
    assert.equal(route.params.mode, 'daily');
    assert.equal(route.params.dateStr, '2026-10-27');
    const start = new Date(route.params.startTimestamp);
    const end = new Date(route.params.endTimestamp);
    assert.equal(start.getDate(), 27);
    assert.equal(start.getHours(), 0);
    assert.equal(end.getDate(), 28);
    assert.equal(end.getHours(), 0);
    order.state.onDateChange({ detail: { value: '2026-10-28' } });
    order.options.onShow.call(order.state);
    assert.equal(order.state.selectDate, '2026-10-28');
  });

  await test('the order page ignores a booking intent for another store', () => {
    const fixture = statusFixture();
    fixture.helpers.rememberReservationDate('store-a', '2026-10-27');
    const order = orderFixture(fixture.helpers, fixture.taskClock, 'store-b');
    order.options.onShow.call(order.state);
    assert.equal(order.state.selectDate, TODAY);
    assert.equal(fixture.helpers.takeReservationDate('store-a', TODAY, '2026-11-24'), '');
  });

  await test('returning to an existing order tab after Beijing midnight refreshes bounds and discards yesterday', () => {
    const taskClock = clock('2026-10-25T15:59:59Z');
    const helpers = dateHelpers(taskClock);
    const order = orderFixture(helpers, taskClock);
    assert.equal(order.state.minDate, TODAY);
    assert.equal(order.state.selectDate, TODAY);
    helpers.rememberReservationDate('store-a', TODAY);
    taskClock.set('2026-10-25T16:00:00Z');
    order.options.onShow.call(order.state);
    assert.equal(order.state.minDate, '2026-10-26');
    assert.equal(order.state.maxDate, '2026-11-25');
    assert.equal(order.state.selectDate, '2026-10-26');
    assert.match(order.state.dateLabel, /^今天 10月26日/);
    assert.equal(helpers.takeReservationDate('store-a', TODAY, '2026-11-24'), '');
  });

  await test('the seat page refreshes to the next Beijing day and ignores the previous day still loading', async () => {
    const { state, requests, taskClock } = statusFixture();
    const first = state.refresh();
    taskClock.set('2026-10-25T16:00:00Z');
    const second = state.refresh();
    assert.equal(state.selectedDate, '2026-10-26');
    assert.equal(requests[1].date, '2026-10-26');
    requests[0].resolve(snapshot(TODAY));
    await first;
    assert.equal(state.loading, true);
    assert.equal(state.snapshot, null);
    requests[1].resolve(snapshot('2026-10-26'));
    await second;
    assert.equal(state.snapshot.date, '2026-10-26');
    assert.equal(state.loading, false);
  });

  console.log('Date-only seat checks passed: ' + passed + '.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
