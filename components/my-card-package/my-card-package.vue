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
						<u-text :bold="true" size="40" color="#3d3d3d" :text="(item.card && item.card.cardTitle) || '会员卡'" />
						<view :class="'card-tag card-tag-' + statusType">{{ statusLabel }}</view>
							</view>
							<view class="card-info-bottom">
								<u-text size="24" color="#4d4d4d" :text="cardBottomText(item)" />
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
								<u-text :bold="true" size="28" color="#35a5ed" :text="cardDaysText" align="center" />
							</view>
							<view style="display: flex;flex-direction: column;">
								<u-icon name="https://api.dayousuoan.top/upload/appstatic/package/seat.png" size="100"></u-icon>
								<my-seat-area :areaNum="currentCard.usable" :cardType="currentCard.cardType"></my-seat-area>
							</view>
						</view>
						<!-- 剩余可用天数 / 剩余请假次数 -->
						<view class="card-summary">
							<u-text size="24" color="#666" :text="remainText" align="center" />
							<u-text v-if="isLongTerm" size="24" color="#666" :text="leaveText" align="center" />
						</view>
						<view style="margin-top: 20rpx; text-align: center;">
							<!-- 停卡后剩余天数还在 => 仍可继续预约续用, 不能显示成"已使用"把入口堵死 -->
							<u-button v-if="!expired" color="#35a5ed" size="medium"
								:text="isTimed && consumed ? '查看预约时段' : (consumed ? '继续预约（续用剩余天数）' : '去预约')" @click="goBook" />
							<u-button v-else type="info" size="medium" plain text="已用完" disabled />
							<!-- 锁座状态: 周期卡与长期卡都要能看到锁到什么时候。
							     原条件 `!consumed` 有误 —— 预约会写入消费记录使 consumed=true,
							     于是"锁座中"这个状态反而把按钮整块隐藏, 用户永远点不到请假 -->
							<view v-if="lockState.locked" style="margin-top: 16rpx;">
								<u-text size="24" color="#e6a23c" :text="lockState.label" />
								<!-- 周期卡(周卡/双周卡, 7<=term<30): 释放座位后可重新预约, 不消耗请假次数 -->
								<view v-if="isCycleCard" style="margin-top: 10rpx;">
									<u-button type="error" plain size="small" shape="circle" :loading="unlocking"
										text="取消锁座（可重新预约）" @click="doUnlock" />
								</view>
							</view>
							<!-- 月卡/季卡等长期卡(term>=30): 唯一停卡入口, 消耗请假次数。
							     未锁座时按钮置灰并提示"卡正在使用时才能请假" -->
							<view v-if="isLongTerm && !expired" style="margin-top: 16rpx;">
								<u-button type="warning" plain size="small" shape="circle" :loading="leaving"
									:disabled="!canLeave" text="请假停卡" @click="doLeave" />
								<view style="margin-top: 10rpx;">
									<u-text size="22" color="#999" :text="leaveHint" align="center" />
								</view>
							</view>
						</view>
					</view>
				</view>

			</view>
	</view>
</template>

<script>
	import { cardWindowText, cardWindow, cardRemainDays, cardLeaveInfo, isLongTermCard, isCycleCard, isCardExpired, isTimedCard, isTrialCard } from '@/utils/card-usable.js'
	import { cardLeave, cardUnlock } from '@/config/api.js'
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
				}
			}
		},
		computed: {
			isTimed() { return isTimedCard(this.current) },
			// 当前 swiper 对应的卡(组件没有 onLoad 生命周期, 必须走 computed 才能拿到卡面信息)
			current() {
				return (this.list && this.list.length) ? (this.list[this.currentIndex] || this.list[0]) : {}
			},
			// 当前卡的卡种定义(缺失时兜底空对象, 避免渲染报错)
			currentCard() {
				return this.current && this.current.card ? this.current.card : {}
			},
			consumed() {
				return !!(this.current && this.current.consumed)
			},
			// 当前卡是否已用完/已过期(长期卡按"剩余天数"模型判断, 见 utils/card-usable.js)
			expired() {
				return isCardExpired(this.current)
			},
			// 卡面天数: 优先剩余天数(停卡冻结后更准确)
			cardDaysText() {
				if (this.isTimed) return this.currentCard.bookingHours + '小时 / 次'
				var d = cardRemainDays(this.current)
				if (d > 0) return d + '天'
				return ((this.currentCard.frequency != null ? this.currentCard.frequency : 0)) + '天'
			},
			// 是否为长期卡(月卡/季卡等): 只有这类卡能请假停卡
			isLongTerm() {
				return isLongTermCard(this.current)
			},
			// 是否为周期卡(周卡/双周卡, 7<=term<30): 不可请假, 只能"取消锁座"释放座位重新预约
			isCycleCard() {
				return isCycleCard(this.current)
			},
			// 剩余可用天数文案
			remainText() {
				if (isTrialCard(this.current)) return this.consumed ? '已预约；首次成功开灯后连续计时2小时' : '新人赠送 · 首次成功开灯起连续2小时'
				if (this.isTimed) return this.consumed ? '已预约，具体起止时间请查看预约记录' : ((this.currentCard.entryStartHour || 0) + ':00后开始，连续' + this.currentCard.bookingHours + '小时，可跨零点')
				var d = cardRemainDays(this.current)
				if (this.current && this.current.consumed) return '剩余可用 ' + d + ' 天'
				return '共 ' + d + ' 天可用（首次预约后开始计算）'
			},
			// 请假次数信息
			leaveInfo() {
				return cardLeaveInfo(this.current)
			},
			leaveText() {
				return '请假 ' + this.leaveInfo.used + '/' + this.leaveInfo.quota + ' 次（还可请假 '
					+ this.leaveInfo.left + ' 次）'
			},
			// 请假按钮是否可点: 卡在使用中(已锁座) 且 还有请假次数
			canLeave() {
				return !!(this.isLongTerm && this.lockState.locked && this.leaveInfo.left > 0)
			},
			// 请假按钮下方提示
			leaveHint() {
				if (!this.isLongTerm) return ''
				if (this.leaveInfo.left <= 0) {
					return '请假次数已用完（共 ' + this.leaveInfo.quota + ' 次），如需追加请联系门店客服'
				}
				if (!this.lockState.locked) {
					return '卡正在使用时才能请假（释放座位并冻结剩余天数）'
				}
				return '每张卡可请假 ' + this.leaveInfo.quota + ' 次，剩余 ' + this.leaveInfo.left
					+ ' 次；请假后座位释放、剩余天数顺延'
			},
			// 卡状态标签: 使用中 > 已用完 > 已停卡 > 待使用(买来还没用过) > 可用
			statusLabel() {
				if (this.isTimed) return this.expired ? '已用完' : (this.consumed ? '已预约' : '待使用')
				if (this.lockState.locked) return '使用中'
				if (this.expired) return '已用完'
				if (this.consumed) return '已停卡'
				if (!this.current.expiryTime) return '待使用'
				return '可用'
			},
			statusType() {
				if (this.lockState.locked) return 'warning'
				if (this.expired) return 'info'
				if (this.consumed) return 'error'
				if (!this.current.expiryTime) return 'success'
				return 'success'
			},
			// 当前卡锁座状态: 周卡/月卡锁座中显示
			lockState() {
				var cur = this.current
				if (!cur || !cur.lockSeatId || !cur.lockEndTime) {
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
			// 固定区间卡(如中秋国庆畅享券): 显示使用区间, 其它卡返回空(走原有"待使用/有效期至"文案)
			windowText(item) {
				if (!item) return ''
				var w = cardWindow(item)
				if (!w) return ''
				var txt = cardWindowText(item)
				if (w.start && new Date() < w.start) return '使用期 ' + txt + '（即将开始）'
				return '使用期 ' + txt
			},
			// 卡面底部文案: 固定区间卡 > 已停卡(剩余天数) > 有效期至 > 待使用
			cardBottomText(item) {
				if (!item) return ''
				if (isTrialCard(item)) return '单人单次 · 开灯起2小时 · 到期关灯并取消体验权限'
				if (isTimedCard(item)) return item.consumed ? ('预约结束于 ' + item.expiryTime) : ('单人单次 · 连续' + item.card.bookingHours + '小时 · 不可拆分')
				var w = this.windowText(item)
				if (w) return w
				// 长期卡请假/停卡后 expiryTime 已过期但天数还在, 别再显示"有效期至 <过去日期>"
				if (isLongTermCard(item) && item.consumed && !item.lockSeatId) {
					var d = cardRemainDays(item)
					if (d > 0) return '已停卡 · 剩余 ' + d + ' 天，可再选日期续用'
				}
				if (item.expiryTime) return '有效期至 ' + String(item.expiryTime).slice(0, 10)
				return '待使用 · 首次预约后 ' + ((item.card && item.card.term) ? item.card.term : 1) + ' 天有效'
			},
			change(e) {
				var current = e.detail.current
				this.currentIndex = current
				this.showSlideHint = false
				const that = this
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
				if (this.isTimed) {
					uni.navigateTo({ url: this.consumed ? '/other_pages_mine/my_bookings/my_bookings' :
						'/other_pages/timed-booking/timed-booking?cardUserId=' + this.current.id + (isTrialCard(this.current) ? '&trial=1' : '') })
					return
				}
				uni.switchTab({
					url: '/pages/order/order'
				})
			},
			doLeave() {
				var that = this
				// 当前 swiper 对应 list 中的卡, 用其 id 作为 cardUserId
				var cur = this.current
				if (!cur || !cur.id) {
					uni.$u.toast('请先选择要请假的卡')
					return
				}
				if (!this.isLongTerm) {
					uni.$u.toast('仅月卡/季卡等长期卡支持请假')
					return
				}
				if (!this.leaveInfo.canLeave) {
					uni.$u.toast('该卡请假次数已用完（共 ' + this.leaveInfo.quota + ' 次），请联系门店客服追加')
					return
				}
				if (!this.lockState.locked) {
					uni.$u.toast('该卡当前没有正在使用的座位，无需请假')
					return
				}
				uni.showModal({
					title: '请假停卡',
					content: '请假后将释放当前锁定的座位，剩余天数冻结后可再选日期续用。'
						+ '该卡还可请假 ' + this.leaveInfo.left + ' 次（共 ' + this.leaveInfo.quota + ' 次）。确定请假？',
					confirmText: '请假',
					confirmColor: '#e6a23c',
					success: (res) => {
						if (!res.confirm) return
						that.leaving = true
						cardLeave({ cardUserId: cur.id }, { custom: { auth: true, catch: true } })
							.then((r) => {
								// R.ok(msg) 时 data 是字符串消息
								const msg = (typeof r.data === 'string' && r.data) || (r && r.msg) || '已释放座位，剩余天数已冻结'
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
				var cur = this.current
				if (!cur || !cur.id) {
					uni.$u.toast('请先选择要取消锁座的卡')
					return
				}
				// 长期卡的取消锁座与请假对后端完全等价(都会冻结剩余天数),
				// 若同时开放则请假次数可无限绕过 => 长期卡只允许走请假(后端同样会拦截)
				if (this.isLongTerm) {
					uni.$u.toast('月卡/季卡等长期卡请使用「请假停卡」')
					return
				}
				uni.showModal({
					title: '取消锁座',
					content: '取消后当前锁定的座位将释放，可重新预约其他座位（不消耗请假次数，剩余天数保持不变）。确定取消锁座？',
					confirmText: '取消锁座',
					confirmColor: '#e64340',
					success: (res) => {
						if (!res.confirm) return
						that.unlocking = true
						cardUnlock({ cardUserId: cur.id }, { custom: { auth: true, catch: true } })
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
		watch: {
			// 卡列表刷新后回到第一张, 避免停留在已失效的下标
			list() {
				if (this.currentIndex > 0 && (!this.list || this.currentIndex >= this.list.length)) {
					this.currentIndex = 0
				}
			}
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

	.card-tag-warning {
		color: #e6a23c;
		background: rgba(230, 162, 60, 0.14);
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

	.card-summary {
		margin-top: 20rpx;
		padding-top: 16rpx;
		border-top: 2rpx dashed #cfe6f7;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.card-button {
		margin: 40rpx;
	}
</style>
