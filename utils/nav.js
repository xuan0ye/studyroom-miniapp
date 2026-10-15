/**
 * 统一的安全返回（2026-10-15）
 *
 * 背景 / 为什么需要它：
 *   uView 的 u-navbar 在 autoBack=true 时内部只做一件事 —— uni.navigateBack()（无任何兜底）。
 *   而小程序在「页面栈只有 1 层」时该调用会静默失败，用户看到的现象就是：
 *   「点左上角的返回箭头没有任何反应，卡在页面里出不去」。
 *
 * 什么情况下页面栈只有 1 层（真实会遇到的场景）：
 *   1) 别人分享的卡片 / 小程序码 / 扫码直接打开某个内页；
 *   2) 从服务通知、客服消息点进内页；
 *   3) 微信开发者工具「自定义编译模式」指定了启动页面；
 *   4) 任何 reLaunch 之后的落地页。
 * 本项目 pages.json 的 globalStyle.navigationStyle = "custom"，所有页面都没有微信原生导航栏，
 * 返回完全依赖自绘的 my-navbar，所以一旦失败就是彻底出不去。
 *
 * 用法：goBack() / goBack('/pages/xxx/xxx')
 */

// 兜底落地页（必须是 tabBar 页，switchTab 只能跳 tabBar 页）
const TAB_INDEX = '/pages/index/index'
const TAB_MINE = '/pages/mine/mine'

function currentRoute() {
	try {
		const pages = (typeof getCurrentPages === 'function') ? getCurrentPages() : []
		if (!pages || !pages.length) return ''
		const page = pages[pages.length - 1]
		if (!page) return ''
		return page.route || (page.$page && page.$page.fullPath) || ''
	} catch (e) {
		return ''
	}
}

/**
 * 页面栈只有 1 层时的兜底站：我的子包（other_pages_mine/*）回「我的」，其余回「首页」
 */
function fallbackTabUrl() {
	return currentRoute().indexOf('other_pages_mine/') === 0 ? TAB_MINE : TAB_INDEX
}

/**
 * 安全返回：能返回就返回，返回不了就回 tabBar 页，保证任何页面都出得去。
 * @param {String} fallbackUrl 可选，自定义兜底页（必须是 tabBar 页）
 */
export function goBack(fallbackUrl) {
	const target = fallbackUrl || fallbackTabUrl()
	const pages = (typeof getCurrentPages === 'function') ? getCurrentPages() : []
	if (pages && pages.length > 1) {
		uni.navigateBack({
			delta: 1,
			// 极端情况下栈里只有 1 层但 getCurrentPages 长度对不上，navigateBack 仍会失败
			fail: () => {
				uni.switchTab({ url: target })
			}
		})
		return
	}
	uni.switchTab({ url: target })
}

export default { goBack }