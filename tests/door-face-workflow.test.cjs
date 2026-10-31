// Run with Node. Synthetic member/device APIs only; never sends a door command.
const assert = require('assert'), fs = require('fs'), path = require('path'), vm = require('vm')
const root = path.resolve(__dirname, '..')
const tick = async (until = () => true) => { for (let i = 0; i < 30; i++) { await Promise.resolve(); if (until()) return } }
function photoHelper(timers = {}) {
  const context = { Promise, Number, Error, setTimeout, clearTimeout, ...timers }
  vm.createContext(context)
  vm.runInContext(fs.readFileSync(path.join(root, 'utils/door-face-photo.js'), 'utf8').replace('export async function', 'async function') + '\nthis.prepare=prepareFacePhoto', context)
  return context.prepare
}
function photoApi(sizes = [120000]) {
  const calls = { qualities: [], reads: [], removed: [], canvas: [], exports: [] }, page = {}
  const manager = {
    getFileInfo: request => request.success({ size: sizes[Math.min(calls.qualities.length - 1, sizes.length - 1)] }),
    readFile: request => { calls.reads.push(request.filePath); request.success({ data: '/9j/valid-test-jpeg' }) },
    unlink: request => calls.removed.push(request.filePath)
  }
  const api = {
    getFileSystemManager: () => manager,
    getImageInfo: request => request.success({ width: 1600, height: 800, path: request.src }),
    createCanvasContext: () => ({
      clearRect: () => calls.canvas.push('clear'), setFillStyle: color => calls.canvas.push(color), fillRect: () => calls.canvas.push('fill'),
      drawImage: () => calls.canvas.push('image'), draw: (keep, complete) => { calls.canvas.push('draw'); complete() }
    }),
    canvasToTempFilePath: (request, owner) => {
      assert.strictEqual(owner, page); assert.strictEqual(request.width, 800); assert.strictEqual(request.height, 400); assert.strictEqual(request.fileType, 'jpg')
      calls.qualities.push(request.quality); calls.exports.push(request); request.success({ tempFilePath: 'canvas-' + calls.qualities.length + '.jpg' })
    }
  }
  return { api, calls, page, manager }
}
const source = fs.readFileSync(path.join(root, 'other_pages/access/face-enroll.vue'), 'utf8')
const script = source.match(/<script>([\s\S]*?)<\/script>/)[1].replace(/^\s*import .*$/gm, '').replace('export default', 'this.component=')
function pageInstance(overrides = {}) {
  const calls = { uploads: [], starts: 0, toasts: [], timers: [], removed: [] }
  const id = 'a'.repeat(32)
  const context = {
    Promise, Date, Error, FACE_CONSENT_KEY: 'test-consent',
    setTimeout: fn => { calls.timers.push(fn); return calls.timers.length }, clearTimeout: () => {},
    uni: { getStorageSync: () => '1', setStorageSync: () => {}, $u: { toast: text => calls.toasts.push(text) },
      chooseImage: request => request.success({ tempFilePaths: ['selected.jpg'] }) },
    ensurePrivacyAuth: async () => true, prepareFacePhoto: async () => '/9j/processed',
    accessProfile: async () => ({ data: null }), accessCameraCapabilities: async () => ({ data: { enabled: true } }),
    accessCameraCancel: async () => {}, accessCameraConfirm: async () => ({ data: { syncStatus: 1 } }),
    accessCameraStatus: async () => ({ data: { status: 'WAITING' } }),
    accessCameraStart: async () => { calls.starts++; return { data: { sessionId: id } } },
    accessFaceUpload: async body => { calls.uploads.push(body); return { data: { syncStatus: 1 } } },
    ...overrides
  }
  vm.createContext(context); vm.runInContext(script, context)
  const component = context.component, page = component.data()
  Object.entries(component.methods).forEach(([name, fn]) => { page[name] = fn.bind(page) })
  Object.entries(component.computed).forEach(([name, fn]) => Object.defineProperty(page, name, { get: fn.bind(page) }))
  page.profileLoading = false
  return { page, component, calls, id, context }
}
async function run() {
  let fixture = photoApi([250000, 120000])
  assert.strictEqual(await photoHelper()(fixture.api, fixture.page, 'original.png', () => true), '/9j/valid-test-jpeg')
  assert.deepStrictEqual(fixture.calls.qualities, [0.7, 0.5]); assert.deepStrictEqual(fixture.calls.reads, ['canvas-2.jpg'])
  assert.deepStrictEqual(fixture.calls.canvas, ['clear', '#ffffff', 'fill', 'image', 'draw'])
  assert.deepStrictEqual(fixture.calls.removed, ['canvas-1.jpg', 'canvas-2.jpg']); assert(!fixture.calls.reads.includes('original.png'))
  fixture = photoApi([300000]); await assert.rejects(photoHelper()(fixture.api, fixture.page, 'original.jpg', () => true), /照片仍然太大/)
  assert.strictEqual(fixture.calls.reads.length, 0); assert.strictEqual(fixture.calls.qualities.length, 3)
  fixture = photoApi(); fixture.api.canvasToTempFilePath = request => request.fail()
  await assert.rejects(photoHelper()(fixture.api, fixture.page, 'original.jpg', () => true), /照片处理失败/); assert.strictEqual(fixture.calls.reads.length, 0)
  fixture = photoApi(); let lateExport, timeout
  fixture.api.canvasToTempFilePath = request => { lateExport = request }
  const timed = photoHelper({ setTimeout: fn => { timeout = fn; return 1 }, clearTimeout: () => {} })(fixture.api, fixture.page, 'original.jpg', () => true)
  await tick(() => !!lateExport); timeout(); await assert.rejects(timed, /照片处理超时/)
  lateExport.success({ tempFilePath: 'canvas-late.jpg' }); assert.deepStrictEqual(fixture.calls.removed, ['canvas-late.jpg'])
  fixture = photoApi(); let imageInfo, active = true
  fixture.api.getImageInfo = request => { imageInfo = request }
  const cancelled = photoHelper()(fixture.api, fixture.page, 'original.jpg', () => active)
  active = false; imageInfo.success({ width: 800, height: 800 }); await assert.rejects(cancelled, /已取消/); assert.strictEqual(fixture.calls.exports.length, 0)

  let { page, component, calls } = pageInstance()
  assert(!component.onLoad, 'browsing status must not auto-open a consent or native camera dialog')
  page.faceConsented = false
  const first = page.ensureFaceConsent(), second = page.ensureFaceConsent(); assert.strictEqual(first, second)
  page.agreePrivacy(); assert(await first); assert(await second)
  page.faceConsented = false; const leaving = page.ensureFaceConsent(); component.onUnload.call(page); assert.strictEqual(await leaving, false)
  assert(!page.privacyShow)

  ;({ page } = pageInstance({ accessProfile: async () => { throw Error('network') } }))
  await page.loadProfile(); assert(page.profileLoadError); assert(!page.showEnrollmentForm); assert.strictEqual(page.operationMessage, '')
  ;({ page } = pageInstance()); await page.loadProfile(); assert.strictEqual(page.profileLoadError, ''); assert(page.showEnrollmentForm)

  let processPhoto
  ;({ page, calls } = pageInstance({ prepareFacePhoto: () => new Promise(resolve => { processPhoto = resolve }) }))
  const selecting = page.chooseImage(); await tick(() => !!processPhoto)
  assert(page.photoProcessing); assert(!page.canSubmitFace); await page.upload(); assert.strictEqual(calls.uploads.length, 0)
  await page.chooseImage(); processPhoto('/9j/new-selection'); await selecting
  assert.strictEqual(page.faceBase64, '/9j/new-selection'); assert(page.canSubmitFace)
  await page.upload(); assert.strictEqual(calls.uploads.length, 1); assert(page.hasUploadedFace)

  ;({ page, component } = pageInstance({ prepareFacePhoto: () => new Promise(resolve => { processPhoto = resolve }) }))
  const old = page.processSelectedPhoto('old.jpg', page.photoGeneration); component.onHide.call(page); processPhoto('/9j/old')
  await old; assert.strictEqual(page.faceUrl, ''); assert.strictEqual(page.faceBase64, '')

  let picker
  ;({ page, component } = pageInstance({ uni: { getStorageSync: () => '1', $u: { toast: () => {} }, chooseImage: request => { picker = request } } }))
  const pick = page.chooseImage(); await tick(() => !!picker); component.onHide.call(page)
  picker.success({ tempFilePaths: ['native-photo.jpg'] }); await pick; assert(page.pendingPhotoSelection); assert.strictEqual(page.faceBase64, '')
  component.onShow.call(page); await tick(() => !!page.faceBase64); assert.strictEqual(page.faceBase64, '/9j/processed')
  assert(!page.pendingPhotoSelection)

  let confirmReply
  ;({ page, calls } = pageInstance({ accessCameraConfirm: async () => { throw Error('response lost') },
    accessCameraStatus: async () => ({ data: { status: 'SUCCEEDED', profile: { syncStatus: 1 } } }) }))
  page.cameraSessionId = 'a'.repeat(32); page.cameraStatus = 'READY'; page.cameraStartedAt = Date.now()
  await page.confirmDoorCapture(); assert(page.hasUploadedFace); assert.strictEqual(page.cameraSessionId, ''); assert(!page.operationMessage.includes('失败'))
  ;({ page } = pageInstance({ accessCameraConfirm: async () => { throw Error('response lost') },
    accessCameraStatus: async () => ({ data: { status: 'SUCCEEDED' } }), accessProfile: async () => ({ data: { syncStatus: 1 } }) }))
  page.cameraSessionId = 'a'.repeat(32); page.cameraStatus = 'READY'; page.cameraStartedAt = Date.now()
  await page.confirmDoorCapture(); assert(page.hasUploadedFace, 'older server can recover through its current-profile API')
  ;({ page, calls } = pageInstance({ accessCameraConfirm: async () => { throw Error('response lost') }, accessCameraStatus: async () => ({ data: { status: 'REGISTERING' } }) }))
  page.cameraSessionId = 'a'.repeat(32); page.cameraStatus = 'READY'; page.cameraStartedAt = Date.now()
  await page.confirmDoorCapture(); assert.strictEqual(page.cameraStatus, 'REGISTERING'); assert(!page.canSubmitFace); assert(calls.timers.length)
  ;({ page, component, calls } = pageInstance({ accessCameraConfirm: () => new Promise(resolve => { confirmReply = resolve }) }))
  page.cameraSessionId = 'a'.repeat(32); page.cameraStatus = 'READY'
  const confirm = page.confirmDoorCapture(); component.onUnload.call(page); confirmReply({ data: { syncStatus: 1 } }); await confirm
  assert.strictEqual(page.profile, null); assert.strictEqual(calls.toasts.length, 0)
  console.log('PASS JPEG bounds, quality retry, white canvas, cleanup, timeout, late callbacks, consent, status retry, submit lock, native picker return, confirmation recovery and owner receipt')
}
run().catch(error => { console.error(error); process.exitCode = 1 })
