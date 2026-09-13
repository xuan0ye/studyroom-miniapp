<template>
	<view>
		<my-navbar leftText="我的积分" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<view class="container">
			<!-- 积分概览 -->
			<view class="points-header">
				<view style="text-align:center;">
					<u-text size="26" color="#888" text="当前积分" />
					<view style="margin-top: 10rpx;">
						<u-text :bold="true" size="72" color="#ff9900" :text="String(points)" />
					</view>
				</view>
				<view class="stat-row">
					<view class="stat-item">
						<u-text :bold="true" size="32" color="#333" :text="String(totalEarned)" />
						<u-text size="22" color="#999" text="累计获得" />
					</view>
					<view class="stat-item">
						<u-text :bold="true" size="32" color="#333" :text="String(totalSpent)" />
						<u-text size="22" color="#999" text="累计消耗" />
					</view>
				</view>
			</view>

			<!-- 积分说明 -->
			<view class="tip-card">
				<u-text :bold="true" size="28" color="#333" text="积分规则" />
				<view style="margin-top: 10rpx;">
					<u-text size="24" color="#666" text="· 每天到店开灯签到得100积分" />
				</view>
				<view style="margin-top: 6rpx;">
					<u-text size="24" color="#666" text="· 1000积分 = 1元，买卡时可抵扣" />
				</view>
				<view style="margin-top: 6rpx;">
					<u-text size="24" color="#666" text="· 好评截图联系客服审核后可补发积分" />
				</view>
			</view>

			<!-- 积分商城/补签入口 -->
			<view class="action-row">
				<view class="action-btn" @click="goExchange">
					<u-icon name="gift" color="#ff9900" size="44" />
					<view style="margin-left: 16rpx;">
						<u-text :bold="true" size="28" color="#333" text="积分商城" />
						<u-text size="22" color="#999" text="3000积分换日卡" />
					</view>
				</view>
				<view class="action-btn" @click="goRecover">
					<u-icon name="calendar" color="#35a5ed" size="44" />
					<view style="margin-left: 16rpx;">
						<u-text :bold="true" size="28" color="#333" text="补签申请" />
						<u-text size="22" color="#999" text="断签补签 · 客服审核" />
					</view>
				</view>
			</view>

			<!-- 积分流水 -->
			<view class="log-card">
				<u-text :bold="true" size="30" color="#333" text="积分明细" />
				<view v-if="logs.length > 0">
					<view v-for="item in logs" :key="item.id" class="log-item">
						<view style="flex:1;">
							<u-text size="26" color="#333" :text="item.remark || typeLabel(item.type)" />
							<u-text size="22" color="#999" :text="formatTime(item.createTime)" />
						</view>
						<u-text :bold="true" size="30" :color="item.changePoints > 0 ? '#ff9900' : '#999'"
							:text="(item.changePoints > 0 ? '+' : '') + item.changePoints" />
					</view>
				</view>
				<view v-else style="text-align:center;padding:40rpx 0;">
					<u-text size="26" color="#999" text="暂无积分记录，快去签到吧" />
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
				totalEarned: 0,
				totalSpent: 0,
				logs: []
			}
		},
		methods: {
			typeLabel(t) {
				if (t === 1) return '每日签到'
				if (t === 2) return '客服审核发放'
				if (t === 3) return '兑换消耗'
				if (t === 4) return '购卡抵扣'
				if (t === 5) return '退回'
				return '积分变动'
			},
			formatTime(t) {
				if (!t) return ''
				return String(t).replace('T', ' ').substring(0, 16)
			},
			goExchange() {
				uni.navigateTo({
					url: '/other_pages/points/exchange'
				})
			},
			goRecover() {
				uni.navigateTo({
					url: '/other_pages/points/recover'
				})
			},
			async load() {
				try {
					const { data: res } = await myPoints({}, { custom: { auth: true, catch: true } })
					this.points = Number(res && res.points != null ? res.points : 0)
					this.totalEarned = Number(res && res.totalEarned != null ? res.totalEarned : 0)
					this.totalSpent = Number(res && res.totalSpent != null ? res.totalSpent : 0)
					this.logs = (res && res.logs) || []
				} catch (e) {
					this.points = 0
					this.logs = []
				}
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

	.points-header {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 40rpx 30rpx;
		border: 2rpx solid #e5e5e5;
	}

	.stat-row {
		display: flex;
		justify-content: space-around;
		margin-top: 30rpx;
		border-top: 2rpx solid #f0f0f0;
		padding-top: 24rpx;
	}

	.stat-item {
		text-align: center;
	}

	.tip-card {
		background: #fff7e6;
		border-radius: 16rpx;
		padding: 20rpx 24rpx;
		margin-top: 30rpx;
	}

	.log-card {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 24rpx;
		margin-top: 30rpx;
		border: 2rpx solid #e5e5e5;
	}

	.action-row {
		display: flex;
		justify-content: space-between;
		margin-top: 30rpx;
	}

	.action-btn {
		flex: 1;
		background: #ffffff;
		border-radius: 20rpx;
		padding: 26rpx;
		display: flex;
		align-items: center;
		border: 2rpx solid #e5e5e5;
		margin-right: 20rpx;
	}

	.action-btn:last-child {
		margin-right: 0;
	}

	.log-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16rpx 0;
		border-bottom: 2rpx solid #f5f5f5;
	}
</style>
