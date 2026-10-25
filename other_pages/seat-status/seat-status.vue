<template>
	<view class="current-seats-page">
		<my-navbar leftText=" " title="当前座位情况" leftIcon="arrow-left" :custom="false" :autoBack="true" bgColor="#ffffff" leftIconSize="40"></my-navbar>
		<view class="current-seats-content">
			<view class="current-seats-heading">
				<view>
					<text class="current-seats-title" v-if="snapshot">{{ snapshot.available }} 席可预约</text>
					<text class="current-seats-title" v-else>当前座位情况</text>
					<text class="current-seats-zones" v-if="snapshot">轻音区 {{ snapshot.lightAvailable }} 席 · 静音区 {{ snapshot.quietAvailable }} 席</text>
				</view>
				<button class="current-seats-refresh" size="mini" :loading="loading" :disabled="loading" @click="refresh">刷新</button>
			</view>
			<view class="current-seats-state" v-if="!snapshot">
				<text>{{ stateText }}</text>
				<button v-if="state === 'guest'" size="mini" @click="toLogin">去登录</button>
			</view>
			<template v-if="snapshot">
				<view class="current-seats-meta"><text>已预约 {{ snapshot.occupied }} / 共 {{ snapshot.total }} 席</text><text>{{ updatedLabel }} 更新</text></view>
				<text v-if="!snapshot.total" class="current-seats-empty">当前门店暂无可展示的座位</text>
				<view v-else class="current-seats-map" role="img" aria-label="当前预约座位图，吉祥物表示已预约，查看不会占座">
					<image class="current-seats-background" :src="mapImage" mode="widthFix"></image>
					<view v-for="(seat, number) in displaySeats" :key="number" class="current-seats-mark" :style="{left: seat.x + '%', top: seat.y + '%'}">
						<text v-if="seat.disabled" class="current-seats-disabled">停用</text>
						<image v-else-if="!seat.available" src="/other_pages/static/daan-study-mascot.png" mode="aspectFit" class="current-seats-mascot" :aria-label="number + '号座位已预约'"></image>
					</view>
				</view>
				<view v-if="snapshot.total" class="current-seats-legend"><text>数字座位：可预约</text><view><image src="/other_pages/static/daan-study-mascot.png" mode="aspectFit"></image><text>已预约</text></view><text class="current-seats-disabled-legend">停用：不可预约</text></view>
			</template>
			<text class="current-seats-note">实际可预约情况以所选时段为准</text>
			<button class="current-seats-book" @click="toBook">选择时段并预约</button>
		</view>
	</view>
</template>

<script>
	import { getCurrentSeats, seatQueryTime } from '@/utils/current-seats.js'
	import { SEAT_MAP_IMAGE, createSeatPositions } from '@/config/seat-layout.js'
	import { isLoggedIn } from '@/utils/auth.js'

	export default {
		data() {
			return { roomId: null, snapshot: null, loading: false, state: 'loading', mapImage: SEAT_MAP_IMAGE }
		},
		computed: {
			displaySeats() {
				if (!this.snapshot) return {}
				const seats = createSeatPositions()
				Object.keys(seats).forEach(number => {
					seats[number] = this.snapshot.seats[number] || { ...seats[number], disabled: true }
				})
				return seats
			},
			stateText() {
				if (!this.roomId) return '请先回首页选择门店'
				if (this.state === 'guest') return '登录后即可查看当前座位情况，无需先预约'
				if (this.state === 'error') return '暂时无法获取座位情况，请点击刷新重试'
				return '正在获取当前座位情况…'
			},
			updatedLabel() {
				return this.snapshot ? seatQueryTime(new Date(this.snapshot.capturedAt)).slice(11) : ''
			}
		},
		onLoad(options) {
			const store = this.$store && this.$store.state.store
			this.roomId = options.roomId || (store && store.roomId) || null
			this._alive = true
			this._requestId = 0
		},
		onShow() {
			this.refresh()
			this.stopTimer()
			this._timer = setInterval(() => this.refresh(), 30000)
		},
		onHide() { this.stopTimer() },
		onUnload() { this._alive = false; this.stopTimer() },
		methods: {
			stopTimer() {
				if (this._timer) clearInterval(this._timer)
				this._timer = null
			},
			async refresh() {
				if (!this._alive || this.loading) return
				if (!this.roomId || !isLoggedIn()) {
					this.snapshot = null
					this.state = 'guest'
					return
				}
				const requestId = ++this._requestId
				this.loading = true
				try {
					const snapshot = await getCurrentSeats(this.roomId)
					if (this._alive && requestId === this._requestId) {
						this.snapshot = isLoggedIn() ? snapshot : null
						this.state = isLoggedIn() ? 'ready' : 'guest'
					}
				} catch (error) {
					if (this._alive && requestId === this._requestId) {
						this.snapshot = null
						this.state = isLoggedIn() ? 'error' : 'guest'
					}
				} finally {
					if (this._alive && requestId === this._requestId) this.loading = false
				}
			},
			toLogin() { uni.switchTab({ url: '/pages/mine/mine' }) },
			toBook() { uni.switchTab({ url: '/pages/order/order' }) }
		}
	}
</script>

<style scoped>
	.current-seats-page { min-height: 100vh; background: #f5f7fa; }
	.current-seats-content { padding: 36rpx 40rpx; padding-bottom: calc(40rpx + env(safe-area-inset-bottom)); }
	.current-seats-heading { display: flex; justify-content: space-between; align-items: center; }
	.current-seats-title { display: block; color: #35a5ed; font-size: 40rpx; font-weight: 600; }
	.current-seats-zones { display: block; margin-top: 8rpx; color: #6c7f90; font-size: 24rpx; }
	.current-seats-refresh { margin: 0 0 0 16rpx; flex-shrink: 0; color: #50718d; background: #ffffff; }
	.current-seats-state { padding: 80rpx 0; text-align: center; color: #6c7f90; font-size: 26rpx; }
	.current-seats-state button { display: block; margin-top: 24rpx; }
	.current-seats-meta { display: flex; justify-content: space-between; margin: 24rpx 0 16rpx; color: #7c8997; font-size: 22rpx; }
	.current-seats-map { position: relative; overflow: hidden; border-radius: 18rpx; }
	.current-seats-background { display: block; width: 100%; }
	.current-seats-mark { position: absolute; width: 48rpx; height: 48rpx; transform: translate(-50%, -50%); pointer-events: none; }
	.current-seats-empty { display: block; padding: 60rpx 0; text-align: center; color: #6c7f90; font-size: 26rpx; }
	.current-seats-disabled { display: block; width: 48rpx; height: 48rpx; line-height: 48rpx; text-align: center; background: #7d8793; color: #ffffff; border-radius: 6rpx; font-size: 18rpx; }
	.current-seats-disabled-legend { margin-left: 24rpx; }
	.current-seats-mascot { width: 48rpx; height: 48rpx; border: 2rpx solid #ffffff; border-radius: 50%; box-sizing: border-box; background: #edf7ff; }
	.current-seats-legend { display: flex; justify-content: center; align-items: center; margin: 20rpx 0; color: #6c7f90; font-size: 22rpx; }
	.current-seats-legend view { display: flex; align-items: center; margin-left: 36rpx; }
	.current-seats-legend image { width: 40rpx; height: 40rpx; margin-right: 8rpx; }
	.current-seats-note { display: block; color: #8a97a5; text-align: center; font-size: 22rpx; margin: 24rpx 0 20rpx; }
	.current-seats-book { background: #35a5ed; color: #ffffff; font-size: 28rpx; border-radius: 16rpx; }
</style>
