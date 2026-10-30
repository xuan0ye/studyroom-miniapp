const OFFSET = 8 * 3600000
const pad = n => String(n).padStart(2, '0')

export function beijingParts(now = new Date()) {
  const d = new Date(now.getTime() + OFFSET)
  return { day: d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()),
    time: pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) }
}

export function timedWindow(day, time, hours) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !/^\d{2}:\d{2}$/.test(time)) throw new Error('请选择开始时间')
  const start = new Date(day + 'T' + time + ':00+08:00')
  const count = Number(hours)
  if (!Number.isFinite(start.getTime()) || !Number.isInteger(count) || count < 1 || count > 24) throw new Error('预约时间不正确')
  if (beijingParts(start).day !== day || beijingParts(start).time !== time) throw new Error('预约日期不正确')
  const end = new Date(start.getTime() + count * 3600000)
  const finish = beijingParts(end)
  return { start, end, startTime: day + ' ' + time + ':00',
    endTime: finish.day + ' ' + finish.time + ':00',
    label: time + ' — ' + (finish.day === day ? '' : '次日 ') + finish.time }
}

export function timedBookingActive(item, now = new Date()) {
  if (!item || !item.bookingStartTime || !item.bookingEndTime || Number(item.status) === 2) return false
  const parse = value => new Date(String(value).replace(' ', 'T') + (/Z$|[+-]\d\d:\d\d$/.test(value) ? '' : '+08:00'))
  return parse(item.bookingStartTime) <= now && now < parse(item.bookingEndTime)
}
