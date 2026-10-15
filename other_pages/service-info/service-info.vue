<template>
	<view style="background-color: #f5f6fa; min-height: 100vh;">
		<my-navbar title="服务与门店说明" :custom="false" :autoBack="true"></my-navbar>
		<view class="page">
			<!--
				本页用途(2026-10-15 新增):
				小程序的购买项被平台判定为"虚拟商品"而审核未通过。本页用门店信息 + 到店流程 + 服务性质声明,
				把"这是线下到店服务、需到店在实体座位上使用"讲清楚, 供平台审核与用户查阅。
			-->
			<view class="hero">
				<view class="hero-title">本小程序是线下自习室门店的预约与到店服务工具</view>
				<view class="hero-sub">
					所有购买项均为「<text class="b">到店使用</text>」的自习时段服务，需到门店、在门店提供的<text class="b">实体座位</text>上使用，
					由门店现场提供并核验，<text class="b">非虚拟商品、非虚拟货币、不支持线上交付</text>。
				</view>
			</view>

			<view class="card">
				<view class="card-title">一、门店信息</view>
				<view class="row"><text class="k">门店名称</text><text class="v">{{ store.roomName || '答岸自习室' }}</text></view>
				<view class="row"><text class="k">门店地址</text><text class="v">{{ store.roomAddr || '—' }}</text></view>
				<view class="row"><text class="k">营业时间</text><text class="v">{{ hours }}</text></view>
				<view class="row">
					<text class="k">联系电话</text>
					<text class="v link" @click="callPhone">{{ store.phone || '—' }}</text>
				</view>
			</view>

			<view class="card">
				<view class="card-title">二、到店服务流程</view>
				<view class="step">1. 在小程序内选择门店与时段，购买自习时段服务并预约座位；</view>
				<view class="step">2. 按预约时间<text class="b">到店</text>，在门店现场使用实体座位；</view>
				<view class="step">3. 进店通过门店门禁核验（人脸识别 / 门禁设备 / 工作人员确认）；</view>
				<view class="step">4. 到店后开启座位灯即完成到店签到，也可由工作人员现场确认；</view>
				<view class="step">5. 服务全部在门店现场提供，小程序仅用于预约、门禁通行与记录查询。</view>
			</view>

			<view class="card">
				<view class="card-title">三、服务与退款规则</view>
				<view class="step">· 购买的时段服务自「首次预约使用」起算，未使用不会开始计时、不会过期；</view>
				<view class="step">· 已到店使用（已签到）的时段不支持退款；未使用的时段可联系门店协商处理；</view>
				<view class="step">· 账户余额为门店线下服务预付款，只能在小程序内抵扣到店服务费用，不可提现、不可转赠。</view>
			</view>

			<view class="card">
				<view class="card-title">四、联系我们</view>
				<view class="step">如对服务或规则有任何疑问，可通过「我的 → 意见反馈」提交，或拨打上方门店电话联系。</view>
			</view>

			<view class="foot">答岸自习室 · 线下门店服务</view>
		</view>
	</view>
</template>

<script>
	import { getStore } from '@/config/api.js'
	export default {
		data() {
			return {
				store: {},
				hours: '每日 00:00 - 24:00（24 小时营业，以门店现场公示为准）'
			}
		},
		onLoad() {
			this.loadStore()
		},
		methods: {
			// 门店名称/地址/电话实时取后台数据(后台改一次, 小程序不用改)
			async loadStore() {
				try {
					const res = await getStore({}, { custom: { catch: true, toast: false } })
					const rows = (res && res.data && res.data.rows) ? res.data.rows : []
					if (rows.length > 0) {
						this.store = rows[0]
						uni.setStorageSync('store', JSON.stringify(rows[0]))
					}
				} catch (e) {}
			},
			callPhone() {
				if (!this.store.phone) return
				uni.makePhoneCall({ phoneNumber: String(this.store.phone) })
			}
		}
	}
</script>

<style lang="scss">
	.page {
		padding: 30rpx 40rpx 60rpx 40rpx;
	}

	.hero {
		background: linear-gradient(135deg, #35a5ed 0%, #19be6b 100%);
		border-radius: 20rpx;
		padding: 34rpx 30rpx;
		margin-bottom: 24rpx;
	}

	.hero-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #ffffff;
		line-height: 1.5;
	}

	.hero-sub {
		margin-top: 16rpx;
		font-size: 26rpx;
		color: #f0f9ff;
		line-height: 1.7;
	}

	.card {
		background-color: #ffffff;
		border-radius: 20rpx;
		padding: 28rpx 30rpx;
		margin-bottom: 24rpx;
	}

	.card-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #303133;
		margin-bottom: 18rpx;
	}

	.row {
		display: flex;
		align-items: flex-start;
		margin-bottom: 14rpx;
	}

	.k {
		width: 150rpx;
		min-width: 150rpx;
		font-size: 27rpx;
		color: #909399;
	}

	.v {
		flex: 1;
		font-size: 27rpx;
		color: #303133;
		line-height: 1.6;
	}

	.link {
		color: #35a5ed;
		text-decoration: underline;
	}

	.step {
		font-size: 27rpx;
		color: #606266;
		line-height: 1.8;
		margin-bottom: 8rpx;
	}

	.b {
		font-weight: bold;
		color: #303133;
	}

	.foot {
		margin-top: 20rpx;
		text-align: center;
		font-size: 24rpx;
		color: #b8b8b8;
	}
</style>