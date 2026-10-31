export const FACE_CONSENT_KEY = 'face_enroll_consent_v3'

export function cameraPreviewPath(root, sessionId) {
  if (!root || !/^[a-f0-9]{32}$/.test(sessionId || '')) throw new Error('无效录脸会话')
  return String(root).replace(/\/$/, '') + '/door-camera-' + sessionId + '.jpg'
}

export function isCameraPreviewFile(root, file) {
  const prefix = String(root || '').replace(/\/$/, '') + '/'
  return !!root && String(file || '').startsWith(prefix) && /^door-camera-[a-f0-9]{32}\.jpg$/.test(String(file).slice(prefix.length))
}
