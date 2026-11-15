<template>
	<view class="gift-page">
		<my-navbar title="领取卡券" leftIcon="arrow-left" bgColor="#fff7f3" />
		<view class="gift-body">
			<view class="ticket">
				<view class="ticket-brand">
					<u-icon name="gift-fill" size="36" color="#ffe4d5" />
					<text>答岸自习室</text>
				</view>
				<text class="ticket-title">{{ gift.cardTitle || '赠送卡券' }}</text>
				<text v-if="gift.state === 'READY'" class="ticket-expiry">{{ gift.expiresAt }} 前领取</text>
			</view>

			<view class="gift-action">
				<text class="gift-status">{{ heading }}</text>
				<text v-if="description" class="gift-description">{{ description }}</text>
				<button v-if="gift.state === 'READY'" class="gift-button" :loading="busy" :disabled="busy" @click="claim">
					领取卡券
				</button>
				<button v-else-if="gift.state === 'CLAIMED_BY_YOU'" class="gift-button" @click="openCardPackage">
					查看卡包
				</button>
				<button v-else-if="gift.state === 'ERROR'" class="gift-button" @click="loadGift">
					重试
				</button>
				<button v-else-if="gift.state !== 'LOADING'" class="gift-button secondary" @click="goHome">
					返回首页
				</button>
			</view>
		</view>
	</view>
</template>

<script>
	import { previewCardGift, claimCardGift } from '@/config/api.js'

	const requestOptions = { custom: { auth: true, catch: true, toast: false } }
	const headings = {
		LOADING: '正在加载卡券',
		READY: '门店送你一张卡券',
		CLAIMED_BY_YOU: '领取成功',
		CLAIMED: '这张卡券已被领取',
		REVOKED: '这条领取链接已撤回',
		EXPIRED: '这条领取链接已过期',
		INVALID: '这条领取链接无效',
		ERROR: '暂时无法打开卡券'
	}

	export default {
		data() {
			return {
				token: '',
				gift: { state: 'LOADING' },
				busy: false,
				error: ''
			}
		},
		computed: {
			heading() {
				return headings[this.gift.state]
			},
			description() {
				if (this.error) return this.error
				if (this.gift.state === 'CLAIMED_BY_YOU') return '卡券已放入你的卡包'
				if (['REVOKED', 'EXPIRED', 'INVALID'].includes(this.gift.state)) return '如需领取，请联系门店'
				return ''
			}
		},
		onLoad(options) {
			this.token = (options && options.gift) || ''
			this.loadGift()
		},
		onShareAppMessage() {
			return {
				title: this.gift.cardTitle ? '答岸自习室送你一张' + this.gift.cardTitle : '领取答岸自习室卡券',
				path: '/other_pages_mine/card-gift/card-gift?gift=' + encodeURIComponent(this.token)
			}
		},
		methods: {
			async loadGift() {
				this.error = ''
				if (!/^[a-f0-9]{32}$/.test(this.token)) {
					this.gift = { state: 'INVALID' }
					return
				}
				this.gift = { state: 'LOADING' }
				try {
					const { data } = await previewCardGift({ gift: this.token }, requestOptions)
					this.gift = data
				} catch (err) {
					this.gift = { state: 'ERROR' }
					this.error = (err && err.msg) || '请稍后重试'
				}
			},
			async claim() {
				if (this.busy || this.gift.state !== 'READY') return
				this.busy = true
				this.error = ''
				try {
					const { data } = await claimCardGift({ gift: this.token }, requestOptions)
					this.gift = data
				} catch (err) {
					this.error = (err && err.msg) || '领取失败，请重试'
				} finally {
					this.busy = false
				}
			},
			openCardPackage() {
				uni.redirectTo({ url: '/other_pages_mine/card_package/card_package' })
			},
			goHome() {
				uni.switchTab({ url: '/pages/index/index' })
			}
		}
	}
</script>

<style lang="scss" scoped>
	.gift-page {
		min-height: 100vh;
		color: #302120;
		background: #fff7f3;
	}

	.gift-body {
		max-width: 660rpx;
		margin: 0 auto;
		padding: 64rpx 44rpx 60rpx;
	}

	.ticket {
		min-height: 200rpx;
		padding: 36rpx 36rpx 40rpx;
		display: flex;
		flex-direction: column;
		justify-content: center;
		border-radius: 30rpx;
		color: #fff8f4;
		background: linear-gradient(135deg, #a43545 0%, #711c31 100%);
		box-shadow: 0 18rpx 48rpx rgba(113, 28, 49, .17);
	}

	.ticket-brand {
		display: flex;
		align-items: center;
		gap: 12rpx;
		color: #ffe4d5;
		font-size: 26rpx;
	}

	.ticket-title {
		margin-top: 18rpx;
		font-size: 56rpx;
		line-height: 1.25;
		font-weight: 700;
		word-break: break-word;
	}

	.ticket-expiry {
		margin-top: 26rpx;
		border-top: 1rpx dashed rgba(255, 228, 213, .55);
		padding-top: 20rpx;
		font-size: 24rpx;
		color: #ffe4d5;
	}

	.gift-action {
		padding-top: 50rpx;
		text-align: center;
	}

	.gift-status, .gift-description {
		display: block;
	}

	.gift-status {
		font-size: 37rpx;
		line-height: 1.4;
		font-weight: 700;
	}

	.gift-description {
		margin-top: 12rpx;
		font-size: 28rpx;
		line-height: 1.5;
		color: #735953;
	}

	.gift-button {
		margin-top: 42rpx;
		border-radius: 16rpx;
		background: #922d42;
		color: #fff;
		font-size: 30rpx;
		font-weight: 600;
		line-height: 90rpx;
	}

	.gift-button::after {
		border: 0;
	}

	.gift-button[disabled] {
		opacity: .72;
		background: #922d42;
		color: #fff;
	}

	.secondary {
		background: #f0e3de;
		color: #633d3b;
	}
</style>