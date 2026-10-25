// 预约按北京时间的自然日计算，避免设备时区改变日期边界。
const DAY = 24 * 60 * 60 * 1000
const BEIJING_OFFSET = 8 * 60 * 60 * 1000
let pendingReservationDate = null

export function reservationDate(now = new Date()) {
  return new Date(now.getTime() + BEIJING_OFFSET).toISOString().slice(0, 10)
}

export function reservationDay(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('请选择有效日期')
  const parts = date.split('-').map(Number)
  const calendarDay = Date.UTC(parts[0], parts[1] - 1, parts[2])
  if (new Date(calendarDay).toISOString().slice(0, 10) !== date) throw new Error('请选择有效日期')
  return {
    date,
    startTime: date + ' 00:00:00',
    endTime: new Date(calendarDay + DAY).toISOString().slice(0, 10) + ' 00:00:00'
  }
}

export function rememberReservationDate(roomId, date) {
  reservationDay(date)
  pendingReservationDate = { roomId: String(roomId), date }
}

// switchTab 不携带查询参数；一次性传给原有预约页，继续使用原有价格和卡券流程。
export function takeReservationDate(roomId, minDate, maxDate) {
  const pending = pendingReservationDate
  pendingReservationDate = null
  if (!pending || pending.roomId !== String(roomId)) return ''
  return pending.date >= minDate && pending.date <= maxDate ? pending.date : ''
}
