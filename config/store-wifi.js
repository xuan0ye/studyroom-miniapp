// Set VUE_APP_STORE_WIFI_PASSWORD in .env.local for the store's mini-program build.
export const storeWifi = {
	ssid: '答岸',
	password: process.env.VUE_APP_STORE_WIFI_PASSWORD || ''
}
