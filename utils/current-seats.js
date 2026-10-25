import { getSeat } from '@/config/api.js'
import { createSeatPositions } from '@/config/seat-layout.js'

// 接口按北京时间解析日期；海外设备也查询同一时刻。
export function seatQueryTime(date) {
  const local = new Date(date.getTime() + 8 * 60 * 60 * 1000)
  const pad = value => String(value).padStart(2, '0')
  return local.getUTCFullYear() + '-' + pad(local.getUTCMonth() + 1) + '-' + pad(local.getUTCDate()) +
    ' ' + pad(local.getUTCHours()) + ':' + pad(local.getUTCMinutes()) + ':' + pad(local.getUTCSeconds())
}

export function summarizeCurrentSeats(data, capturedAt) {
  if (!data || !Array.isArray(data.seatCom) || !Array.isArray(data.seatVip)) {
    throw new Error('座位情况暂不可用')
  }
  const positions = createSeatPositions()
  const seats = {}
  data.seatCom.concat(data.seatVip).forEach(seat => {
    if (!seat || seat.seatNum == null) return
    const number = String(seat.seatNum)
    if (!Object.prototype.hasOwnProperty.call(positions, number)) return
    const available = [true, 1, '1', 'true'].indexOf(seat.status) !== -1
    const occupied = [false, 0, '0', 'false'].indexOf(seat.status) !== -1
    if (!available && !occupied) throw new Error('座位状态暂不可用')
    // 重复记录不重复计数，同号记录以已预约为准。
    if (seats[number] && !seats[number].available) return
    seats[number] = { seatNum: number, available, x: positions[number].x, y: positions[number].y }
  })
  const list = Object.keys(seats).map(number => seats[number])
  const available = list.filter(seat => seat.available)
  return {
    seats,
    total: list.length,
    available: available.length,
    occupied: list.length - available.length,
    lightAvailable: available.filter(seat => Number(seat.seatNum) <= 12).length,
    quietAvailable: available.filter(seat => Number(seat.seatNum) > 12).length,
    capturedAt
  }
}

export async function getCurrentSeats(roomId) {
  if (!roomId) throw new Error('请先选择门店')
  const now = new Date()
  now.setMilliseconds(0)
  // 一秒查询窗口表示此刻，不把当天稍晚的预约也算成现在占座。
  const result = await getSeat({
    roomId,
    startTime: seatQueryTime(now),
    endTime: seatQueryTime(new Date(now.getTime() + 1000))
  }, { custom: { auth: true, catch: true, toast: false } })
  return summarizeCurrentSeats(result && result.data, now.getTime())
}
