/**
 * 卡券可用性统一口径(与后端 bookByDayCard 保持一致, 全端只此一份判断)
 *
 * 三种卡型:
 * 1) 固定区间卡(如中秋国庆畅享券): validStart~validEnd 是硬性使用区间,
 *    区间内每天单独预约(不连锁锁座), 区间外一律不可用, 区间结束即失效;
 * 2) 按天卡(日卡/周卡/月卡等): 有效期从「首次真正使用」起算, 买来放着不用不会过期;
 *    订了又取消、从没签到 => 不算用过;
 * 3) 用过的卡: 有效期已过 或 锁座窗口已结束 => 可用天数已用完。
 */

// 统一解析后端时间字符串(小程序 iOS 不支持 2026-09-16 16:00:00 直接 new Date)
export function cardDate(v) {
	if (!v) return null
	var d = new Date(String(v).replace(/-/g, '/'))
	return isNaN(d.getTime()) ? null : d
}

// 固定区间卡的使用区间: { start, end }; end 为截止日次日 00:00(即截止日当天仍可用)。非固定区间卡返回 null
export function cardWindow(c) {
	var card = c && c.card
	if (!card || !card.validEnd) return null
	var e = cardDate(card.validEnd)
	if (!e) return null
	var s = cardDate(card.validStart)
	return {
		start: s ? new Date(s.getFullYear(), s.getMonth(), s.getDate()) : null,
		end: new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1)
	}
}

// 区间文字, 如 "9月25日-10月7日"
export function cardWindowText(c) {
	var w = cardWindow(c)
	if (!w) return ''
	var e = new Date(w.end.getTime() - 86400000)
	var f = function(d) { return (d.getMonth() + 1) + '月' + d.getDate() + '日' }
	return (w.start ? f(w.start) + '-' : '') + f(e)
}

// 该卡当前是否可用(可用于预约)
export function isCardUsable(c) {
	if (!c || !c.card) return false
	var now = new Date()
	var win = cardWindow(c)
	if (win) {
		// 固定区间卡: 只在区间内可约(区间内每天单独预约, 不连锁锁座)
		if (win.start && now < win.start) return false
		return now < win.end
	}
	// 非固定区间卡: 从未真正用过 => 不过期(买来放着不用、预约被取消都不算用掉)
	if (!c.consumed) return true
	var expiry = cardDate(c.expiryTime)
	if (expiry && expiry <= now) return false
	var lockEnd = cardDate(c.lockEndTime)
	if (c.lockSeatId && lockEnd && lockEnd <= now) return false
	return true
}

// 是否应在卡包里展示(固定区间卡在开始日前也展示, 提示"xx起可用")
export function isCardVisible(c) {
	if (isCardUsable(c)) return true
	var win = cardWindow(c)
	if (!win || !win.start) return false
	return new Date() < win.start
}

// 是否"待使用"(从未真正用过): 首次预约使用后才开始计算有效期
export function isCardUnused(c) {
	if (!c || !c.card || c.consumed) return false
	// 锁座窗口仍在进行中的卡属于"使用中", 不算待使用
	var lockEnd = cardDate(c.lockEndTime)
	if (c.lockSeatId && lockEnd && lockEnd > new Date()) return false
	return true
}

// 剩余可用天数: 固定区间卡=区间剩余天数; 未真正用过的按天卡=卡面天数; 用过的按到期日
export function cardRemainDays(c) {
	if (!c) return 0
	var now = new Date()
	var win = cardWindow(c)
	if (win) {
		var from = win.start && win.start > now ? win.start : now
		return Math.max(0, Math.ceil((win.end.getTime() - from.getTime()) / 86400000))
	}
	var term = parseInt(c.card && c.card.term) || 1
	if (!c.consumed) return term
	var expiry = cardDate(c.expiryTime)
	if (!expiry) return term
	return Math.max(0, Math.ceil((expiry.getTime() - now.getTime()) / 86400000))
}

// 一次预约需要锁定的天数(固定区间卡每天单独预约, 只锁当天)
export function cardLockDays(c) {
	if (cardWindow(c)) return 1
	var d = cardRemainDays(c)
	return d >= 7 ? d : 1
}
