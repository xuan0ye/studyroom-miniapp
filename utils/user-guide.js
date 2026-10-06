/**
 * 新人引导 & 人脸录入提醒(全端统一口径)
 *
 * 为什么单独放一个文件:
 * 1) 新用户登录后要知道两件事:
 *    ① 新人体验卡 —— 不再自动发卡, 由客服手动发放, 需要引导用户加客服微信
 *    ② 刷脸进门 —— 先录人脸再到店, 否则门口闸机刷不开("进不去门"是顾客最难受的故障)
 * 2) "没录人脸"不能只提示一次: 未录入期间每天提醒一次, 录上后自动不再提醒。
 * 3) 新用户标记由后端登录接口返回(login 响应 newUser=true),
 *    但小程序里还有"静默重登"(config/request.js 里 token 过期/缺失时自动登录)也会建号,
 *    那条路径拿不到响应, 所以它在本地挂一个 pendingNewUserGuide 标记, 由本文件消费。
 */

import { accessProfile } from '@/config/api.js'

const FACE_PAGE = '/other_pages/access/face-enroll'
const FEEDBACK_PAGE = '/other_pages/feedback/feedback'

// 与 config/request.js 里的字面量保持一致(那边不 import 本文件, 避免 api.js 循环依赖)
const KEY_PENDING_NEW_USER = 'pendingNewUserGuide'
const KEY_FACE_TIP_DATE = 'faceTipDate'
const KEY_NEW_USER_DONE = 'newUserGuideDone'

function todayKey() {
	var d = new Date()
	return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate()
}

function go(url) {
	uni.navigateTo({ url: url })
}

/**
 * 登录响应里带 newUser=true 时调用: 只挂标记, 真正弹窗交给 runUserGuide()
 * (登录流程里紧接着弹窗会和"授权手机号"等系统弹窗打架, 统一延后到流程结束)
 */
export function markNewUserFromLogin(loginData) {
	if (loginData && loginData.newUser) {
		uni.setStorageSync(KEY_PENDING_NEW_USER, 1)
	}
}

/** 新用户「新人必读」: 只弹一次 */
export function showNewUserGuide() {
	if (uni.getStorageSync(KEY_NEW_USER_DONE)) return
	uni.setStorageSync(KEY_NEW_USER_DONE, 1)
	uni.showModal({
		title: '欢迎新同学 🎉',
		content: '① 新人体验卡：加客服微信免费领一张\n'
			+ '② 刷脸进门：请先录人脸再到店，门口刷脸进\n\n'
			+ '建议顺序：先录人脸 → 到店直接刷脸进。',
		confirmText: '去录人脸',
		cancelText: '看客服微信',
		success(res) {
			if (res.confirm) {
				go(FACE_PAGE)
			} else if (res.cancel) {
				go(FEEDBACK_PAGE)
			}
		}
	})
}

/** 查是否已录人脸: 后端 profile 里 facePhotoUrl/jobnumber 有值即为已录; 查询失败按"已录"处理, 不打扰用户 */
function fetchFaceEnrolled() {
	return accessProfile({}, { custom: { auth: true, catch: true } }).then(function (res) {
		var p = res && res.data
		return !!(p && (p.facePhotoUrl || p.jobnumber))
	}).catch(function () {
		return true
	})
}

/** 未录人脸提醒: 每次进首页/登录后调用; 同一天只提醒一次, 录上后自动停止 */
export function checkFaceEnrollTip() {
	if (!uni.getStorageSync('token')) return
	if (uni.getStorageSync(KEY_FACE_TIP_DATE) === todayKey()) return
	fetchFaceEnrolled().then(function (hasFace) {
		if (hasFace) return
		uni.setStorageSync(KEY_FACE_TIP_DATE, todayKey())
		uni.showModal({
			title: '还没录人脸 🙋',
			content: '到店门口要刷脸才能进，建议现在先录好人脸，免得来了进不去。',
			confirmText: '去录人脸',
			cancelText: '稍后再说',
			success(res) {
				if (res.confirm) {
					go(FACE_PAGE)
				}
			}
		})
	})
}

/**
 * 统一入口: 登录流程结束、以及首页/我的页 onShow 都可以调。
 * 有挂起的"新用户引导"就弹新人必读, 否则检查人脸提醒。
 */
export function runUserGuide() {
	if (uni.getStorageSync(KEY_PENDING_NEW_USER)) {
		uni.removeStorageSync(KEY_PENDING_NEW_USER)
		showNewUserGuide()
		return
	}
	checkFaceEnrollTip()
}