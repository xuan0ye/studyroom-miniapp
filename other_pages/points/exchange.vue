<template>
	<view>
		<my-navbar leftText="积分商城" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<view class="container">
			<!-- 顶部积分 -->
			<view class="balance-bar">
				<u-text size="26" color="#888" text="我的积分" />
				<u-text :bold="true" size="48" color="#ff9900" :text="String(points)" />
			</view>

			<!-- 可兑换商品 -->
			<view class="goods-card">
				<view style="display:flex;align-items:center;">
					<u-icon name="https://api.dayousuoan.top/upload/appstatic/package/card.png" size="90" />
					<view style="margin-left: 24rpx;flex:1;">
						<u-text :bold="true" size="32" color="#333" text="日卡 1 张" />
						<u-text size="24" color="#999" text="兑换后当天起生效，可使用1天" />
					</view>
					<view style="text-align:right;">
						<u-text :bold="true" size="30" color="#ff9900" text="3000 积分" />
						<view style="margin-top: 10rpx;">
							<u-button size="mini" type="warning" :loading="exchanging" :disabled="points < 3000"
								@click="exchange" text="兑换" />
						</view>
					</view>
				</view>
			</view>

			<!-- 兑换说明 -->
			<view class="tip-card">
				<u-text :bold="true" size="28" color="#333" text="兑换说明" />
				<view style="margin-top: 10rpx;">
					<u-text size="24" color="#666" text="· 3000积分可兑换1张日卡" />
				</view>
				<view style="margin-top: 6rpx;">
					<u-text size="24" color="#666" text="· 积分通过每日签到获得，连续签到积分递增" />
				</view>
				<view style="margin-top: 6rpx;">
					<u-text size="24" color="#666" text="· 兑换后日卡即时到账，在'我的会员卡'中查看" />
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { myPoints } from '@/config/api.js'
	export default {
		data() {
			return {
				points: 0,
				exchanging: false
			}
		},
		methods: {
			async load() {
				try {
					const { data: res } = await myPoints({}, { custom: { auth: true, catch: true } })
					this.points = Number(res && res.points != null ? res.points : 0)
				} catch (e) {
					this.points = 0
				}
			},
			async exchange() {
				var that = this
				uni.showModal({
					title: '确认兑换',
					content: '消耗 3000 积分兑换 1 张日卡？',
					confirmText: '兑换',
					confirmColor: '#e6a23c',
					success: async (res) => {
						if (!res.confirm) return
						that.exchanging = true
						try {
							await uni.$u.http.post('/api/wx/points/exchange/daycard', {}, {
								custom: { auth: true, catch: true }
							})
							uni.showModal({
								title: '兑换成功',
								content: '日卡已发放到你的卡包，可在"我的会员卡"查看',
								showCancel: false,
								confirmText: '知道了',
								success: () => {
									that.load()
								}
							})
						} catch (e) {
							uni.$u.toast((e && e.msg) || '兑换失败，请稍后再试')
						} finally {
							that.exchanging = false
						}
					}
				})
			}
		},
		onShow() {
			this.load()
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		padding: 30rpx;
	}

	.balance-bar {
		background: linear-gradient(135deg, #fff7e6, #fff1cc);
		border-radius: 20rpx;
		padding: 30rpx;
		text-align: center;
		border: 2rpx solid #ffe0a3;
	}

	.goods-card {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-top: 30rpx;
		border: 2rpx solid #e5e5e5;
	}

	.tip-card {
		background: #f7f7f7;
		border-radius: 16rpx;
		padding: 20rpx 24rpx;
		margin-top: 30rpx;
	}
</style>
