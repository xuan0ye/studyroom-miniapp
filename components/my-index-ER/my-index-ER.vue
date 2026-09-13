<template>
	<view class="context" @click="toFaceEnroll">
		<view class="left">
			<view style="position: absolute; top: 5rpx;">
				<u-icon name="fingerprint" size="140" color="#2f8fe0"></u-icon>
			</view>
		</view>
		<view class="center">
			<view style="position: absolute; top: 20rpx;left: 196rpx;">
				<u-text :bold="true" size="36" color="#030303" :selectable="false" text="门禁人脸" />
				<view style="height: 18rpx;"></view>
				<u-text :bold="false" size="24" color="#464646" :selectable="false" text="录入人脸刷脸进门" />
			</view>
		</view>
		<view class="right">
			<view style="position: absolute; top: 26rpx; right: 40rpx;">
				<u-icon name="arrow-right" size="40" color="#2f8fe0"></u-icon>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		name: "my-index-ER",
		data() {
			return {

			};
		},
		methods: {
			toFaceEnroll() {
				uni.navigateTo({
					url: '/other_pages/access/face-enroll'
				})
			}
		}
	}
</script>

<style>
	.context {
		position: relative;
		margin: auto 40rpx;
		margin-top: 80rpx;
		height: 150rpx;
		width: auto;
		border-radius: 80rpx;
		background-color: #c1e5ff;
	}
	.left{
		
	}
	
</style>