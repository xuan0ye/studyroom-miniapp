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
			<!--
				2026-10-15 改版(合规): 下线「余额充值」入口 —— 小程序内不再提供用户自助充值/储值,
				避免被判定为虚拟货币/虚拟商品。改为两块「到店服务」入口: 到店自习套餐 + 团购核销。
				注意: 余额功能本身保留(下单抵扣、团购代金券核销入账、客服退款仍用余额), 只是不再让用户充值。
			-->
			<view class="sub-row">
				<view class="entry-half" @click="toCard">
					<view class="entry-bg entry-card"></view>
					<view style="position: absolute; top: 30rpx; left: 30rpx;">
						<u-icon name="https://api.dayousuoan.top/upload/appstatic/index/bag.png" size="40"></u-icon>
					</view>
					<view style="position: absolute; top: 22rpx; right: 30rpx;">
						<u-text :bold="true" size="34" color="#ffffff" text="到店自习套餐" />
					</view>
					<view style="position: absolute; bottom: 24rpx; right: 30rpx;">
						<u-text :bold="false" size="22" color="#eafaff" text="时段服务 · 到店使用" />
					</view>
				</view>
				<view class="entry-half entry-right" @click="toDouyinVerify">
					<view class="entry-bg entry-douyin"></view>
					<view style="position: absolute; top: 34rpx; left: 30rpx;">
						<!-- 方案D: 抖音官方 Logo 音符(青红渐变), 由官方 SVG 路径烘焙成透明 PNG -->
						<image class="dy-note" src="/static/index/douyin-note.png" mode="aspectFit" />
					</view>
					<view style="position: absolute; top: 26rpx; right: 30rpx;">
						<!-- 方案D: 渐变字必须直接写在 text 上, 套在 u-text 外层不生效(会隐形) -->
						<text class="dy-title">团购核销</text>
					</view>
					<view style="position: absolute; bottom: 24rpx; right: 30rpx;">
						<u-text :bold="false" size="22" color="#cfcfcf" text="抖音团购券到店使用" />
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
			// 2026-10-15 合规改版: 首页不再提供充值入口(toRecharge 已删除,
			// 充值页也已从 pages.json 移除, 避免包内存在任何"用户自助充值"能力)。
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

	// 2026-10-15: 原来左侧是「余额充值」+ 右侧两块小卡; 现在改为左右两块等大的到店服务入口
	.entry-half {
		position: absolute;
		left: 40rpx;
		height: 200rpx;
		width: 330rpx;
	}

	.entry-right {
		left: auto;
		right: 40rpx;
	}

	.entry-bg {
		position: absolute;
		height: 200rpx;
		width: 330rpx;
		border-radius: 10rpx;
	}

	/* 到店自习套餐(原「卡券套餐」) */
	.entry-card {
		background-color: #13bec1;
		box-shadow: 0 6rpx 18rpx rgba(19, 190, 193, 0.35);
	}

	/* 抖音团购核销 */
	.entry-douyin {
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