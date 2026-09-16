/**
 * 卡券可用性统一口径(与后端 bookByDayCard 保持一致, 全端只此一份判断)
 *
 * 核心规则: 卡的有效期从「首次真正使用」起算, 买来放着不用不会过期。
 *  - 没有未取消的消费记录(没预约过 / 预约全被取消 / 从没签到) => 这张卡还没真正用过, 永远可用, 下次预约重新起算;
 *  - 用过的卡: 有效期已过 或 锁座窗口已结束 => 可用天数已用完;
 *  - 使用中(锁座窗口内/已预约今天) => 可用, 页面上显示"已锁座"。
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
	// 从未真正用过: 不过期(买来放着不用、预约被取消都不算用掉)
	if (!c.consumed) return true
	var now = new Date()
	// 用过的卡: 有效期已过 => 可用天数已用完
	var expiry = cardDate(c.expiryTime)
	if (expiry && expiry <= now) return false
	// 用过的周期卡/长期卡: 锁座窗口已结束且未续 => 可用天数已用完
	var lockEnd = cardDate(c.lockEndTime)
	if (c.lockSeatId && lockEnd && lockEnd <= now) return false
	return true
}

// 是否"待使用"(从未真正用过): 首次预约使用后才开始计算有效期
export function isCardUnused(c) {
	if (!c || !c.card || c.consumed) return false
	// 锁座窗口仍在进行中的卡属于"使用中", 不算待使用
	var lockEnd = cardDate(c.lockEndTime)
	if (c.lockSeatId && lockEnd && lockEnd > new Date()) return false
	return true
}

// 剩余可用天数: 未真正用过的卡 = 卡面天数(首次使用后开始计算); 用过的卡按到期日计算
export function cardRemainDays(c) {
	if (!c) return 0
	var term = parseInt(c.card && c.card.term) || 1
	if (!c.consumed) return term
	var expiry = cardDate(c.expiryTime)
	if (!expiry) return term
	return Math.max(0, Math.ceil((expiry.getTime() - new Date().getTime()) / 86400000))
}
