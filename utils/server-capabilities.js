// Capabilities are learned from the existing login API, so old servers need no probing.
const KEY_CAPABILITIES = 'serverCapabilities'

export function recordLoginCapabilities(loginData) {
	if (!loginData || loginData.userId == null) {
		uni.removeStorageSync(KEY_CAPABILITIES)
		return
	}
	uni.setStorageSync(KEY_CAPABILITIES, {
		userId: String(loginData.userId),
		trialApiVersion: Number(loginData.trialApiVersion) || 0
	})
}

export function supportsTrialApi() {
	const capabilities = uni.getStorageSync(KEY_CAPABILITIES)
	return !!(capabilities && capabilities.userId === String(uni.getStorageSync('userId') || '')
		&& capabilities.trialApiVersion >= 1)
}
