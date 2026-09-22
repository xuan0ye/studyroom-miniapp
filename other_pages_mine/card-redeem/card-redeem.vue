<template>
	<view>
		<my-navbar leftText="兑换码兑换" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<view class="container">
			<!-- 兑换区 -->
			<view class="card">
				<u-text :bold="true" size="32" text="输入兑换码领卡" />
				<view style="height: 10rpx;" />
				<u-text size="24" color="#999"
					text="输入门店发给你的兑换码，卡券会直接发到你的卡包（日卡/周卡/月卡等都能兑）；卡券有效期从首次预约使用起算，买来暂时不用不会过期" />
				<view style="height: 24rpx;" />
				<u-input v-model="code" placeholder="请输入兑换码（不区分大小写）" border="surround" maxlength="16"
					:clearable="true" />
				<view style="height: 24rpx;" />
				<u-button type="primary" color="#fe2c55" :loading="redeeming" text="立即兑换" @click="doRedeem" />
			</view>

			<!-- 我名下的兑换码 -->
			<view class="card" v-if="mine.length > 0">
				<u-text :bold="true" size="32" text="我名下的兑换码" />
				<view style="height: 8rpx;" />
				<u-text size="24" color="#999" text="可直接发给好友使用（购买双人套餐自动生成的码也会出现在这里）" />
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
				<u-text size="24" color="#888" text="1. 门店会把兑换码发给你（购买双人套餐时系统自动生成一个，可发给同行好友）；" />
				<view style="height: 6rpx;" />
				<u-text size="24" color="#888" text="2. 在「我的 → 兑换码兑换」输入兑换码，卡券立即发到你的卡包；" />
				<view style="height: 6rpx;" />
				<u-text size="24" color="#888" text="3. 兑换码有有效期（过期不能兑换），一码只能兑换一次，兑换后即失效；" />
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
