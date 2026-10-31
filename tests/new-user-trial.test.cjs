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

function harness() {
  const storage = new Map([['token', 'test-token'], ['userId', '9']])
  const modals = [], navigations = []
  let received = true
  let statusCalls = 0
  const context = {
    module: { exports: {} },
    uni: {
      getStorageSync: key => storage.get(key), setStorageSync: (key, value) => storage.set(key, value),
      removeStorageSync: key => storage.delete(key), showModal: modal => modals.push(modal),
      navigateTo: target => navigations.push(target.url)
    },
    newUserTrialStatus: async () => { statusCalls++; return { data: { received, cardUserId: received ? '9876' : null } } },
    accessProfile: async () => ({ data: { jobnumber: '9' } })
  }
  const capabilities = fs.readFileSync(path.join(root, 'utils/server-capabilities.js'), 'utf8').replace(/export\s+/g, '')
  vm.runInNewContext(capabilities, context)
  const guide = fs.readFileSync(path.join(root, 'utils/user-guide.js'), 'utf8')
    .replace(/^import .*$/gm, '').replace(/export\s+(?=(?:async\s+)?function)/g, '')
  vm.runInNewContext(guide + '\nmodule.exports={markNewUserFromLogin,runUserGuide}', context)
  return { storage, modals, navigations, context, setReceived: value => { received = value }, statusCalls: () => statusCalls }
}

async function main() {
  const current = harness()
  const { storage, modals, navigations, context } = current
  context.recordLoginCapabilities({ userId: '9', trialApiVersion: 1 })
  context.module.exports.markNewUserFromLogin({ newUser: true })
  await context.module.exports.runUserGuide()
  assert.equal(modals.length, 1)
  assert.equal(modals[0].title, '两小时体验卡已到账')
  assert.match(modals[0].content, /首次开灯成功/)
  modals[0].success({ confirm: true })
  assert.equal(navigations[0], '/other_pages/timed-booking/timed-booking?trial=1')
  await context.module.exports.runUserGuide()
  assert.equal(modals.length, 1, 'Repeated entry must not repeatedly claim or announce the same gift')
  current.setReceived(false)
  context.module.exports.markNewUserFromLogin({ newUser: true })
  await context.module.exports.runUserGuide()
  assert.equal(modals[1].title, '欢迎新同学 🎉')
  assert.match(modals[1].content, /绑定手机号/)
  assert.doesNotMatch(modals[1].content, /已到账/)

  const legacy = harness()
  legacy.context.module.exports.markNewUserFromLogin({ newUser: true })
  await legacy.context.module.exports.runUserGuide()
  await legacy.context.module.exports.runUserGuide()
  assert.equal(legacy.statusCalls(), 0, 'An old or unconfirmed server must never receive the new trial request')
  assert.match(legacy.modals[0].content, /联系客服/)
  assert.doesNotMatch(legacy.modals[0].content, /自动领|已到账/)
  legacy.modals[0].success({ confirm: true })
  assert.equal(legacy.navigations[0], '/other_pages/feedback/feedback')

  storage.set('userId', '10')
  assert.equal(context.supportsTrialApi(), false, 'A capability cached for another account must not carry over')
  storage.set('userId', '9')
  context.recordLoginCapabilities({ userId: '9' })
  assert.equal(context.supportsTrialApi(), false, 'An old-server login must clear a previously advertised capability')

  // Exercise the real response interceptor, shared by manual and silent login.
  let onSuccess
  context.uni.$u = { http: {
    setConfig: configure => configure({}),
    interceptors: { request: { use() {} }, response: { use: success => { onSuccess = success } } }
  } }
  const requestContext = {
    module: { exports: {} }, uni: context.uni,
    require: name => name === './config.js' ? { prodHost: 'https://example.invalid' }
      : { recordLoginCapabilities: context.recordLoginCapabilities }
  }
  vm.runInNewContext(fs.readFileSync(path.join(root, 'config/request.js'), 'utf8'), requestContext)
  requestContext.module.exports({})
  const loginResponse = trialApiVersion => ({
    data: { code: 200, data: { token: 'test-token', userId: '9', trialApiVersion } },
    config: { url: '/api/wx/login', custom: {} }
  })
  onSuccess(loginResponse(1))
  assert.equal(context.supportsTrialApi(), true)
  onSuccess(loginResponse(undefined))
  assert.equal(context.supportsTrialApi(), false)
  console.log('New-user trial: grant flow, repeat entry, old-server compatibility, account isolation and login capability capture passed.')
}
main().catch(error => { console.error(error); process.exitCode = 1 })
