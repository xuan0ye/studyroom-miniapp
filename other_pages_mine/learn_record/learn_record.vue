<template>
	<view>
		<my-navbar leftText="我的记录" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<view style="margin-top: 40rpx;">
			<u-tabs :list="tabList" @click="tabsClick" lineWidth="140rpx" lineHeight="4rpx" :activeStyle="activeStyle"
				:scrollable="false"></u-tabs>
		</view>

		<!-- 学习记录(预约+签到) -->
		<view v-if="index==0">
			<view v-if="list.length > 0" class="record-list">
				<view class="record-item" v-for="item in list" :key="item.id">
					<image class="dy-logo" src="/static/index/douyin-note.png" mode="aspectFit" />
					<view class="record-head">
						<!-- 方案D: 渐变字直接写在 text 上, 套在外层不生效 -->
						<text class="dy-title">{{ item.roomName || '自习室' }}</text>
						<u-tag v-if="item.checkInTime" type="success" size="mini" text="已签到" />
						<u-tag v-else :text="statusLabel(item.status)" :type="statusType(item.status)" size="mini" />
					</view>
					<view class="record-row">
						<u-text size="26" color="#cfcfcf" :text="'座位：' + (item.seatNum ? item.seatNum + ' 号' : '未选座位')" />
					</view>
					<view class="record-row">
						<u-text size="26" color="#cfcfcf" :text="'日期：' + (item.consumptionDate || '')" />
					</view>
					<view class="record-row" v-if="item.checkInTime">
						<u-text size="26" color="#25f4ee" :text="'签到开灯：' + fmtTime(item.checkInTime)" />
					</view>
					<view class="record-row" v-if="item.cardTitle">
						<u-text size="26" color="#9a9a9a" :text="'使用卡：' + item.cardTitle" />
					</view>
				</view>
			</view>
			<u-empty v-else marginTop="140" mode="order" text="暂无学习记录，快去预约签到吧" textSize="30" />
		</view>

		<!-- 消费记录 -->
		<view v-if="index==1">
			<view v-if="orderList.length > 0" class="record-list">
				<view class="record-item" v-for="item in orderList" :key="item.id">
					<image class="dy-logo" src="/static/index/douyin-note.png" mode="aspectFit" />
					<view class="record-head">
						<text class="dy-title">{{ item.description || '自习消费' }}</text>
						<u-text size="26" color="#9a9a9a" :text="payLabel(item.payStatus)" />
					</view>
					<view class="record-row">
						<u-text size="30" color="#25f4ee" :bold="true"
							:text="'金额：' + (item.total != null ? '¥' + (item.total / 100) : '-')" />
					</view>
					<view class="record-row">
						<u-text size="26" color="#cfcfcf" :text="'时间：' + (item.createTime || '')" />
					</view>
				</view>
			</view>
			<u-empty v-else marginTop="140" mode="order" text="暂无消费记录" textSize="30" />
		</view>
	</view>
</template>

<script>
	import { getOrder, myBookings } from '@/config/api.js'
	export default {
		data() {
			return {
				tabList: [{ name: '学习记录' }, { name: '消费记录' }],
				activeStyle: { color: '#35a5ed', fontWeight: 'bold' },
				index: 0,
				list: [],
				orderList: []
			}
		},
		methods: {
			statusLabel(status) {
				if (status === 1) return '已使用'
				if (status === 2) return '已失效'
				return '待使用'
			},
			statusType(status) {
				if (status === 1) return 'success'
				if (status === 2) return 'info'
				return 'primary'
			},
			payLabel(s) {
				return { 0: '未支付', 1: '已支付', 3: '未消费', 4: '已消费', 5: '已过期' }[s] || ''
			},
			fmtTime(t) {
				if (!t) return ''
				const d = new Date(String(t).replace(/-/g, '/'))
				const pad = function(n) { return n < 10 ? '0' + n : '' + n }
				return pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds())
			},
			async tabsClick(e) {
				this.index = e.index
				if (this.index == 0) this.loadLearn()
				else this.loadOrders()
			},
			async loadLearn() {
				try {
					const { data: list } = await myBookings({}, { custom: { auth: true, catch: true } })
					this.list = list || []
				} catch (e) {
					this.list = []
				}
			},
			async loadOrders() {
				try {
					const { data: order } = await getOrder({ pageNum: 1, pageSize: 50 }, { custom: { auth: true, catch: true } })
					this.orderList = (order && order.rows) || []
				} catch (e) {
					this.orderList = []
				}
			}
		},
		onLoad() {
			this.loadLearn()
		}
	}
</script>

<style lang="scss" scoped>
	.record-list { padding: 20rpx 30rpx; }
	/* 方案D: 抖音纯黑卡片 */
	.record-item {
		position: relative;
		overflow: hidden;
		background-color: #111111;
		border-radius: 20rpx;
		padding: 26rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.45);
	}
	/* 顶部青红渐变细条 */
	.record-item::before {
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
	.record-head {
		position: relative;
		z-index: 1;
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16rpx;
	}
	/* 青红渐变标题, 渐变不生效时回退白字 */
	.dy-title {
		flex: 1;
		margin-right: 16rpx;
		font-size: 32rpx;
		font-weight: bold;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		color: #ffffff;
		background: linear-gradient(90deg, #25f4ee, #fe2c55);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
	}
	.record-row { position: relative; z-index: 1; margin-bottom: 10rpx; }
</style>
