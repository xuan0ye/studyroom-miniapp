<template>
	<view>
		<my-navbar leftText="双人卡兑换" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<view class="container">
			<!-- 兑换区 -->
			<view class="card">
				<u-text :bold="true" size="32" text="输入兑换码领卡" />
				<view style="height: 10rpx;" />
				<u-text size="24" color="#999"
					text="同伴购买「双人同行上岸卡」后会把兑换码发给你；输入兑换码，卡券会直接发到你的卡包" />
				<view style="height: 24rpx;" />
				<u-input v-model="code" placeholder="请输入兑换码（不区分大小写）" border="surround" maxlength="16"
					:clearable="true" />
				<view style="height: 24rpx;" />
				<u-button type="primary" color="#fe2c55" :loading="redeeming" text="立即兑换" @click="doRedeem" />
			</view>

			<!-- 我购买的兑换码 -->
			<view class="card" v-if="mine.length > 0">
				<u-text :bold="true" size="32" text="我购买的兑换码" />
				<view style="height: 8rpx;" />
				<u-text size="24" color="#999" text="把兑换码发给同行好友，好友用自己的微信号兑换后同样会得到一张卡" />
				<view v-for="(item, i) in mine" :key="i" class="code-item">
					<view class="code-head">
						<u-text :bold="true" size="42" color="#fe2c55" :text="item.code" />
						<u-tag :text="statusLabel(item.status)" :type="statusType(item.status)" size="mini" />
					</view>
					<view style="margin-top: 10rpx;">
						<u-text size="24" color="#666"
							:text="(item.cardTitle || '卡券') + '　有效期至 ' + fmtDate(item.expireTime)" />
					</view>
					<view style="margin-top: 8rpx;" v-if="item.status === 1">
						<u-text size="24" color="#19be6b"
							:text="'已由 ' + (item.usedByNickname || '好友') + ' 于 ' + fmtDate(item.usedTime) + ' 兑换'" />
					</view>
					<view style="margin-top: 8rpx;" v-if="item.status === 2">
						<u-text size="24" color="#c0c4cc" text="该兑换码已作废，如需重新发放请联系门店" />
					</view>
					<view style="margin-top: 20rpx;" v-if="item.status === 0">
						<u-button size="small" color="#35a5ed" plain text="复制兑换码" @click="copyCode(item.code)" />
					</view>
				</view>
			</view>

			<!-- 说明 -->
			<view class="card tip">
				<u-text :bold="true" size="28" color="#333" text="使用说明" />
				<view style="height: 10rpx;" />
				<u-text size="24" color="#888" text="1. 一人付全款购买双人套餐后，系统立即给购买者发卡，并生成 1 个兑换码；" />
				<view style="height: 6rpx;" />
				<u-text size="24" color="#888" text="2. 把兑换码发给同伴，同伴在「我的 → 双人卡兑换」输入即可领卡；" />
				<view style="height: 6rpx;" />
				<u-text size="24" color="#888" text="3. 兑换码自购买日起 30 天内有效，一人一码，兑换后即失效；" />
				<view style="height: 6rpx;" />
				<u-text size="24" color="#888" text="4. 不能兑换自己购买的码；已持有该卡且未过期的账号不能重复兑换。" />
			</view>
		</view>
	</view>
</template>

<script>
	import { myRedeemCodes, redeemCard } from '@/config/api.js'
	export default {
		data() {
			return {
				code: '',
				mine: [],
				redeeming: false
			}
		},
		methods: {
			statusLabel(status) {
				if (status === 1) return '已兑换'
				if (status === 2) return '已作废'
				return '待兑换'
			},
			statusType(status) {
				if (status === 1) return 'success'
				if (status === 2) return 'info'
				return 'warning'
			},
			fmtDate(t) {
				if (!t) return '-'
				return String(t).substring(0, 10)
			},
			async loadMine() {
				try {
					const res = await myRedeemCodes({ custom: { auth: true, catch: true, toast: false } })
					const list = (res && res.data) ? res.data : []
					this.mine = list || []
				} catch (e) {
					this.mine = []
				}
			},
			async doRedeem() {
				const c = (this.code || '').trim()
				if (!c) {
					uni.$u.toast('请输入兑换码')
					return
				}
				this.redeeming = true
				try {
					const res = await redeemCard({ code: c }, { custom: { auth: true, catch: true } })
					const inner = res && res.data ? res.data : res
					if (inner && inner.success === false) {
						uni.$u.toast(inner.msg || '兑换失败')
					} else {
						this.code = ''
						uni.showModal({
							title: '兑换成功',
							content: (inner && inner.msg) || '卡券已发放到你的卡包',
							showCancel: false,
							confirmText: '知道了'
						})
						this.loadMine()
					}
				} catch (e) {
					uni.$u.toast((e && e.msg) || '兑换失败，请稍后重试')
				} finally {
					this.redeeming = false
				}
			},
			copyCode(code) {
				uni.setClipboardData({
					data: code,
					success() {
						uni.$u.toast('兑换码已复制，发给同伴即可')
					}
				})
			}
		},
		onShow() {
			this.loadMine()
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		padding: 30rpx;
	}

	.card {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 24rpx;
	}

	.code-item {
		margin-top: 24rpx;
		padding-top: 24rpx;
		border-top: 2rpx solid #f5f5f5;
	}

	.code-head {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.tip {
		background: #fafafa;
	}
</style>
