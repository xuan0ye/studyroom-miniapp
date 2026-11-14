import { cardDate, isCardUsable, isTimedCard } from './card-usable.js'

export function hasValidStoreWifiCard(cards) {
	return Array.isArray(cards) && cards.some(card => {
		if (isCardUsable(card)) return true
		// An hourly card stops being bookable as soon as it is booked, but still covers its session.
		const end = isTimedCard(card) ? cardDate(card.expiryTime) : null
		return !!end && end > new Date()
	})
}

function callWifi(api, method, options = {}) {
	return new Promise((resolve, reject) => {
		api[method]({ ...options, success: resolve, fail: reject })
	})
}

async function isConnected(api, ssid) {
	if (typeof api.getConnectedWifi !== 'function') return false
	try {
		const result = await callWifi(api, 'getConnectedWifi')
		return result && result.wifi && result.wifi.SSID === ssid
	} catch (error) {
		return false
	}
}

export async function connectStoreWifi(api, platform, network) {
	if (!api || typeof api.startWifi !== 'function' || typeof api.connectWifi !== 'function') return 'manual'
	if (platform !== 'android' && platform !== 'ios') return 'manual'

	await callWifi(api, 'startWifi')
	const options = { SSID: network.ssid, password: network.password }
	if (platform === 'android') {
		// WeChat spells this option "maunal". The system settings allow other apps to use the connection.
		await callWifi(api, 'connectWifi', { ...options, maunal: true })
		return 'settings'
	}
	if (await isConnected(api, network.ssid)) return 'connected'

	let confirmConnection
	const confirmed = new Promise(resolve => { confirmConnection = resolve })
	const listener = result => {
		if (result && result.wifi && result.wifi.SSID === network.ssid) confirmConnection('connected')
	}
	const canListen = typeof api.onWifiConnected === 'function' && typeof api.offWifiConnected === 'function'
	let timer
	try {
		if (canListen) api.onWifiConnected(listener)
		const timeout = new Promise(resolve => {
			timer = setTimeout(() => resolve('unconfirmed'), 20000)
		})
		// On iOS the call can succeed even when the phone shows a password error.
		const requested = callWifi(api, 'connectWifi', options).then(async () => {
			if (await isConnected(api, network.ssid)) return 'connected'
			return confirmed
		})
		return await Promise.race([confirmed, requested, timeout])
	} finally {
		clearTimeout(timer)
		if (canListen) api.offWifiConnected(listener)
	}
}
