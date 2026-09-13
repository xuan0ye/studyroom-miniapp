<template>
	<view v-if="show">
		<view v-for="(item,index) in list" :key="index">
			<view class="card-item">
				<image class="dy-logo" src="/static/index/douyin-note.png" mode="aspectFit" />
				<view style="display: flex;justify-content: flex-start;align-items: center;">
					<view>
						<u-icon name="https://api.dayousuoan.top/upload/appstatic/other_pages_mine/static/store.png" size="35"></u-icon>
					</view>
					<view style="margin-left: 20rpx; flex: 1;">
						<!-- 方案D: 渐变字直接写在 text 上, 套在外层不生效 -->
						<text class="dy-title">{{ item.roomName }}</text>
					</view>
				</view>
				<view style="display: flex;justify-content: flex-start;align-items: center; margin-top: 40rpx;">
					<view>
						<u-icon name="https://api.dayousuoan.top/upload/appstatic/other_pages_mine/static/seat.png" size="35"></u-icon>
					</view>
					<view style="margin-left: 20rpx;">
						<u-text :bold="false" size="30" color="#cfcfcf"
							:text="item.areaName+'·'+'舒适区'+'·'+item.seatNum" align="center" />
					</view>
				</view>
				<view style="display: flex;justify-content: flex-start; margin-top: 40rpx;">
					<view>
						<u-icon name="https://api.dayousuoan.top/upload/appstatic/other_pages_mine/static/clock.png" size="35"></u-icon>
					</view>
					<view style="margin-left: 20rpx; width: 100%;display: flex;">
						<u-text :bold="false" size="30" color="#9a9a9a" text="开始时间" align="left" />
						<view style="margin-left: 10rpx;">
							<u-text :bold="false" size="30" color="#25f4ee"
								:text="item.startTime+'('+item.hours+'小时'+')'" align="left" />
						</view>
					</view>
				</view>
			</view>
		</view>
		<template>
			<u-loadmore :status="status" :loading-text="loadingText" :loadmore-text="loadmoreText" :isDot="true"
				:nomore-text="nomoreText" fontSize="20" :line="true" loadingIcon="semicircle" marginBottom="30"
				@loadmore="loadmore" />
		</template>
	</view>
</template>

<script>
	export default {
		props: {
			show: {
				default: true,
				type: Boolean,
			},
			status: {
				default: 'loadmore',
				type: String,
			},
			list: {
				default: [],
				type: Array
			}

		},
		data() {
			return {
				loadingText: '努力加载中,先喝杯茶',
				loadmoreText: '上拉或点击加载更多',
				nomoreText: '我也是有底线的',
			}
		},
		methods: {
			loadmore() {
				if (this.status == 'loadmore') this.$emit('loadmore');
			}
		},


	}
</script>

<style lang="scss">
	/* 方案D: 抖音纯黑卡片 */
	.card-item {
		position: relative;
		overflow: hidden;
		margin: auto 40rpx;
		margin-top: 40rpx;
		margin-bottom: 40rpx;
		background-color: #111111;
		border-radius: 20rpx;
		padding: 50rpx 40rpx;
		box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.45);
	}

	.card-item::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		width: 100%;
		height: 4rpx;
		background: linear-gradient(90deg, #25f4ee, #fe2c55);
		opacity: 0.9;
	}

	/* 右下角抖音音符水印 */
	.dy-logo {
		position: absolute;
		right: 16rpx;
		bottom: 16rpx;
		width: 64rpx;
		height: 64rpx;
		opacity: 0.35;
		z-index: 0;
	}

	/* 青红渐变标题, 渐变不生效时回退白字 */
	.dy-title {
		position: relative;
		z-index: 1;
		display: block;
		font-size: 32rpx;
		font-weight: bold;
		color: #ffffff;
		background: linear-gradient(90deg, #25f4ee, #fe2c55);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}
</style>
