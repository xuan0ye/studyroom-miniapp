/**
 * 座位灯光/设备接口返回的统一判定
 *
 * 后端 /api/wx/device/seat/on|off 返回结构（R.ok(Map)）：
 *   { "success": true,  "灯1": true, "灯2": false }   // 每个设备名 -> 是否下发成功
 *   { "success": false, "msg": "该座位未绑定开关设备" }
 *
 * 历史问题：
 *   1) 后端 msg 是英文（"No IoT device bound"），前端直接 toast 会显示英文；
 *   2) 老版本后端无论设备是否真的下发成功都返回 success=true，会误报"灯已开启"。
 *
 * 这里同时兜住两种情况：设备级任一失败 / success=false 都判为失败；
 * msg 非中文时用中文兜底文案，避免用户看到英文。
 *
 * 用法：
 *   import { judgeDeviceResult } from '@/utils/device-result.js'
 *   const r = judgeDeviceResult(res, '座位灯已开启')
 *   uni.$u.toast(r.msg)
 *   if (r.ok) { ... }
 *
 * @param {Object} res  uni.$u.http 返回的整个响应体 {code,msg,data}
 * @param {String} okText 成功时提示的文案
 * @returns {{ok: Boolean, msg: String}}
 */
export function judgeDeviceResult(res, okText) {
	const inner = res && res.data ? res.data : res
	if (!inner || typeof inner !== 'object') {
		// 结构异常（例如后端直接返回字符串）时按成功处理，不误报失败
		return { ok: true, msg: okText }
	}
	var devKeys = []
	for (var k in inner) {
		if (k !== 'success' && k !== 'msg') devKeys.push(k)
	}
	var failed = devKeys.some(function(k) {
		return inner[k] === false
	})
	var raw = inner.msg ? String(inner.msg) : ''
	var isChinese = /[\u4e00-\u9fa5]/.test(raw)
	if (inner.success === false || failed) {
		return { ok: false, msg: isChinese ? raw : '设备指令下发失败，请稍后重试或联系店主' }
	}
	if (devKeys.length === 0) {
		// 没有返回任何设备结果 = 该座位没有开启自动控制的设备，不能算成功
		return { ok: false, msg: isChinese ? raw : '该座位未开启自动控制，请联系店主' }
	}
	return { ok: true, msg: okText }
}
