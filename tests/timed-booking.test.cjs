const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const root = path.resolve(__dirname, '..')
function load(file, names) {
  const source = fs.readFileSync(path.join(root, file), 'utf8').replace(/export\s+(?=function|const)/g, '')
  const context = { module: { exports: {} } }
  vm.runInNewContext(source + '\nmodule.exports={' + names.join(',') + '}', context)
  return context.module.exports
}
const timed = load('utils/timed-booking.js', ['beijingParts', 'timedWindow', 'timedBookingActive'])
const cards = load('utils/card-usable.js', ['isCardUsable', 'isCardVisible', 'isTimedCard'])
const window = timed.timedWindow('2026-10-28', '21:30', 4)
assert.equal(window.startTime, '2026-10-28 21:30:00')
assert.equal(window.endTime, '2026-10-29 01:30:00')
assert.equal(window.end - window.start, 14400000)
assert.equal(window.label, '21:30 — 次日 01:30')
assert.equal(timed.beijingParts(new Date('2026-10-28T16:00:00Z')).day, '2026-10-29')
const booking = { status: 1, bookingStartTime: window.startTime, bookingEndTime: window.endTime }
assert.equal(timed.timedBookingActive(booking, new Date('2026-10-28T13:29:59Z')), false)
assert.equal(timed.timedBookingActive(booking, new Date('2026-10-28T13:30:00Z')), true)
assert.equal(timed.timedBookingActive(booking, new Date('2026-10-28T16:30:00Z')), true)
assert.equal(timed.timedBookingActive(booking, new Date('2026-10-28T17:30:00Z')), false)
assert.equal(timed.timedBookingActive({ ...booking, status: 2 }, window.start), false)
const card = { card: { bookingHours: 4, term: 1 }, consumed: false }
assert.equal(cards.isCardUsable(card), true)
assert.equal(cards.isCardUsable({ ...card, consumed: true, expiryTime: '2099-01-01 00:00:00' }), false)
assert.equal(cards.isCardVisible({ ...card, consumed: true, expiryTime: '2099-01-01 00:00:00' }), true)
assert.equal(cards.isCardVisible({ ...card, consumed: true, expiryTime: '2020-01-01 00:00:00' }), false)
assert.throws(() => timed.timedWindow('2026-02-30', '21:00', 4))
assert.throws(() => timed.timedWindow('2026-10-28', '21:00', 0))
console.log('Timed booking: cross-midnight, Beijing timezone, gate boundaries and single-use cards passed.')
