<template>
	<view>
		<my-navbar leftText="我的账户" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<view style="margin: auto 40rpx;">
			<view style="margin-top: 140rpx;">
				<view>
					<u-text :bold="false" size="28" color="#303133" text="总余额" align="center" />
				</view>
				<view style="margin-top: 40rpx;display: flex ;justify-content: center;">
					<image src="https://api.dayousuoan.top/upload/appstatic/other_pages_mine/static/account.png" mode="aspectFit"></image>
				</view>
				<view style="margin-top: 40rpx;display: flex; justify-content: center;width: 100%;align-items: center;">
					<view>
						<u-text :bold="true" size="50" color="#35a5ed" :text="account.balance" align="right" />
					</view>
					<view style="margin-bottom: -12rpx;margin-left: 10rpx;">
						<u-text :bold="true" size="26" color="#35a5ed" text="点" align="left" />
					</view>
				</view>
			</view>
		</view>
		<!--
			2026-10-15 合规改版: 下线「立即充值」用户自助充值(避免被判为虚拟货币/虚拟商品)。
			余额保留, 但来源只限于: 团购券核销入账 / 门店退款入账 / 门店人工调整;
			用途为抵扣到店服务费用, 不可提现、不可转赠。
		-->
		<view style="margin: 40rpx 60rpx 0 60rpx;">
			<u-text :bold="false" size="24" color="#909399" align="left"
				text="余额说明：余额为门店线下服务的预付款，用于抵扣到店服务费用，不可提现、不可转赠。余额由门店按实际情况入账（团购券核销、退款入账、门店调整），小程序内不提供充值。" />
		</view>
	</view>
</template>

<script>
	import {
		mapState,
		mapMutations
	} from 'vuex';
	export default {
		data() {
			return {}
		},
		computed: {
			...mapState(['oneToke', 'account']),
		},
		methods: {
			// 2026-10-15: 充值入口已下线(合规), 不再跳转充值页
		},
		onShow() {}
	}
</script>

<style lang="scss">
	.foot-button {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 40rpx;
	}
</style>
