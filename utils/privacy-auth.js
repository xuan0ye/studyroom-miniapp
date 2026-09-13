/**
 * 微信小程序《用户隐私保护指引》授权封装（仅微信小程序端生效）
 *
 * 背景：微信要求小程序在调用「摄像头 / 相册 / 选中的照片或视频 / 保存到相册」
 * 等隐私接口之前，用户必须先同意小程序在微信后台配置的《用户隐私保护指引》。
 * 相关接口（基础库 >= 2.32.3）：
 *   wx.getPrivacySetting        查询用户当前是否已同意指引
 *   wx.requirePrivacyAuthorize  主动拉起隐私授权流程（未同意时触发）
 *
 * 说明：本工程不注册 wx.onNeedPrivacyAuthorization 自定义弹窗，
 * 未同意时会由微信展示「官方默认隐私弹窗」兜底，文案与微信后台填写的指引一致。
 * 若未来需要自定义弹窗样式，请参考《隐私保护指引填写文档.md》附录实现。
 *
 * 用法：
 *   import { ensurePrivacyAuth } from '@/utils/privacy-auth.js'
 *   const ok = await ensurePrivacyAuth()
 *   if (!ok) { toast('需要同意隐私保护指引后才能使用该功能') ; return }
 *
 * 返回值：
 *   true  - 已同意 / 无需同意 / 基础库过旧 / 查询失败（不阻塞业务）
 *   false - 用户拒绝了隐私授权
 */
export function ensurePrivacyAuth() {
	return new Promise(function(resolve) {
		try {
			var wxObj = (typeof wx !== 'undefined') ? wx : null
			// 基础库过旧(< 2.32.3)或非微信平台：不做拦截，直接放行
			if (!wxObj || !wxObj.getPrivacySetting || !wxObj.requirePrivacyAuthorize) {
				return resolve(true)
			}
			wxObj.getPrivacySetting({
				success: function(res) {
					if (res && res.needAuthorization) {
						// 用户尚未同意 → 拉起隐私授权（官方默认弹窗）
						wxObj.requirePrivacyAuthorize({
							success: function() {
								resolve(true)
							},
							fail: function() {
								resolve(false)
							}
						})
					} else {
						resolve(true)
					}
				},
				fail: function() {
					// 查询失败（例如微信后台指引尚未配置完成）：不阻塞业务
					resolve(true)
				}
			})
		} catch (e) {
			resolve(true)
		}
	})
}
