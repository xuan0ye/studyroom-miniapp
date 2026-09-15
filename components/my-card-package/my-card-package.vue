<template>
	<view>
		<view>
			<view class="uni-margin-wrap">
				<swiper class="swiper" :next-margin="next+'rpx'" :previous-margin="previous+'rpx'"
					:indicator-dots="false" :autoplay="autoplay" :interval="interval" :duration="duration"
					@change="change">
					<swiper-item v-for="(item,index) in list" :key="index">
						<view class="swiper-item">
							<!-- 卡面背景必须用 image 组件: 小程序 WXSS 的 background-image 不支持本地图片路径 -->
							<image class="card-bg-img" :src="getCardBg(item, index)" mode="aspectFill" />
							<view class="card-overlay"></view>
							<view class="card-info-top">
						<u-text :bold="true" size="40" color="#3d3d3d" :text="item.card.cardTitle" />
						<view :class="'card-tag card-tag-' + statusType">{{ statusLabel }}</view>
							</view>
							<view class="card-info-bottom">
								<u-text size="24" color="#4d4d4d" :text="'有效期至 ' + item.expiryTime" />
							</view>
						</view>
					</swiper-item>
				</swiper>
			</view>
		</view>
		<!-- 滑动指示器 -->
		<view class="slide-indicator" v-if="list.length > 1">
				<view v-for="(item, index) in list" :key="index"
					:class="['indicator-dot', { 'indicator-dot-active': index === currentIndex }]">
				</view>
			</view>
			<view class="slide-hint" v-if="list.length > 1 && showSlideHint">
				<u-text size="22" color="#999" text="← 左右滑动查看卡种 →" />
			</view>
		<!-- 卡券内容区域 -->
		<view style="margin-top: 20rpx;background-color: #ffffff">
			<view style="border-bottom: 2rpx solid #e5e5e5;">
				<view style="margin: auto 80rpx;">
					<u-tabs :list="tabs" @click="tabsClick" lineWidth="140rpx" lineHeight="4rpx"
						:activeStyle="activeStyle" :scrollable="false"></u-tabs>
				</view>
			</view>
			<view>
				<view class="card-comm">
					<view style="display: flex;justify-content: space-between;align-items: baseline;">
						<view>
							<u-icon name="https://api.dayousuoan.top/upload/appstatic/package/card.png" size="100"></u-icon>
							<u-text :bold="true" size="28" color="#35a5ed" :text="card.frequency+'天'" align="center" />
						</view>
						<view style="display: flex;flex-direction: column;">
							<u-icon name="https://api.dayousuoan.top/upload/appstatic/package/seat.png" size="100"></u-icon>
							<my-seat-area :areaNum="card.usable"></my-seat-area>
						</view>
					</view>
					<view style="margin-top: 20rpx; text-align: center;">
						<u-button v-if="!consumed && !expired" color="#35a5ed" size="medium" text="去预约" @click="goBook" />
						<u-button v-else type="info" size="medium" plain :text="consumed ? '已使用' : '已过期'" disabled />
						<!-- 周卡/月卡已锁座: 显示锁座状态 + 取消锁座 -->
						<view v-if="!consumed && lockState.locked" style="margin-top: 16rpx;">
							<u-text size="24" color="#e6a23c" :text="lockState.label" />
							<view style="margin-top: 10rpx;">
								<u-button type="error" plain size="small" shape="circle" :loading="unlocking"
									text="取消锁座（可重新预约）" @click="doUnlock" />
							</view>
						</view>
						<!-- 月卡/长期卡(term>=30): 请假停卡按钮 -->
						<view v-if="!consumed && card.term >= 30" style="margin-top: 16rpx;">
							<u-button type="warning" plain size="small" shape="circle" :loading="leaving" text="请假停卡"
								@click="doLeave" />
						</view>
					</view>
				</view>
			</view>

		</view>
	</view>
</template>

<script>
	export default {
		name: "my-card-package",
		props: {
			list: {
				type: Array
			}
		},
		data() {
			return {
				// card: { 参数说明
				// 	title: '', 优惠卡标题
				// 	money: 0, 金额
				// 	frequency: 0, 次数
				// 	term: 0, 有效期
				// 	area: 0 区域 0为舒适区 1为经济区
				//  areaTitle:'舒适区' 区域名字
				// }
				indicatorDots: false,
				autoplay: false,
				interval: 2000,
				duration: 500,
				next: 80,
				previous: -20,
				tabs: [{
					name: '卡券内容'
				}],
				consumed: false,
				leaving: false,
				unlocking: false,
				currentIndex: 0,
				showSlideHint: true,
				cardBgs: [
					'/static/index/card-day.jpg',
					'/static/index/card-week.jpg',
					'/static/index/card-biweek.jpg',
					'/static/index/card-month.jpg',
					'/static/index/card-season.jpg',
					'/static/index/card-hundred.jpg',
					'/static/index/card-year.jpg',
					'/static/index/card-duo.jpg'
				],
				activeStyle: {
					color: '#35a5ed',
					fontWeight: 'bold'
				},
				card: {
					title: '',
					money: 0,
					frequency: 0,
					term: 0,
					area: 0,
					areaTitle: ''
				}
			}
		},
		computed: {
			// 当前卡是否已过期(expiryTime 早于现在)
			expired() {
				var cur = this.list[this.currentIndex] || this.list[0] || {}
				if (!cur.expiryTime) return false
				var expiry = new Date(String(cur.expiryTime).replace(/-/g, '/'))
				return expiry < new Date()
			},
			// 卡状态标签: 已使用 > 已过期 > 可用
			statusLabel() {
				var cur = this.list[this.currentIndex] || this.list[0] || {}
				if (cur.consumed) return '已使用'
				if (this.expired) return '已过期'
				return '可用'
			},
			statusType() {
				var cur = this.list[this.currentIndex] || this.list[0] || {}
				if (cur.consumed) return 'error'
				if (this.expired) return 'info'
				return 'success'
			},
			// 当前卡锁座状态: 周卡/月卡锁座中显示
			lockState() {
				var cur = this.list[this.currentIndex] || this.list[0] || {}
				if (!cur.lockSeatId || !cur.lockEndTime) {
					return { locked: false, label: '' }
				}
				var lockEnd = new Date(String(cur.lockEndTime).replace(/-/g, '/'))
				var now = new Date()
				if (lockEnd <= now) {
					return { locked: false, label: '' }
				}
				var label = '已锁座至 ' + (lockEnd.getMonth() + 1) + '月' + lockEnd.getDate() + '日（该座位期间归你使用）'
				return { locked: true, label: label }
			}
		},
		methods: {
			change(e) {
				var current = e.detail.current
				this.currentIndex = current
				this.showSlideHint = false
				const that = this
				this.card = this.list[current].card
				this.consumed = !!(this.list[current] && this.list[current].consumed)
				console.log(current)
				if (current == 0) {
					setTimeout(function() {
						that.next = 80
						that.previous = -20
					}, 500);

				} else if (current == this.list.length - 1) {
					this.next = 58
					this.previous = 40
				}
			},
			getCardBg(item, index) {
				var freq = (item.card && item.card.frequency) || 0
				var party = (item.card && item.card.partySize) || 1
				if (party >= 2) return this.cardBgs[7]   // 双人卡
				if (freq <= 1) return this.cardBgs[0]      // 日卡
				if (freq <= 7) return this.cardBgs[1]      // 周卡
				if (freq <= 14) return this.cardBgs[2]     // 双周卡
				if (freq <= 30) return this.cardBgs[3]     // 月卡
				if (freq <= 90) return this.cardBgs[4]     // 季卡
				if (freq <= 100) return this.cardBgs[5]    // 百天卡
				return this.cardBgs[6]                   // 年卡
			},
			tabsClick(index) {
				console.log(index)
			},
			goBook() {
				uni.switchTab({
					url: '/pages/order/order'
				})
			},
			doLeave() {
				var that = this
				// 当前 swiper 对应 list 中的卡, 用其 id 作为 cardUserId
				var cur = this.list[this.currentIndex] || this.list[0]
				if (!cur || !cur.id) {
					uni.$u.toast('请先选择要请假的月卡')
					return
				}
				uni.showModal({
					title: '请假停卡',
					content: '请假后将释放当前锁定的座位，卡有效期顺延（每张月卡最多请假2次）。确定请假？',
					confirmText: '请假',
					confirmColor: '#e6a23c',
					success: (res) => {
						if (!res.confirm) return
						that.leaving = true
						uni.$u.http.post('/api/wx/daily/leave', { cardUserId: cur.id }, { custom: { auth: true, catch: true } })
							.then((r) => {
								// R.ok(msg) 时 data 是字符串消息
								const msg = (typeof r.data === 'string' && r.data) || (r && r.msg) || '已释放座位，卡有效期已顺延'
								uni.showModal({
									title: '请假成功',
									content: msg,
									showCancel: false,
									confirmText: '知道了',
									success: () => {
										that.$emit('refresh')
									}
								})
							})
							.catch((e) => {
								uni.$u.toast((e && e.msg) || '请假失败，请稍后再试')
							})
							.finally(() => {
								that.leaving = false
							})
					}
				})
			},
			doUnlock() {
				var that = this
				var cur = this.list[this.currentIndex] || this.list[0]
				if (!cur || !cur.id) {
					uni.$u.toast('请先选择要取消锁座的卡')
					return
				}
				uni.showModal({
					title: '取消锁座',
					content: '取消后当前锁定的座位将释放，可重新预约其他座位（卡不退款，剩余有效期不变）。确定取消锁座？',
					confirmText: '取消锁座',
					confirmColor: '#e64340',
					success: (res) => {
						if (!res.confirm) return
						that.unlocking = true
						uni.$u.http.post('/api/wx/daily/unlock', { cardUserId: cur.id }, { custom: { auth: true, catch: true } })
							.then((r) => {
								const msg = (typeof r.data === 'string' && r.data) || (r && r.msg) || '已取消锁座，座位已释放'
								uni.showModal({
									title: '取消成功',
									content: msg,
									showCancel: false,
									confirmText: '知道了',
									success: () => {
										that.$emit('refresh')
									}
								})
							})
							.catch((e) => {
								uni.$u.toast((e && e.msg) || '取消锁座失败，请稍后再试')
							})
							.finally(() => {
								that.unlocking = false
							})
					}
				})
			},
			async getCardList() {

			}
		},
		onLoad() {
			this.card = this.list[0].card
			this.consumed = !!(this.list[0] && this.list[0].consumed)
		}
	}
</script>

<style lang="scss">
	.uni-margin-wrap {
		width: 690rpx;
		width: 100%;
		margin: 20rpx auto;
		margin-left: 40rpx;
	}

	.swiper {
		height: 360rpx;
	}

	.swiper-item {
		display: block;
		position: relative;
		height: 360rpx;
		border-radius: 24rpx;
		margin-left: 20rpx;
		overflow: hidden;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
	}

	/* 卡面背景图(image 组件, aspectFill 保持铺满不变形) */
	.card-bg-img {
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 100%;
	}

	.card-overlay {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0.18) 100%);
		border-radius: 24rpx;
	}

	.card-info-top {
		position: absolute;
		top: 36rpx;
		left: 36rpx;
		z-index: 2;
	}

	.card-tag {
		display: inline-block;
		margin-top: 12rpx;
		padding: 4rpx 20rpx;
		font-size: 22rpx;
		border-radius: 20rpx;
		line-height: 1.6;
	}

	.card-tag-success {
		color: #67c23a;
		background: rgba(103, 194, 58, 0.12);
	}

	.card-tag-error {
		color: #f56c6c;
		background: rgba(245, 108, 108, 0.12);
	}

	.card-tag-info {
		color: #909399;
		background: rgba(144, 147, 153, 0.12);
	}

	.card-info-bottom {
		position: absolute;
		bottom: 36rpx;
		left: 36rpx;
		z-index: 2;
	}

	.slide-indicator {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-top: 16rpx;
	}

	.indicator-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background-color: #d0d0d0;
		margin: 0 8rpx;
		transition: all 0.3s ease;
	}

	.indicator-dot-active {
		width: 32rpx;
		border-radius: 6rpx;
		background-color: #35a5ed;
	}

	.slide-hint {
		text-align: center;
		margin-top: 8rpx;
		padding-bottom: 4rpx;
	}

	.card-comm {
		align-items: center;
		border-radius: 20rpx;
		border: 3rpx solid #35a5ed;
		margin: 40rpx;
		padding: 30rpx 80rpx;
		background-color: #35a5ed20;
	}

	.card-text {
		margin: auto 40rpx;
		padding: 30rpx 30rpx;
		background-color: $u-bg-color;
	}

	.card-button {
		margin: 40rpx;
	}
</style>
