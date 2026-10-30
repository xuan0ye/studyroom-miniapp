<template>
  <view class="afterwork">
    <my-navbar :leftText="trialMode ? '新人两小时体验' : '下班充电卡'" leftIcon="arrow-left" :custom="false" :autoBack="true" />
    <view class="content">
      <view class="intro">
        <text class="eyebrow">{{ trialMode ? '欢迎来到答岸自习室' : '留一点时间，给自己' }}</text>
        <text class="title">{{ trialMode ? '先体验两小时的专注' : '下班后，安静学一会儿' }}</text>
        <text class="subtitle">{{ trialMode ? '免费体验 · 开灯成功起算 · 连续120分钟' : '18:00后开始 · 连续4小时 · 可跨零点' }}</text>
      </view>
      <view v-if="loading" class="panel hint">正在读取卡券…</view>
      <view v-else-if="!cards.length" class="panel">
        <text class="section-title">{{ trialMode ? '暂无待使用的体验卡' : '准备好你的下班充电卡' }}</text>
        <text class="hint">{{ trialMode ? '新用户绑定手机号后自动领取，每个手机号限一次。已预约的体验请到「我的预约」查看。' : '买卡或兑换抖音团购券后，在这里选择开始时间和座位。' }}</text>
        <u-button v-if="trialMode" color="#b96a39" text="查看我的预约" @click="bookings" />
        <u-button v-else color="#b96a39" text="购买下班充电卡" @click="buy" />
        <view v-if="!trialMode" class="secondary"><u-button plain text="兑换抖音团购券" @click="redeem" /></view>
      </view>
      <view v-else>
        <view class="panel">
          <text class="section-title">使用哪张卡</text>
          <picker :range="cards" range-key="title" :value="cardIndex" @change="changeCard">
            <view class="pick-row"><text>{{ selected.title }}</text><text class="arrow">更换 ›</text></view>
          </picker>
          <text class="hint">卡券抵扣，本次预约不再付款</text>
        </view>
        <view v-if="!trialMode" class="panel">
          <text class="section-title">什么时候开始</text>
          <picker mode="date" :value="day" :start="today" :end="lastDay" @change="changeDay">
            <view class="pick-row"><text>预约日期</text><text>{{ day }} ›</text></view>
          </picker>
          <picker mode="time" :value="time" :start="firstTime" end="23:59" @change="changeTime">
            <view class="pick-row"><text>开始时间</text><text>{{ time }} ›</text></view>
          </picker>
          <view class="window"><text>{{ windowLabel }}</text><text class="small">连续 {{ selected.hours }} 小时</text></view>
          <text class="hint">按预约时段计时，晚到不顺延，中途外出不暂停。开始前可取消重约。</text>
        </view>
        <view v-if="trialMode" class="panel">
          <text class="section-title">开灯才开始计时</text>
          <text class="hint">请到店后预约座位，先录入门禁人脸，再到座位开灯。首次开灯成功后连续使用两小时，中途关灯不暂停，再次开灯不重置。</text>
          <text class="hint">预约后两小时内未开灯，会释放座位并恢复体验卡；开灯前可取消重约。若迟到后该座位接下来的两小时有冲突，请换座。</text>
          <text class="hint">体验结束自动关灯，并取消本次体验的控灯和门禁权限。</text>
        </view>
        <view class="panel">
          <text class="section-title">选择空闲座位</text>
          <text class="hint">{{ storeName }} · 只显示整个预约时段都空闲的座位</text>
          <text v-if="seatLoading" class="hint">正在查询余座…</text>
          <text v-else-if="seatError" class="hint error">{{ seatError }}</text>
          <text v-else-if="!seats.length" class="hint">该时段暂无空位，请换个开始时间。</text>
          <view class="seat-grid">
            <view v-for="seat in seats" :key="seat.seatId" :class="['seat', { chosen: seatId === seat.seatId }]" @click="seatId = seat.seatId">
              <text>{{ seat.seatNum }}号</text>
              <text class="small">{{ Number(seat.seatArea) === 1 ? '沉浸区' : '经济区' }}</text>
            </view>
          </view>
        </view>
        <u-button color="#b96a39" :disabled="!seatId || seatLoading || !!seatError" :loading="submitting" :text="trialMode ? '预留座位，到店开灯起算' : '确认预约这4小时'" @click="submit" />
        <text class="footer">{{ trialMode ? '预约成功不会自动开灯，也不会开始体验计时。到座位后请在首页或「我的预约」开灯。' : '需要多学一会儿？可另购一张卡，再预约后续空闲时段。请以确认后的结束时间为准。' }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { getMyCard, getSeat, dailyOrder } from '@/config/api.js'
import { isCardUsable, isTimedCard, isTrialCard } from '@/utils/card-usable.js'
import { beijingParts, timedWindow } from '@/utils/timed-booking.js'
export default {
  data() {
    return { cards: [], cardIndex: 0, preferredCard: '', trialMode: false, day: '', time: '18:00', today: '', lastDay: '',
      roomId: '', storeName: '', seats: [], seatId: '', seatError: '', loading: true,
      seatLoading: false, submitting: false, seatRequest: 0 }
  },
  computed: {
    selected() { return this.cards[this.cardIndex] || { hours: 4, firstHour: 18, title: '' } },
    firstTime() { return String(this.selected.firstHour).padStart(2, '0') + ':00' },
    windowLabel() { try { return timedWindow(this.day, this.time, this.selected.hours).label } catch (e) { return '请选择时间' } }
  },
  methods: {
    changeCard(e) { this.cardIndex = Number(e.detail.value); if (this.time < this.firstTime) this.time = this.firstTime; this.loadSeats() },
    changeDay(e) { this.day = e.detail.value; this.loadSeats() },
    changeTime(e) { this.time = e.detail.value; this.loadSeats() },
    buy() { uni.navigateTo({ url: '/other_pages/recharge-card/recharge-card?title=' + encodeURIComponent('下班充电卡') }) },
    redeem() { uni.navigateTo({ url: '/other_pages/douyin/verify' }) },
    bookings() { uni.navigateTo({ url: '/other_pages_mine/my_bookings/my_bookings' }) },
    reservationWindow() {
      if (this.trialMode) {
        const current = beijingParts(new Date(Date.now() + 60000))
        return timedWindow(current.day, current.time, 2)
      }
      return timedWindow(this.day, this.time, this.selected.hours)
    },
    async load() {
      this.loading = true
      try {
        const res = await getMyCard({}, { custom: { auth: true, catch: true } })
        this.cards = (res.data || []).filter(c => isTimedCard(c) && isCardUsable(c) && isTrialCard(c) === this.trialMode).map(c => ({
          id: c.id, title: c.card.cardTitle, hours: Number(c.card.bookingHours),
          firstHour: Number(c.card.entryStartHour) || 0, area: Number(c.card.cardType) || 0
        }))
        const preferred = this.cards.findIndex(c => String(c.id) === this.preferredCard)
        this.cardIndex = preferred >= 0 ? preferred : Math.min(this.cardIndex, Math.max(0, this.cards.length - 1))
        await this.loadSeats()
      } catch (e) {
        uni.showToast({ title: (e && e.msg) || '读取卡券失败，请重试', icon: 'none' })
      } finally { this.loading = false }
    },
    async loadSeats() {
      const request = ++this.seatRequest
      this.seatId = ''; this.seats = []; this.seatError = ''
      if (!this.cards.length) return
      if (!this.roomId) { this.seatError = '请先在首页选择门店'; return }
      let window
      try {
        window = this.reservationWindow()
        if (!this.trialMode && Number(this.time.slice(0, 2)) < this.selected.firstHour) throw new Error('请选择' + this.firstTime + '后的时间')
        if (window.start.getTime() < Date.now() - 60000) throw new Error('开始时间已过，请重新选择')
      } catch (e) { this.seatError = e.message; this.seatLoading = false; return }
      const area = this.selected.area
      this.seatLoading = true
      try {
        const res = await getSeat({ roomId: this.roomId, startTime: window.startTime, endTime: window.endTime },
          { custom: { auth: true, catch: true } })
        if (request !== this.seatRequest) return
        this.seats = ((res.data && res.data.seatCom) || []).concat((res.data && res.data.seatVip) || [])
          .filter(s => [true, 1, '1', 'true'].includes(s.status))
          .filter(s => area === 0 || (area === 1 ? Number(s.seatArea) === 1 : Number(s.seatArea) !== 1))
          .sort((a, b) => Number(a.seatNum) - Number(b.seatNum))
      } catch (e) { if (request === this.seatRequest) this.seatError = (e && e.msg) || '余座查询失败，请更换时间重试' }
      finally { if (request === this.seatRequest) this.seatLoading = false }
    },
    async submit() {
      if (this.submitting || !this.seatId || !this.selected.id) return
      this.submitting = true
      try {
        const window = this.reservationWindow()
        await dailyOrder({ cardUserId: this.selected.id, seatId: this.seatId,
          consumptionDate: (this.trialMode ? beijingParts().day : this.day) + ' 00:00:00', bookingStartTime: window.startTime },
        { custom: { auth: true, catch: true } })
        uni.showModal({ title: '预约成功', content: this.trialMode ? '尚未开始计时。请先在首页录入门禁人脸，到座位后点击开灯；开灯成功起连续体验两小时，到期自动关灯并取消体验权限。' : this.day + ' ' + window.label + '。到店后请在首页开灯，结束前请续约或离座。',
          showCancel: false, success: () => uni.navigateTo({ url: '/other_pages_mine/my_bookings/my_bookings' }) })
      } catch (e) { uni.showModal({ title: '预约未完成', content: (e && (e.msg || e.message)) || '请重试', showCancel: false }) }
      finally { this.submitting = false }
    }
  },
  onLoad(options) {
    this.trialMode = options.trial === '1'
    this.preferredCard = String(options.cardUserId || '')
    let store = this.$store && this.$store.state.store
    if (!store) { try { const raw = uni.getStorageSync('store'); store = typeof raw === 'string' ? JSON.parse(raw) : raw } catch (e) {} }
    this.roomId = (store && store.roomId) || options.roomId || ''
    this.storeName = (store && store.roomName) || '当前门店'
    const nextMinute = beijingParts(new Date(Date.now() + 60000))
    this.today = beijingParts().day
    this.lastDay = beijingParts(new Date(Date.now() + 30 * 86400000)).day
    this.day = nextMinute.day
    this.time = nextMinute.time < '18:00' ? '18:00' : nextMinute.time
  },
  onShow() { this.load() },
  onUnload() { this.seatRequest++ }
}
</script>

<style scoped>
.afterwork { min-height: 100vh; background: #f7f4ee; color: #302a23; }
.content { padding: 32rpx 32rpx 70rpx; }
.intro { padding: 28rpx 8rpx 42rpx; }
.eyebrow, .title, .subtitle, .section-title, .hint, .footer { display: block; }
.eyebrow { color: #9a7151; font-size: 24rpx; letter-spacing: 3rpx; }
.title { font-size: 42rpx; font-weight: 600; line-height: 1.5; margin: 14rpx 0; }
.subtitle { color: #7b7167; font-size: 25rpx; }
.panel { background: white; border-radius: 24rpx; padding: 30rpx; margin-bottom: 24rpx; }
.section-title { font-size: 29rpx; font-weight: 600; margin-bottom: 12rpx; }
.hint { font-size: 24rpx; line-height: 1.8; color: #887e72; margin: 12rpx 0 20rpx; }
.pick-row { display: flex; justify-content: space-between; padding: 25rpx 0; border-bottom: 1rpx solid #f2eee8; font-size: 28rpx; }
.arrow, .small { color: #9b826c; font-size: 23rpx; }
.window { display: flex; justify-content: space-between; background: #faf1e5; color: #8d532f; padding: 24rpx; border-radius: 16rpx; margin-top: 22rpx; font-size: 32rpx; }
.seat-grid { display: flex; flex-wrap: wrap; margin: 0 -6rpx; }
.seat { width: 27%; margin: 8rpx 1%; padding: 22rpx 2%; border: 2rpx solid #eee7de; border-radius: 16rpx; text-align: center; }
.seat text { display: block; line-height: 1.7; }
.seat.chosen { border-color: #b96a39; background: #fcf0e2; color: #99542d; }
.footer { font-size: 23rpx; color: #8b8175; line-height: 1.8; margin-top: 24rpx; }
.secondary { margin-top: 20rpx; }
.error { color: #b95536; }
</style>
