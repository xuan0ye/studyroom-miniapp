<template>
	<view>
		<my-navbar leftText="会员开卡" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<!-- 卡片轮播区域 -->
		<view>
			<view class="uni-margin-wrap">
				<swiper class="swiper" :next-margin="next+'rpx'" :previous-margin="previous+'rpx'"
					:indicator-dots="false" :autoplay="autoplay" :interval="interval" :duration="duration"
					@change="change">
					<swiper-item v-for="(item,index) in list" :key="index">
						<view class="swiper-item" :style="{ backgroundImage: 'url(' + getCardBg(item, index) + ')' }">
							<view class="card-overlay"></view>
							<view class="card-info-top">
								<u-text :bold="true" size="40" color="#3d3d3d" :text="item.cardTitle" />
								<view style="margin-top: 12rpx;">
									<u-tag :text="getCardTag(item)" type="primary" size="mini" shape="circle" />
								</view>
							</view>
							<view class="card-info-bottom">
								<view class="card-price">
									<u-text :bold="true" size="48" color="#2f8fe0" :text="'¥' + item.price" />
									<u-text size="24" color="#4d4d4d" :text="'/' + item.frequency + '天'" />
								</view>
								<view class="card-validity">
									<u-text size="22" color="#4d4d4d" :text="'购买后' + item.term + '天内有效'" />
								</view>
							</view>
						</view>
					</swiper-item>
				</swiper>
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
				</view>
			</view>
			<view class="card-text">
				<u-text :bold="false" size="30" color="#303133" :text="card.cardTitle" align="left" />
				<view style="display: flex;justify-content: space-between;align-items: center;margin-top: 20rpx;">
					<view style="display: flex;justify-content: flex-start; align-items: center;">
						<u-icon name="https://api.dayousuoan.top/upload/appstatic/package/card.png" size="60"></u-icon>
						<view style="margin-left: 30rpx;margin-top: 10rpx;">
							<u-text :bold="false" size="22" color="#868686" :text="'购买后'+card.term+'天内有效'"
								align="center" />
						</view>
					</view>
					<view>
						<u-text :bold="false" size="30" color="#303133" text="1张" align="left" />
					</view>
				</view>
			</view>
			<view style="height: 20rpx;"></view>
		</view>
		<!-- 抵扣区域 -->
		<view style="margin-top: 20rpx;background-color: #ffffff;padding: 30rpx;">
			<view style="display:flex;justify-content:space-between;align-items:center;">
				<u-text :bold="true" size="30" color="#303133" text="余额抵扣" />
				<u-text size="26" color="#666" :text="'可用余额 ' + balance + ' 点'" />
			</view>
			<view style="margin-top: 16rpx;display:flex;align-items:center;">
				<u-input v-model="balanceDeduct" type="number" placeholder="输入抵扣金额(1点=1元)" :border="true" />
				<view style="margin-left: 20rpx;">
					<u-button size="mini" type="primary" plain text="全部抵扣" @click="useAllBalance" />
				</view>
			</view>
			<view style="margin-top: 20rpx;display:flex;justify-content:space-between;align-items:center;">
				<u-text :bold="true" size="30" color="#303133" text="积分抵扣" />
				<u-text size="26" color="#666" :text="'可用积分 ' + points + ' (1000积分=1元)'" />
			</view>
			<view style="margin-top: 16rpx;">
				<u-input v-model="pointsCost" type="number" placeholder="输入抵扣积分(1000积分抵1元)" :border="true" />
			</view>
			<view style="margin-top: 24rpx;background:#fff7e6;border-radius:12rpx;padding:16rpx 20rpx;">
				<u-text size="26" color="#e6a23c" :text="'卡价 ￥' + (card.price || 0) + '，抵扣后需付 ￥' + calcCash()" />
			</view>
		</view>
		<!-- 底部按钮区域 -->
		<view class="card-button">
			<u-button text="确定支付" size="large" type="primary" @click="pay"></u-button>
		</view>
	</view>
</template>

<script>
	import {
		cardList,
		payCard,
		queryOrder,
		getBalance,
		myPoints
	} from '@/config/api.js'
	export default {
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
				list: [],
				currentIndex: 0,
				showSlideHint: true,
				cardBgs: [
					'/static/index/card-day.jpg',
					'/static/index/card-week.jpg',
					'/static/index/card-month.jpg',
					'/static/index/card-year.jpg'
				],
				tabs: [{
					name: '卡券内容'
				}],
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
				},
				balance: 0,
				points: 0,
				balanceDeduct: '',
				pointsCost: ''
			}
		},
		methods: {
			change(e) {
				var current = e.detail.current
				const that = this
				this.card = this.list[current]
				this.currentIndex = current
				this.showSlideHint = false
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
				var freq = item.frequency || 0
				if (freq <= 1) return this.cardBgs[0]
				if (freq <= 7) return this.cardBgs[1]
				if (freq <= 30) return this.cardBgs[2]
				return this.cardBgs[3]
			},
			getCardTag(item) {
				var freq = item.frequency || 0
				if (freq <= 1) return '体验推荐'
				if (freq <= 7) return '备考首选'
				if (freq <= 30) return '热门选择'
				if (freq <= 90) return '季卡专享'
				return '极致性价比'
			},
			tabsClick(index) {
				console.log(index)
			},
			useAllBalance() {
				var price = Number(this.card.price || 0)
				this.balanceDeduct = String(Math.min(price, this.balance))
			},
			calcCash() {
				var price = Number(this.card.price || 0)
				var bd = Number(this.balanceDeduct || 0)
				var pd = Math.floor(Number(this.pointsCost || 0) / 1000)
				var cash = price - bd - pd
				return Math.max(0, cash).toFixed(2)
			},
			async pay() {
				const that = this
				console.info(this.card)
				const isLogin = uni.getStorageSync('isLogin')
				if (isLogin !== true) {
					uni.$u.toast('请先登录')
					return
				}
				var bd = Number(this.balanceDeduct || 0)
				var pc = Number(this.pointsCost || 0)
				if (bd > 0 && bd > this.balance) {
					uni.$u.toast('余额不足')
					return
				}
				var pd = Math.floor(pc / 1000)
				if (pc > 0 && pc > this.points) {
					uni.$u.toast('积分不足')
					return
				}
				if (bd + pd > Number(this.card.price || 0)) {
					uni.$u.toast('抵扣金额不能超过卡价')
					return
				}
				const params = {
					// 线上使用真实卡价，避免继续走测试金额
					amountTotal: this.card.price,
					cardId: this.card.id,
					description: this.card.cardTitle,
					balanceAmount: bd > 0 ? bd : undefined,
					pointsCost: pc > 0 ? pc : undefined
				}
				try {
					const {
						data: res
					} = await payCard(params, {
						custom: {
							auth: true
						}
					})
					// 全额抵扣: 后端直接发卡成功, 无需微信支付
					if (res && res.payType === 'balance' && res.payStatus === 1) {
						uni.showToast({
							icon: 'success',
							title: '购买成功'
						})
						setTimeout(() => {
							uni.reLaunch({
								url: '/pages/mine/mine'
							})
						}, 600)
						return
					}
					uni.showLoading({
						title: '正在支付'
					})
					uni.requestPayment({
						provider: 'wxpay',
						timeStamp: res.timeStamp,
						nonceStr: res.nonceStr,
						package: res.packageValue,
						signType: res.signType,
						paySign: res.paySign,
						success() {
							uni.showToast({
								icon: 'success',
								title: '支付成功'
							})
						},
						fail(err) {
							// 用户取消支付时不误报系统错误
							const cancel = err && err.errMsg && err.errMsg.indexOf('cancel') > -1
							uni.$u.toast(cancel ? '已取消支付' : '支付失败，请重试')
						},
						complete() {
							uni.hideLoading()
							if (res.orderId) {
								that.pollOrder(res.orderId)
							}
						}
					})
				} catch (err) {
					uni.hideLoading()
					uni.$u.toast(err?.msg || '下单失败，请稍后重试')
				}
			},
			async pollOrder(orderId) {
				let tries = 0
				const timer = setInterval(async () => {
					tries++
					try {
						const {
							data: r
						} = await queryOrder(orderId, {
							custom: {
								auth: true
							}
						})
						if (r === '已支付') {
							clearInterval(timer)
							uni.showToast({
								icon: 'success',
								title: '购买成功'
							})
							return
						}
					} catch (e) {
						console.log('查询订单状态失败', e)
					}
					if (tries >= 8) {
						clearInterval(timer)
					}
				}, 1500)
			},
			async getCardList() {
				const {
					data: res
				} = await cardList()
				console.log('获取优惠卡列表', res)
				this.list = res
				if (res.length > 0) {
					this.card = res[0]
				}
			},
			async loadWallet() {
				try {
					const { data: b } = await getBalance({}, { custom: { auth: true, catch: true } })
					this.balance = Number(b && b.balance != null ? b.balance : 0)
				} catch (e) { this.balance = 0 }
				try {
					const { data: p } = await myPoints({}, { custom: { auth: true, catch: true } })
					this.points = Number(p && p.points != null ? p.points : 0)
				} catch (e) { this.points = 0 }
			}
		},
		onLoad() {
			this.getCardList()
			this.loadWallet()
			console.log(this.card)
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
		background-size: cover;
		background-position: right center;
		border-radius: 24rpx;
		margin-left: 20rpx;
		overflow: hidden;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
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

	.card-info-bottom {
		position: absolute;
		bottom: 36rpx;
		left: 36rpx;
		z-index: 2;
	}

	.card-price {
		display: flex;
		align-items: baseline;
	}

	.card-validity {
		margin-top: 4rpx;
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
