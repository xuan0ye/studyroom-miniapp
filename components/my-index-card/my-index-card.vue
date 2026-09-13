<template>
	<view>
		<view class="my-card">
			<!-- 预约选座主入口 -->
			<view class="book-row" @click="toBook">
				<view class="book-bg">
					<view style="position: absolute; top: 30rpx; left: 30rpx;">
						<u-text :bold="true" size="38" color="#ffffff" text="预约选座" />
						<view style="height: 10rpx;"></view>
						<u-text :bold="false" size="24" color="#eaf6ff" text="选择门店时间，立即占座" />
					</view>
					<view style="position: absolute; bottom: 0px; right: 20rpx;">
						<u-icon name="https://api.dayousuoan.top/upload/appstatic/other_pages/static/seat.png" size="96"></u-icon>
					</view>
					<view style="position: absolute; bottom: 30rpx; right: 150rpx;">
						<u-icon name="arrow-right" color="#ffffff" size="34"></u-icon>
					</view>
				</view>
			</view>
			<view class="sub-row">
				<view class="recharge">
					<view class="my-card-bg" @click="toRecharge">
						<view style="position: absolute; top: 20rpx; left: 20rpx;">
							<u-text :bold="true" size="34" color="#ffffff" text="余额充值" />
							<view style="height: 8rpx;"></view>
							<u-text :bold="false" size="22" color="#ffffff" text="充值到余额" />
						</view>
						<view style="position: absolute; bottom: 0px; right: 0px;">
							<u-icon name="https://api.dayousuoan.top/upload/appstatic/index/pay.png" size="96" color="#0ec61b"></u-icon>
						</view>
					</view>
				</view>
				<view class="recharge-right">
					<view class="pay-card" @click="toCard">
						<view style=" position:absolute; top:26rpx; left: 60rpx;">
							<u-icon name="https://api.dayousuoan.top/upload/appstatic/index/bag.png" size="36"></u-icon>
						</view>
						<view style=" position:absolute; top:18rpx; right: 60rpx;">
							<u-text :bold="true" size="34" color="#ffffff" text="卡券套餐" />
						</view>
					</view>
					<view class="mt-card" @click="toDouyinVerify">
						<view style=" position:absolute; top:24rpx; left: 60rpx;">
							<!-- 方案D: 抖音官方 Logo 音符(青红渐变), 由官方 SVG 路径烘焙成透明 PNG -->
							<image class="dy-note" src="/static/index/douyin-note.png" mode="aspectFit" />
						</view>
						<view style=" position:absolute; top:18rpx; right: 60rpx;">
							<!-- 方案D: 渐变字必须直接写在 text 上, 套在 u-text 外层不生效(会隐形) -->
							<text class="dy-title">团购核销</text>
						</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: "my-index-card",
		data() {
			return {

			};
		},
		methods: {
			toBook() {
				uni.switchTab({
					url: "/pages/order/order"
				})
			},
			toRecharge() {
				uni.navigateTo({
					url: "/other_pages/recharge/recharge"
				})
			},
			toCard() {
				uni.navigateTo({
					url: "/other_pages/recharge-card/recharge-card"
				})
			},
			// 抖音团购券到店自助核销
			toDouyinVerify() {
				uni.navigateTo({
					url: "/other_pages/douyin/verify"
				})
			}
		}
	}
</script>

<style lang="scss">
	.my-card {
		position: relative;
		height: 420rpx;
		padding: 0 40rpx;
		// background-color: #2C405A;
	}

	.book-row {
		position: absolute;
		top: 0;
		left: 40rpx;
		right: 40rpx;
		height: 200rpx;
	}

	.book-bg {
		position: absolute;
		height: 200rpx;
		width: 100%;
		border-radius: 16rpx;
		background-color: #35a5ed;
		box-shadow: 0 8rpx 24rpx rgba(53, 165, 237, 0.35);
	}

	.sub-row {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		height: 200rpx;
		padding: 0 40rpx;
	}

	.recharge {
		position: absolute;
		left: 40rpx;
		height: 200rpx;
		width: 330rpx;
	}

	.my-card-bg {
		position: absolute;
		height: 200rpx;
		width: 330rpx;
		border-radius: 10rpx;
		background-color: #0c9d16;
	}

	.recharge-right {
		position: absolute;
		right: 40rpx;
		height: 200rpx;
		width: 330rpx;
	}

	.pay-card {
		position: absolute;
		height: 96rpx;
		width: 330rpx;
		border-radius: 10rpx;
		background-color: #13bec1;

	}

	.mt-card {
		position: absolute;
		bottom: 0px;
		height: 96rpx;
		width: 330rpx;
		border-radius: 10rpx;
		background-color: #111111;
		box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.45);
	}

	/* 方案D: 抖音官方音符图标(青红渐变, 透明底) */
	.dy-note {
		width: 44rpx;
		height: 44rpx;
	}

	/* 方案D: 抖音纯黑卡 + 青红渐变字(渐变不生效时回退白字) */
	.dy-title {
		font-size: 34rpx;
		font-weight: bold;
		line-height: 1.4;
		color: #ffffff;
		background: linear-gradient(90deg, #25f4ee, #fe2c55);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}
</style>