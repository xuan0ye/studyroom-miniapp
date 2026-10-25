<template>
	<view class="seat-occupant-wrap">
		<view class="seat-occupant" :class="{ 'seat-occupant--detail': detail }" role="img"
			:aria-label="seatNum + '号座位，已预约'">
			<image v-if="avatar && !avatarFailed" :src="avatar" class="seat-occupant__photo"
				mode="aspectFill" @error="onAvatarError"></image>
			<image v-else src="/other_pages/static/daan-study-mascot.png" class="seat-occupant__figure"
				mode="aspectFit"></image>
			<view class="seat-occupant__number" aria-hidden="true">{{ seatNum }}</view>
		</view>
		<text v-if="detail && (!avatar || avatarFailed)" class="seat-occupant__brand">答岸 · 学习伙伴</text>
	</view>
</template>

<script>
	export default {
		props: {
			avatar: { type: String, default: '' },
			seatNum: { type: [String, Number], required: true },
			detail: { type: Boolean, default: false }
		},
		data() {
			return { avatarFailed: false }
		},
		watch: {
			avatar() {
				this.avatarFailed = false
			}
		},
		methods: {
			onAvatarError() {
				this.avatarFailed = true
			}
		}
	}
</script>

<style scoped>
	.seat-occupant-wrap {
		/* 点击由外层座位区域处理，头像和编号不扩大相邻座位的点击范围。 */
		pointer-events: none;
		display: flex;
		flex-direction: column;
		align-items: center;
		flex-shrink: 0;
	}
	.seat-occupant__brand {
		margin-top: 12rpx;
		color: #6c8da8;
		font-size: 20rpx;
		line-height: 28rpx;
		white-space: nowrap;
	}
	.seat-occupant {
		position: relative;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 48rpx;
		height: 48rpx;
		box-sizing: border-box;
		border: 2rpx solid #ffffff;
		border-radius: 50%;
		background: linear-gradient(145deg, #f3faff, #d9ebf8);
		box-shadow: 0 2rpx 6rpx rgba(40, 76, 106, 0.2);
	}
	.seat-occupant__photo {
		width: 100%;
		height: 100%;
		border-radius: 50%;
	}
	.seat-occupant__figure {
		width: 100%;
		height: 100%;
	}
	.seat-occupant__number {
		position: absolute;
		right: -4rpx;
		bottom: -3rpx;
		min-width: 22rpx;
		height: 20rpx;
		padding: 0 3rpx;
		box-sizing: border-box;
		border: 1rpx solid #ffffff;
		border-radius: 8rpx;
		background-color: #527a9e;
		color: #ffffff;
		font-size: 16rpx;
		font-weight: 600;
		line-height: 18rpx;
		text-align: center;
	}
	.seat-occupant--detail {
		width: 120rpx;
		height: 120rpx;
		border-width: 4rpx;
		box-shadow: 0 6rpx 20rpx rgba(40, 76, 106, 0.12);
	}
	.seat-occupant--detail .seat-occupant__number {
		right: -3rpx;
		bottom: 0;
		min-width: 36rpx;
		height: 32rpx;
		border-width: 2rpx;
		border-radius: 12rpx;
		font-size: 22rpx;
		line-height: 28rpx;
	}
</style>
