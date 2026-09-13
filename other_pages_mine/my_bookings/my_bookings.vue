<template>
	<view>
		<my-navbar leftText="我的预约" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<view class="container">
			<view v-if="list.length > 0">
				<view class="record-item" v-for="item in list" :key="item.id">
					<view class="record-head">
						<u-text :bold="true" size="30" :text="item.roomName || '自习室'" />
						<u-tag :text="statusLabel(item.status)" :type="statusType(item.status)" size="mini" />
					</view>
					<view class="record-row">
						<u-text size="26" color="#666" :text="'座位：' + (item.seatNum ? item.seatNum + ' 号' : '未选座位')" />
					</view>
					<view class="record-row">
						<u-text size="26" color="#666" :text="'日期：' + (item.consumptionDate || '')" />
					</view>
					<view class="record-row" v-if="item.cardTitle">
						<u-text size="26" color="#999" :text="'使用卡：' + item.cardTitle" />
					</view>
					<!-- 今日待使用预约: 提供座位灯光控制 -->
					<view class="light-row" v-if="isTodayActive(item)">
						<view class="light-info">
							<u-icon name="server-man" color="#35a5ed" size="34" />
							<u-text size="26" color="#333" text="座位灯光" style="margin-left: 10rpx;" />
						</view>
						<view class="light-actions">
							<u-button size="small" type="primary" color="#35a5ed" shape="circle"
								:loading="lightLoading === ('on-' + item.id)" @click="lightOn(item)"
								text="开灯" />
							<u-button size="small" type="default" shape="circle"
								:loading="lightLoading === ('off-' + item.id)" @click="lightOff(item)"
								text="关灯" style="margin-left: 16rpx;" />
						</view>
					</view>
					<!-- 待使用预约: 提供取消按钮（预约后3小时内可取消） -->
					<view class="cancel-row" v-if="item.status === 0">
						<u-button v-if="canCancel(item)" size="small" type="warning" plain shape="circle"
							:loading="cancelLoading === item.id" @click="cancelBooking(item)"
							text="取消预约" />
						<view v-else class="cancel-disabled">
							<u-text size="22" color="#999" text="预约超过3小时不可取消，如需帮助请联系客服" />
						</view>
					</view>
				</view>
			</view>
			<view v-else class="empty">
				<u-empty text="暂无预约记录" mode="list" />
				<u-text size="24" color="#999" text="去预约一个座位吧" align="center" />
				<view style="margin-top: 30rpx;">
					<u-button color="#35a5ed" size="large" text="去预约选座" @click="goBook" />
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { myBookings, seatPowerOn, seatPowerOff, cancelBooking } from '@/config/api.js'
	import { judgeDeviceResult } from '@/utils/device-result.js'
	export default {
		data() {
			return {
				list: [],
				lightLoading: '',
				cancelLoading: ''
			}
		},
		methods: {
			statusLabel(status) {
				if (status === 1) return '已使用'
				if (status === 2) return '已失效'
				return '待使用'
			},
			statusType(status) {
				if (status === 1) return 'success'
				if (status === 2) return 'info'
				return 'primary'
			},
			goBook() {
				uni.switchTab({ url: '/pages/order/order' })
			},
				isTodayActive(item) {
					// 状态为待使用(0) 且预约日期是今天
					if (!item || item.status !== 0 || !item.consumptionDate || !item.seatId) return false
					var d = new Date()
					var pad = function(n) { return n < 10 ? '0' + n : '' + n }
					var today = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
					return String(item.consumptionDate).indexOf(today) === 0
				},
				canCancel(item) {
					// 预约提交后3小时内可取消
					if (!item.createTime) return true
					var created = new Date(item.createTime)
					var elapsed = Date.now() - created.getTime()
					return elapsed < 3 * 60 * 60 * 1000
				},
			cancelBooking(item) {
				// 取消仅作废当日预约; 平台不做在线退款, 需要退款请联系客服办理
				uni.showModal({
					title: '取消预约',
					content: '取消后该天预约作废。卡费如需退还，请联系门店客服办理。确定取消？',
					confirmText: '确定取消',
					confirmColor: '#e64340',
					success: async (res) => {
						if (!res.confirm) return
						this.cancelLoading = item.id
						try {
							const r = await cancelBooking({ id: item.id }, { custom: { auth: true, catch: true } })
							uni.$u.toast((r && r.data) || '已取消预约')
							this.loadRecords()
						} catch (e) {
							uni.$u.toast((e && e.msg) || '取消失败，请稍后再试')
						} finally {
							this.cancelLoading = ''
						}
					}
				})
			},
			async lightOn(item) {
				this.lightLoading = 'on-' + item.id
				try {
					const res = await seatPowerOn({ seatId: item.seatId }, { custom: { auth: true, catch: true } })
					const r = judgeDeviceResult(res, '座位灯已开启')
					uni.$u.toast(r.msg)
				} catch (e) {
					uni.$u.toast((e && e.msg) || '开灯失败，请稍后再试')
				} finally {
					this.lightLoading = ''
				}
			},
			async lightOff(item) {
				this.lightLoading = 'off-' + item.id
				try {
					const res = await seatPowerOff({ seatId: item.seatId }, { custom: { auth: true, catch: true } })
					const r = judgeDeviceResult(res, '座位灯已关闭')
					uni.$u.toast(r.msg)
				} catch (e) {
					uni.$u.toast((e && e.msg) || '关灯失败，请稍后再试')
				} finally {
					this.lightLoading = ''
				}
			},
			async loadRecords() {
				try {
					const { data: list } = await myBookings({}, { custom: { auth: true, catch: true } })
					this.list = list || []
				} catch (e) {
					console.error('加载预约记录失败', e)
				}
			}
		},
		onShow() {
			this.loadRecords()
		}
	}
</script>

<style lang="scss" scoped>
	.container { padding: 30rpx; }
	.record-item {
		background: #fff;
		border-radius: 20rpx;
		padding: 26rpx;
		margin-bottom: 20rpx;
	}
	.record-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 14rpx;
	}
	.record-row { margin-bottom: 10rpx; }
	.empty { text-align: center; padding: 60rpx 0; }
	.light-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 20rpx;
		padding-top: 20rpx;
		border-top: 2rpx solid #f5f5f5;
	}
	.light-info { display: flex; align-items: center; }
	.light-actions { display: flex; align-items: center; }
	.cancel-row {
		margin-top: 20rpx;
		padding-top: 20rpx;
		border-top: 2rpx solid #f5f5f5;
		display: flex;
		justify-content: flex-end;
	}
	.cancel-disabled {
		text-align: right;
		padding: 6rpx 0;
	}
</style>
