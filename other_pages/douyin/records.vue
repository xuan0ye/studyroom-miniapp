<template>
	<view>
		<my-navbar leftText="核销记录" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<view class="container">
			<!-- 记录列表 -->
			<view v-if="list.length > 0">
				<view v-for="item in list" :key="item.id" class="rec-item">
					<image class="dy-logo" src="/static/index/douyin-note.png" mode="aspectFit" />
					<view class="rec-head">
						<!-- 方案D: 渐变字直接写在 text 上, 套在外层不生效 -->
						<text class="dy-title">{{ item.productTitle || '抖音团购券' }}</text>
						<u-tag :text="statusLabel(item.status)" :type="statusType(item.status)" size="mini" />
					</view>

					<view class="rec-row">
						<u-text size="24" color="#9a9a9a" text="券ID尾号：" />
						<u-text size="24" color="#cfcfcf" :text="certTail(item.certificateId)" />
					</view>

					<view class="rec-row">
						<u-text size="24" color="#cfcfcf" :text="'核销时间：' + (formatTime(item.verifyTime) || '-')" />
					</view>

					<view class="rec-row" v-if="item.cancelTime">
						<u-text size="24" color="#cfcfcf" :text="'撤销时间：' + formatTime(item.cancelTime)" />
					</view>

					<view class="rec-row" v-if="item.remark">
						<u-text size="24" color="#9a9a9a" :text="'备注：' + item.remark" />
					</view>
				</view>

				<u-loadmore :status="loadStatus" marginTop="30" />
			</view>

			<!-- 空态 / 加载态 -->
			<view v-else-if="inited && !loading" class="empty-wrap">
				<u-empty mode="list" text="暂无核销记录" iconSize="140" />
				<view style="margin-top: 40rpx;">
					<u-button color="#35a5ed" size="large" shape="circle" text="去核销团购券" @click="goVerify" />
				</view>
			</view>
			<view v-else class="empty-wrap">
				<u-loading-icon mode="circle" color="#35a5ed" size="40" />
				<view style="margin-top: 20rpx;">
					<u-text size="26" color="#999" text="加载中..." />
				</view>
			</view>

			<!-- 底部说明 -->
			<view class="footer-wrap">
				<u-text size="22" color="#999"
					text="团购券核销后自动发放使用卡，过期不补；退款请通过抖音申请，由门店审核" />
			</view>
		</view>
	</view>
</template>

<script>
	import { douyinRecords } from '@/config/api.js'
	export default {
		data() {
			return {
				list: [],
				total: 0,
				pageNum: 1,
				pageSize: 20,
				loading: false,
				// 首次加载完成标记: 避免加载中先闪空态
				inited: false
			}
		},
		computed: {
			hasMore() {
				return this.list.length < this.total
			},
			loadStatus() {
				if (this.loading) return 'loading'
				return this.hasMore ? 'loadmore' : 'nomore'
			}
		},
		methods: {
			/** 1已核销 2已撤销 3异常 */
			statusLabel(s) {
				var n = Number(s)
				if (n === 1) return '已核销'
				if (n === 2) return '已撤销'
				if (n === 3) return '异常'
				return '未知状态'
			},
			statusType(s) {
				var n = Number(s)
				if (n === 1) return 'success'
				if (n === 2) return 'info'
				if (n === 3) return 'error'
				return 'info'
			},
			/** 只展示券ID后6位, 避免泄露完整券号 */
			certTail(id) {
				if (!id) return '-'
				var str = String(id)
				return str.length > 6 ? str.substring(str.length - 6) : str
			},
			/** 时间展示: 兼容时间戳与 ISO 字符串 */
			formatTime(t) {
				if (!t) return ''
				var str = String(t)
				if (/^\d{10,13}$/.test(str)) {
					var n = Number(str)
					if (str.length <= 10) n = n * 1000
					return uni.$u.date(n, 'yyyy-mm-dd hh:MM')
				}
				return str.replace('T', ' ').substring(0, 16)
			},
			/** 刷新第一页 */
			async load() {
				this.pageNum = 1
				await this.fetch(true)
			},
			/** 上拉加载下一页 */
			async loadMore() {
				if (this.loading || !this.hasMore) return
				this.pageNum = this.pageNum + 1
				await this.fetch(false)
			},
			async fetch(replace) {
				if (this.loading) return
				this.loading = true
				try {
					const { data: res } = await douyinRecords({
						pageNum: this.pageNum,
						pageSize: this.pageSize
					}, { custom: { auth: true, catch: true } })
					var rows = (res && res.rows) || []
					this.total = Number((res && res.total) || 0)
					this.list = replace ? rows : this.list.concat(rows)
				} catch (e) {
					if (replace) {
						this.list = []
						this.total = 0
					} else {
						// 加载失败回退页码, 下次可重试同一页
						this.pageNum = this.pageNum - 1
					}
					uni.$u.toast((e && e.msg) || '加载失败，请稍后重试')
				} finally {
					this.loading = false
					this.inited = true
				}
			},
			goVerify() {
				uni.navigateTo({
					url: '/other_pages/douyin/verify'
				})
			}
		},
		onShow() {
			this.load()
		},
		onPullDownRefresh() {
			this.load().then(() => {
				uni.stopPullDownRefresh()
			})
		},
		onReachBottom() {
			this.loadMore()
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		padding: 30rpx;
	}

	/* 方案D: 抖音纯黑卡片 */
	.rec-item {
		position: relative;
		overflow: hidden;
		background-color: #111111;
		border-radius: 20rpx;
		padding: 24rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 14rpx rgba(0, 0, 0, 0.45);
	}

	.rec-item::before {
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

	.rec-head {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 16rpx;
	}

	/* 青红渐变标题, 渐变不生效时回退白字 */
	.dy-title {
		flex: 1;
		margin-right: 16rpx;
		font-size: 30rpx;
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

	.rec-row {
		position: relative;
		z-index: 1;
		display: flex;
		align-items: center;
		margin-top: 8rpx;
	}

	.empty-wrap {
		padding: 120rpx 40rpx 0;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.footer-wrap {
		margin-top: 40rpx;
		text-align: center;
	}
</style>
