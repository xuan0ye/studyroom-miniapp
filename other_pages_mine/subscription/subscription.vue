<template>
	<view>
		<my-navbar leftText="我的订阅" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true" leftIconSize="40" />
		<view class="container">
			<view class="section">
				<u-text :bold="true" size="28" color="#333" text="进行中" />
				<view style="height: 20rpx;" />
				<view v-if="activeSubscriptions.length > 0">
					<view class="sub-card" v-for="sub in activeSubscriptions" :key="sub.id">
						<view class="card-inner">
							<u-row align="center">
								<u-col :span="8">
									<u-text :bold="true" size="30" color="#333" :text="'座位 ' + sub.seatNum" />
									<view style="height: 10rpx;" />
									<u-tag :text="getTypeLabel(sub.lockType)" type="primary" size="mini" />
									<view style="height: 10rpx;" />
									<u-tag :text="getStatusLabel(sub.status)" type="info" size="mini" />
									<view style="height: 10rpx;" />
									<u-text size="24" color="#888" :text="sub.startDate + ' ~ ' + sub.endDate" />
								</u-col>
								<u-col :span="4" textAlign="right">
									<u-text :bold="true" size="34" color="#35a5ed" :text="'¥' + getPrice(sub.lockType)" />
								</u-col>
							</u-row>
							<u-divider />
							<view style="display:flex;justify-content:space-between;">
								<u-button size="mini" type="primary" plain @click="renewSub(sub)" text="续费" />
								<u-button size="mini" type="warning" plain @click="unlockSub(sub)" text="解锁" />
							</view>
						</view>
					</view>
				</view>
				<view v-else class="empty-state">
					<u-empty text="暂无进行中的订阅" mode="list" />
					<view style="height: 20rpx;" />
					<u-text size="26" color="#999" text="购买订阅可锁定固定座位" align="center" />
				</view>
			</view>

			<view class="section">
				<u-button type="primary" color="#35a5ed" size="large" @click="showBuyOptions = true" text="购买订阅" />
			</view>

			<view class="section">
				<u-text :bold="true" size="28" color="#333" text="历史记录" />
				<view style="height: 20rpx;" />
				<view v-if="historySubscriptions.length > 0">
					<view class="history-item" v-for="h in historySubscriptions" :key="h.id">
						<u-text size="26" color="#666" :text="'座位 ' + h.seatNum + ' ' + getTypeLabel(h.lockType) + ' ' + getStatusLabel(h.status)" />
						<u-text size="22" color="#999" :text="h.startDate + ' ~ ' + h.endDate" />
					</view>
				</view>
				<view v-else>
					<u-text size="24" color="#ccc" text="暂无历史记录" align="center" />
				</view>
			</view>
		</view>

		<u-popup v-model="showBuyOptions" mode="bottom" border-radius="30" :closeable="true">
			<view class="buy-popup">
				<u-text :bold="true" size="32" color="#333" text="选择套餐" align="center" />
				<view style="height: 30rpx;" />
				<view class="plan-item" v-for="plan in plans" :key="plan.type" @click="buySubscription(plan)">
					<u-row align="center">
						<u-col :span="6">
							<u-text :bold="true" size="30" :text="plan.name" />
							<u-text size="24" color="#999" :text="plan.desc" />
						</u-col>
						<u-col :span="6" textAlign="right">
							<u-text :bold="true" size="34" color="#ff5722" :text="'¥' + plan.price" />
						</u-col>
					</u-row>
				</view>
				<view style="height: 30rpx;" />
				<u-button type="default" size="large" @click="showBuyOptions = false" text="取消" />
			</view>
		</u-popup>

		<u-popup v-model="showSeatPicker" mode="bottom" border-radius="30" :closeable="true" @close="showSeatPicker = false">
			<view class="seat-picker">
				<u-text :bold="true" size="32" color="#333" :text="'选择座位（' + (selectedPlan ? selectedPlan.name : '') + '）'" align="center" />
				<view style="height: 30rpx;" />
				<scroll-view scroll-y style="max-height: 600rpx;">
					<view class="seat-item" v-for="seat in availableSeats" :key="seat.seatId" @click="confirmBuy(seat)">
						<u-row align="center">
							<u-col :span="14">
								<u-text :bold="true" size="30" :text="seat.areaName + ' ' + seat.seatNum + '号'" />
							</u-col>
							<u-col :span="6" textAlign="right">
								<u-text size="26" color="#35a5ed" text="可用" />
							</u-col>
						</u-row>
					</view>
				</scroll-view>
				<view style="height: 30rpx;" />
				<u-button type="default" size="large" @click="showSeatPicker = false" text="取消" />
			</view>
		</u-popup>
	</view>
</template>

<script>
	import { subscriptionMine, subscriptionLock, subscriptionUnlock, subscriptionRenew, getSeat } from '@/config/api.js'
	export default {
		data() {
			return {
				activeSubscriptions: [],
				historySubscriptions: [],
				showBuyOptions: false,
				selectedPlan: null,
				showSeatPicker: false,
				availableSeats: [],
				plans: [
					{ type: 1, name: '月卡', desc: '固定座位 30 天', price: '388.00' },
					{ type: 2, name: '季卡', desc: '固定座位 90 天', price: '998.00' },
					{ type: 3, name: '年卡', desc: '固定座位 365 天', price: '2998.00' }
				]
			}
		},
		methods: {
			getTypeLabel(type) {
				var map = { 1: '月卡', 2: '季卡', 3: '年卡', 4: '长期' }
				return map[type] || '未知'
			},
			getPrice(type) {
				var map = { 1: '388.00', 2: '998.00', 3: '2998.00', 4: '8888.00' }
				return map[type] || '0.00'
			},
			getStatusLabel(status) {
				var map = { 0: '待激活', 1: '进行中', 2: '已过期', 3: '已取消' }
				return map[status] || '未知'
			},
			async loadSubscriptions() {
				try {
					var res = await subscriptionMine({}, { custom: { auth: true, 'catch': true } })
					if (res.data) {
						this.activeSubscriptions = res.data.filter(function(s) { return s.status === 0 || s.status === 1 })
						this.historySubscriptions = res.data.filter(function(s) { return s.status === 2 || s.status === 3 })
					}
				} catch (e) {}
			},
			async buySubscription(plan) {
				this.showBuyOptions = false
				this.selectedPlan = plan
				this.loadSeatsForSubscription()
			},
			async loadSeatsForSubscription() {
				var store = {}
				try { store = JSON.parse(uni.getStorageSync('store') || '{}') } catch (e) {}
				if (!store.roomId) return uni.showToast({ title: '请先选择门店', icon: 'none' })
				uni.showLoading({ title: '加载座位...' })
				var now = new Date()
				var pad = function(n) { return (n < 10 ? '0' : '') + n }
				var startTime = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' 00:00:00'
				var tomorrow = new Date(now.getTime() + 86400000)
				var endTime = tomorrow.getFullYear() + '-' + pad(tomorrow.getMonth() + 1) + '-' + pad(tomorrow.getDate()) + ' 00:00:00'
				try {
					const { data: res } = await getSeat({ roomId: store.roomId, startTime: startTime, endTime: endTime }, { custom: { auth: true } })
					var all = (res.seatVip || []).concat(res.seatCom || [])
					this.availableSeats = all.filter(function(s) { return s.status === true })
					uni.hideLoading()
					if (this.availableSeats.length === 0) return uni.showToast({ title: '今天暂无可用座位', icon: 'none' })
					this.showSeatPicker = true
				} catch (e) {
					uni.hideLoading()
					uni.showToast({ title: '查询座位失败', icon: 'none' })
				}
			},
			async confirmBuy(seat) {
				var store = {}
				try { store = JSON.parse(uni.getStorageSync('store') || '{}') } catch (e) {}
				var days = { 1: 30, 2: 90, 3: 365, 4: 3650 }[this.selectedPlan.type] || 30
				var now = new Date()
				var pad = function(n) { return (n < 10 ? '0' : '') + n }
				var startDate = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' 00:00:00'
				var end = new Date(now.getTime() + days * 86400000)
				var endDate = end.getFullYear() + '-' + pad(end.getMonth() + 1) + '-' + pad(end.getDate()) + ' 23:59:59'
				this.showSeatPicker = false
				try {
					await subscriptionLock({ seatId: seat.seatId, roomId: store.roomId, lockType: this.selectedPlan.type, startDate: startDate, endDate: endDate }, { custom: { auth: true } })
					uni.showToast({ title: '购买成功', icon: 'success' })
					this.loadSubscriptions()
				} catch (e) {
					uni.showToast({ title: '购买失败', icon: 'none' })
				}
			},
			async renewSub(sub) {
				try {
					await subscriptionRenew({ id: sub.id }, { custom: { auth: true } })
					uni.showToast({ title: '续费成功', icon: 'success' })
					this.loadSubscriptions()
				} catch (e) { uni.showToast({ title: '操作失败', icon: 'none' }) }
			},
			async unlockSub(sub) {
				var that = this
				uni.showModal({
					title: '确认',
					content: '确认解锁该座位？',
					success: async function(res) {
						if (res.confirm) {
							try {
								await subscriptionUnlock({ id: sub.id }, { custom: { auth: true } })
								uni.showToast({ title: '解锁成功', icon: 'success' })
								that.loadSubscriptions()
							} catch (e) { uni.showToast({ title: '操作失败', icon: 'none' }) }
						}
					}
				})
			}
		},
		onShow() {
			this.loadSubscriptions()
		}
	}
</script>

<style lang="scss" scoped>
	.container { padding: 30rpx; }
	.section { margin-bottom: 30rpx; }
	.sub-card { margin-bottom: 20rpx; }
	.card-inner { background: #fff; border-radius: 20rpx; padding: 24rpx; }
	.empty-state { text-align: center; padding: 60rpx 0; }
	.history-item { 
		background: #f9f9f9; border-radius: 12rpx; padding: 20rpx; margin-bottom: 12rpx; 
		display: flex; justify-content: space-between; align-items: center;
	}
	.buy-popup { padding: 40rpx 30rpx; padding-bottom: 40rpx; }
	.plan-item { 
		background: #f5f5f5; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; 
	}
	.plan-item:active { background: #e8f4ff; }
	.seat-picker { padding: 40rpx 30rpx; padding-bottom: 40rpx; }
	.seat-item { 
		background: #f5f5f5; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; 
	}
	.seat-item:active { background: #e8f4ff; }
</style>