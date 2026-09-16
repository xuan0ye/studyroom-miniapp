/**
 * 卡券可用性统一口径(与后端 bookByDayCard 保持一致, 全端只此一份判断)
 *
 * 规则:
 * 1) 卡的有效期从「首次预约使用」起算: 买来放着不用不会过期, 所以 expiryTime 为空 = 待使用, 可用;
 * 2) 已使用(存在未取消的消费记录) => 不可再用;
 * 3) 已激活但有效期已过 => 不可用;
 * 4) 周期卡/长期卡锁座窗口已结束 => 本次可使用天数已用完, 不可用。
 */

// 统一解析后端返回的时间字符串(小程序 iOS 不支持 2026-09-16 16:00:00 直接 new Date)
export function cardDate(v) {
	if (!v) return null
	var d = new Date(String(v).replace(/-/g, '/'))
	return isNaN(d.getTime()) ? null : d
}

// 该卡当前是否可用
export function isCardUsable(c) {
	if (!c || !c.card) return false
	if (c.consumed) return false
	var now = new Date()
	var expiry = cardDate(c.expiryTime)
	if (expiry && expiry <= now) return false
	var lockEnd = cardDate(c.lockEndTime)
	// 锁座窗口已结束且锁座字段未清空 => 这张卡的可用天数已经用完
	if (c.lockSeatId && lockEnd && lockEnd <= now) return false
	return true
}

// 买来还没用过(未激活): 不过期, 首次预约使用才开始计算有效期
export function isCardUnused(c) {
	return !!(c && !c.expiryTime && !c.consumed)
}

// 剩余可用天数: 未激活的卡 = 卡面天数(首次使用后开始计算); 已激活的卡按到期日计算
export function cardRemainDays(c) {
	if (!c) return 0
	var term = parseInt(c.card && c.card.term) || 1
	if (!c.expiryTime) return term
	var expiry = cardDate(c.expiryTime)
	if (!expiry) return term
	return Math.max(0, Math.ceil((expiry.getTime() - new Date().getTime()) / 86400000))
}
