const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const root = path.resolve(__dirname, '..')
const cardCode = fs.readFileSync(path.join(root, 'utils/card-usable.js'), 'utf8').replace(/export\s+/g, '')
const cardContext = { module: { exports: {} } }
vm.runInNewContext(cardCode + '\nmodule.exports={isTrialCard,isCardUsable}', cardContext)
const cards = cardContext.module.exports
assert.equal(cards.isTrialCard({ card: { id: '2180000000000000501', bookingHours: 2 } }), true)
assert.equal(cards.isTrialCard({ card: { id: '2180000000000000401', bookingHours: 4 } }), false)
assert.equal(cards.isTrialCard({ card: { bookingHours: 2 } }), false)
assert.equal(cards.isCardUsable({ card: { bookingHours: 2 }, consumed: false }), true)
assert.equal(cards.isCardUsable({ card: { bookingHours: 2 }, consumed: true }), false)

async function main() {
  const storage = new Map([['token', 'test-token']])
  const modals = [], navigations = []
  let received = true
  const context = {
    module: { exports: {} },
    uni: {
      getStorageSync: key => storage.get(key), setStorageSync: (key, value) => storage.set(key, value),
      removeStorageSync: key => storage.delete(key), showModal: modal => modals.push(modal),
      navigateTo: target => navigations.push(target.url)
    },
    newUserTrialStatus: async () => ({ data: { received, cardUserId: received ? '9876' : null } }),
    accessProfile: async () => ({ data: { jobnumber: '9' } })
  }
  const guide = fs.readFileSync(path.join(root, 'utils/user-guide.js'), 'utf8')
    .replace(/^import .*$/gm, '').replace(/export\s+(?=(?:async\s+)?function)/g, '')
  vm.runInNewContext(guide + '\nmodule.exports={markNewUserFromLogin,runUserGuide}', context)
  context.module.exports.markNewUserFromLogin({ newUser: true })
  await context.module.exports.runUserGuide()
  assert.equal(modals.length, 1)
  assert.equal(modals[0].title, '两小时体验卡已到账')
  assert.match(modals[0].content, /首次开灯成功/)
  modals[0].success({ confirm: true })
  assert.equal(navigations[0], '/other_pages/timed-booking/timed-booking?trial=1')
  await context.module.exports.runUserGuide()
  assert.equal(modals.length, 1, 'Repeated entry must not repeatedly claim or announce the same gift')
  received = false
  context.module.exports.markNewUserFromLogin({ newUser: true })
  await context.module.exports.runUserGuide()
  assert.equal(modals[1].title, '欢迎新同学 🎉')
  assert.match(modals[1].content, /绑定手机号/)
  assert.doesNotMatch(modals[1].content, /已到账/)
  console.log('New-user trial: card identity, single use, verified grant notice, navigation and repeat entry passed.')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
