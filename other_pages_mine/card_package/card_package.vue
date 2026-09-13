<template>
	<view>
		<my-navbar leftText="我的会员卡" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<my-card-package :list="list" v-if="total>0" @refresh="getCard"></my-card-package>
		<view v-else>
			<view style="margin: auto 40rpx;">
				<view style="margin-top: 40rpx;">
					<view>
						<u-text :bold="false" size="28" color="#b8b8b8" text="我的会员卡" align="left" />
					</view>
					<view style="margin-top: 40rpx;display: flex ;justify-content: center;">
						<image src="https://api.dayousuoan.top/upload/appstatic/other_pages_mine/static/card_package.png" mode="aspectFit"></image>
					</view>
					<view style="margin-top: 40rpx;">
						<u-text :bold="true" size="28" color="#9a9a9a" text="暂无可用会员卡" align="center" />
					</view>
					<view style="margin-top: 20rpx;padding: 0 60rpx;">
						<u-text :bold="false" size="24" color="#b8b8b8"
							text="已使用或已过期的卡片，可在「我的 → 学习记录 / 预约记录」中查看" align="center" />
					</view>
				</view>
			</view>
			<view class="foot-button">
				<view>
					<u-button color="#35a5ed" size="large" @click="toCard" text="去购买会员卡"></u-button>
				</view>
			</view>
		</view>

	</view>
</template>

<script>
	import { getMyCard } from '@/config/api.js'
	export default {
		data() {
			return {
				total: 0,
				list: []
			}
		},
		methods: {
			toCard() {
				uni.navigateTo({
					url: "/other_pages/recharge-card/recharge-card"
				})
			},
			async getCard() {
				try {
					const { data: card } = await getMyCard({}, { custom: { auth: true, catch: true } })
					// 卡包只展示"未使用且未过期"的可用卡; 已使用/已过期的卡不在卡包展示,
					// 相关使用明细可到「我的 → 学习记录 / 预约记录」查看
					var now = new Date()
					var usable = (card || []).filter(function(c) {
						if (!c || !c.expiryTime || c.consumed) return false
						return new Date(String(c.expiryTime).replace(/-/g, '/')) > now
					})
					this.list = usable
					this.total = this.list.length
				} catch (e) {
					console.error('加载我的卡失败', e)
					this.list = []
					this.total = 0
				}
			}
		},
		onShow() {
			this.getCard()
		}
	}
</script>

<style lang="scss">
	.foot-button {
		margin-top: 40rpx;
		padding: 40rpx;
	}
</style>
