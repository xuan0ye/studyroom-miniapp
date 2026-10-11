/**
 * 登录态判断的唯一来源：token。
 *
 * 背景（2026-10-09 修）：
 * 小程序有"静默重新登录"（config/request.js：token 失效时用 wx.login 自动换新 token），
 * 而 isLogin 这个缓存标记只有部分路径会写（手动登录 / 静默登录成功 / 授权登录）。
 * 两者一旦不同步，就会出现很不讲理的现象：
 *   **明明已经登录（token 有效、接口都能通），进预约页却被拦"请先登录"，退掉再登一次才好。**
 *
 * 所以凡是"要不要拦住用户"的判断，一律看 token；isLogin 只当展示用的辅助标记。
 */

/** 是否已登录（token 存在即视为已登录；真实有效性交给接口与 401 静默重登去判） */
export function isLoggedIn() {
	try {
		var t = uni.getStorageSync('token')
		return !!(t && String(t).trim() !== '')
	} catch (e) {
		return false
	}
}

/**
 * 清理登录态 —— 与 config/request.js 里"重登失败"的清理保持一致。
 * 注意：不要用 uni.clearStorageSync() 一锅端，那会连店铺选择、人脸提醒等无关缓存一起清掉。
 */
export function clearAuth() {
	try {
		uni.removeStorageSync('token')
		uni.removeStorageSync('isLogin')
		uni.removeStorageSync('userInfo')
		uni.removeStorageSync('status')
		uni.removeStorageSync('balance')
		uni.removeStorageSync('card')
	} catch (e) {}
}