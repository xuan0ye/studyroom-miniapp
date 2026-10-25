<template>
	<page-meta :page-style="'overflow:'+((show || (seatLoading && !seatLoaded))?'hidden':'visible')">
		<view>
			<book-loading :loading="seatLoading && !seatLoaded" fullscreen :delay="0" :min-duration="400" text="正在加载座位图…"></book-loading>
			<my-navbar leftText="预定位置" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
				leftIconSize="40">
			</my-navbar>
			<view style="margin: auto 40rpx;">
				<!-- 预约情况 -->
				<view v-if="seatLoaded" style=" width: 100%;">
					<view class="seat-head">
						<u-icon name="https://api.dayousuoan.top/upload/appstatic/other_pages/static/seat.png" size="70"></u-icon>
						<p style="margin:auto 20rpx;margin-right: 40rpx;">可预约:{{noReservedNum}}</p>
						<image src="/other_pages/static/daan-study-mascot.png" class="seat-head-figure" mode="aspectFit"></image>
						<p style="margin:auto 20rpx;">已预约:{{reservedNum}}</p>
					</view>
				</view>
				<!-- 新版 3D 平面图与点击坐标随包发布，保留服务器旧坐标供旧版客户使用 -->
				<!-- 坐标统一相对背景图本身: 背景图占满容器, 座位百分比定位 -->
				<view v-if="seatLoadError" class="seat-load-error"><text>暂时无法获取座位情况</text><button size="mini" @click="retrySeats">重新加载</button></view>
				<view v-else-if="seatLoaded && !hasSeats" class="seat-load-error">当前时段暂无可展示的座位</view>
				<view v-else-if="seatLoaded" class="seatmap" id="seatmap">
					<!-- 门店布局图背景(占满容器) -->
					<image :src="seatMapImage" class="seat-bg" mode="widthFix"></image>
					<!-- 座位层: 仅渲染后端存在的座位(visiblePositions), 点击选座 -->
					<view v-for="(pos, seatNum) in visiblePositions" :key="seatNum" class="seat-abs"
						:style="{ left: pos.x + '%', top: pos.y + '%' }" @click="onSeatTap(seatNum)">
						<!-- 未预约: 什么都不渲染, 背景图上的座位号直接可见, 仅保留可点击区域 -->
						<template v-if="getSeatByNum(seatNum).status == true"></template>
						<!-- 未公开头像时用答岸学习吉祥物；公开头像加载失败时也有本地兜底 -->
						<seat-occupant v-else :avatar="normAvatar(getSeatByNum(seatNum).occupantAvatar)"
							:seat-num="seatNum"></seat-occupant>
					</view>
				</view>
			</view>
			<!-- 一言区域 -->
			<view style="margin-top: 40rpx; margin-bottom: 350rpx; display: flex; justify-content: center;">
				<u-text :bold="false" size="24" color="#353535" align="center" :text='oneToke' />
			</view>
			<!-- 底部固定浮动区域 -->
			<view class="foot">
				<u-text :bold="true" size="28" color="#303133" :text="store.roomName" align="left" />
				<view style="display: flex; justify-content: space-between; margin: 40rpx auto;">
					<view style="display: flex; flex-direction: row;">
						<view>
							<u-text :bold="true" size="28" color="#35a5ed" :text="week" align="left" />
						</view>
						<view style="margin-left: 10rpx; margin-right: 20rpx;">
							<u-text :bold="true" size="28" color="#b8b8b8" :text="date" align="left" />
						</view>
						<view>
							<u-text :bold="true" size="28" color="#000000" :text="'开始'+time" align="left" />
						</view>
						<view style="margin-left: 20rpx;" v-if="mode === 'daily'">
							<u-text :bold="true" size="28" color="#35a5ed" text="全天" align="left" />
						</view>
						<view style="margin-left: 20rpx;" v-else>
							<u-text :bold="true" size="28" color="#35a5ed" :text="orderTotal+'小时'" align="left" />
						</view>
					</view>
					<view style="margin-right: 20rpx;" @click="back">
						<u-text :bold="true" size="28" color="#ff8215" text="修改" align="left" />
					</view>
				</view>
			</view>
			<!-- 座位详情弹框 -->
			<view>
				<u-action-sheet :show="show" @close="show = false" title="座位详情" :iconSize="36" :round="40"
					:safeAreaInsetBottom="true">
				<view style="margin-top: 40rpx;"></view>
				<u-text :bold="false" size="28" color="#303133" :text="seat.areaName+' '+seat.seatNum+'号'"
					align="center" />
					<view v-if="seat.status == false" class="seat-occupant-detail">
						<seat-occupant :avatar="normAvatar(seat.occupantAvatar)" :seat-num="seat.seatNum" :detail="true"></seat-occupant>
					</view>
					<u-text v-if="seat.status == false" :bold="false" size="24" color="#7c8796" text="该时段已被预约" align="center"
						style="margin-top: 10rpx; display: block;" />
					<view style="margin: 40rpx 20rpx;">
						<u-button v-if="seat.status != false" color="#35a5ed" size="large" @click="toPayment" text="确认座位"></u-button>
						<u-button v-else type="default" size="large" @click="show = false" text="该座位不可预约"></u-button>
					</view>
				</u-action-sheet>
			</view>
		</view>
	</page-meta>

</template>

<script>
	import {
		mapState,
	} from 'vuex'
	import { getSeat } from '@/config/api.js'
import { SEAT_MAP_IMAGE, createSeatPositions } from '@/config/seat-layout.js'
import { isLoggedIn } from '@/utils/auth.js'
import { goBack as safeGoBack } from '@/utils/nav.js'
	export default {
		data() {
			return {
				// 页面参数(经 onLoad(options) 注入, uni-app 页面跳转参数不走 props)
				mode: 'daily',
				startTimestamp: null,
				endTimestamp: null,
				orderTotal: 0,
				dateLabel: '',
				dateStr: '',
				date: '',
				time: '',
				show: false,
				seatCom: [], //经济区
				seatVip: [], //舒适区
				seatMap: {}, //座位号 -> 座位(平面图布局用)
				seatLoading: false,
				seatLoaded: false,
				seatLoadError: false,
				week: '',
				reservedNum: 0, //已预约
				noReservedNum: 0, //可预约
				seat: {},
				// 与当前背景图绑定，避免旧版缓存/共享坐标覆盖新版布局。
				seatMapImage: SEAT_MAP_IMAGE,
				seatPositions: createSeatPositions() // 座位号 -> {x, y} 背景图百分比
			}
		},
		computed: {
			...mapState(['oneToke', 'store']),
			hasSeats() { return Object.keys(this.seatMap).length > 0 },
			// 可见座位: 仅后端真实存在的座位(seatMap 有数据), 后台已删除的座位不显示也不可点
			visiblePositions() {
				const out = {}
				if (!this.seatMap) return out
				Object.keys(this.seatPositions || {}).forEach(k => {
					if (this.seatMap[k]) out[k] = this.seatPositions[k]
				})
				return out
			}
		},
		methods: {
			// 头像归一化: 兼容后端返回的裸 base64(缺 data:image 前缀会导致 image 加载报错)
			normAvatar(val) {
				if (!val) return ''
				var s = String(val)
				if (s.indexOf('data:image') === 0) return s
				if (s.indexOf('http') === 0 || s.indexOf('wxfile') === 0) return s
				// 服务器本地存储头像(/upload/...) → 按当前运行环境拼根地址(dev=本地后端, 真机/生产=线上)
				if (s.indexOf('/upload/') === 0) {
					try {
						var cfg = require('@/config/config.js')
						return cfg.currentHost() + s
					} catch (e) {}
					return 'https://api.dayousuoan.top' + s
				}
				// 带前导斜杠的裸 base64(如 /9j/4AAQ... = data URI 截断残留), 去掉斜杠后仍是 base64 则补前缀
				var t = s
				if (t.indexOf('/') === 0) t = t.slice(1)
				if (/^[A-Za-z0-9+/=]+$/.test(t) && t.length > 50) {
					return 'data:image/jpeg;base64,' + t
				}
				// 以 / 开头的本地资源路径原样返回
				if (s.indexOf('/') === 0) return s
				return s
			},
			back() {
				// 2026-10-15: 改为安全返回, 页面栈只有 1 层时兜底回首页(见 utils/nav.js)
				safeGoBack()
			},
			toPayment() {
				if (this.mode === 'daily') {
					uni.$u.route('/other_pages/daily-checkout/daily-checkout', {
						seatId: this.seat.seatId,
						seatNum: this.seat.seatNum,
						storeName: this.store.roomName,
						roomId: this.store.roomId,
						date: uni.$u.date(this.startTimestamp, 'yyyy-mm-dd')
					})
					return
				}
				uni.$u.route('/other_pages/payment/payment', {
					seat: JSON.stringify(this.seat),
					start: uni.$u.date(this.startTimestamp, 'yyyy-mm-dd hh:MM'),
					end: uni.$u.date(this.endTimestamp, 'yyyy-mm-dd hh:MM'),
					total: this.orderTotal
				})
			},
			showSeat(seat) {
				this.show = true
				this.seat = seat
				console.log(seat)
			},
			async setSeat(start, end, id) {
				if (!this._seatAlive || this.seatLoading) return
				const params = {
					roomId: id,
					startTime: start,
					endTime: end
				}
				this._seatQuery = params
				this.seatLoading = true
				this.seatLoadError = false
				try {
					const { data: res } = await getSeat(params, { custom: { auth: true, catch: true, toast: false } })
					if (!this._seatAlive) return
					if (!res || !Array.isArray(res.seatCom) || !Array.isArray(res.seatVip)) throw new Error('座位情况暂不可用')
					this.seatCom = res.seatCom
					this.seatVip = res.seatVip
					this.reservedNum = res.reservedNum
					this.noReservedNum = res.noReservedNum
					const map = {}
					res.seatCom.concat(res.seatVip).forEach(s => { if (s && s.seatNum != null) map[String(s.seatNum)] = s })
					this.seatMap = map
					this.seatLoaded = true
				} catch (error) {
					if (this._seatAlive) this.seatLoadError = true
				} finally {
					if (this._seatAlive) this.seatLoading = false
				}
			},
			retrySeats() {
				const query = this._seatQuery
				if (query) this.setSeat(query.startTime, query.endTime, query.roomId)
			},
			getSeatByNum(n) {
				return this.seatMap ? this.seatMap[String(n)] : null
			},
			onSeatTap(num) {
				const seat = this.getSeatByNum(num)
				if (seat) this.showSeat(seat)
			}
		},
		onLoad(options) {
			this._seatAlive = true
			// 页面参数: 从 URL options 读取并注入(不能依赖 props)
			if (options) {
				if (options.mode != null) this.mode = options.mode
				if (options.startTimestamp != null) this.startTimestamp = Number(options.startTimestamp)
				if (options.endTimestamp != null) this.endTimestamp = Number(options.endTimestamp)
				if (options.orderTotal != null) this.orderTotal = Number(options.orderTotal)
				if (options.dateLabel != null) this.dateLabel = options.dateLabel
				if (options.dateStr != null) this.dateStr = options.dateStr
			}
			// 容错: daily 全天模式缺省时间戳 = 今天 00:00 ~ 明天 00:00
			if (!this.startTimestamp) {
				var d0 = new Date()
				d0.setHours(0, 0, 0, 0)
				this.startTimestamp = d0.getTime()
				if (!this.endTimestamp) {
					this.endTimestamp = d0.getTime() + 86400000
				}
			}
			// 未登录: 预约需登录, 明确提示并返回
			// 登录态只看 token(见 utils/auth.js): 缓存标记与真实登录态可能不同步
			if (!isLoggedIn()) {
				uni.showModal({
					title: '请先登录',
					content: '预约选座需要先登录，是否前往「我的」页登录？',
					confirmText: '去登录',
					success: (r) => {
						if (r.confirm) {
							uni.switchTab({ url: '/pages/mine/mine' })
						} else {
							// 2026-10-15: 安全返回, 避免页面栈只有 1 层时无反应
							safeGoBack()
						}
					}
				})
				return
			}
			var weekArr = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
			this.week = weekArr[new Date(this.startTimestamp).getDay()]
			this.date = uni.$u.date(this.startTimestamp, 'mm月dd日')
			this.time = this.mode === 'daily' ? '全天' : uni.$u.date(this.startTimestamp, 'hh:MM')
			const start = uni.$u.date(this.startTimestamp, 'yyyy-mm-dd hh:MM:ss')
			const end = uni.$u.date(this.endTimestamp, 'yyyy-mm-dd hh:MM:ss')
			console.log(start, end)
			// 容错: storage 里可能没有 store(直接进入页面/缓存被清), 避免 JSON.parse 崩溃
			let store = null
			try {
				store = JSON.parse(uni.getStorageSync('store'))
			} catch (e) {
				store = null
			}
			if (!store || !store.roomId) {
				store = this.store && this.store.roomId ? this.store : null
			}
			if (store && store.roomId) {
				this.setSeat(start, end, store.roomId)
			} else {
				// 已登录但无门店信息: 引导先回首页选门店
				uni.showModal({
					title: '请先选择门店',
					content: '请先回到首页选择自习室门店，再进入预约选座',
					showCancel: false,
					confirmText: '回首页',
					success: () => {
						uni.switchTab({ url: '/pages/index/index' })
					}
				})
			}
		},
		onUnload() { this._seatAlive = false }
	}
</script>

<style lang="scss">
	.seat-load-error { padding: 100rpx 0; color: #738293; font-size: 26rpx; text-align: center; }
	.seat-load-error button { display: block; margin-top: 28rpx; color: #2586c5; background: #edf7fe; }
	.seat-head {
		display: flex;
		flex-direction: row;
		justify-content: center;
		align-items: center;
		font-size: 26rpx;
		font-weight: 500;
		margin: 40rpx auto;
		color: #4d4d4d;
	}
	.seat-head-figure {
		width: 52rpx;
		height: 52rpx;
		box-sizing: border-box;
		border: 2rpx solid #ffffff;
		border-radius: 50%;
		background: linear-gradient(145deg, #f3faff, #d9ebf8);
		box-shadow: 0 2rpx 6rpx rgba(40, 76, 106, 0.16);
	}
	.seat-occupant-detail {
		display: flex;
		justify-content: center;
		margin: 24rpx 0 18rpx;
	}

	.vip {
		background-color: #FFFFFF;
		border-radius: 20rpx;
		padding-top: 30rpx;
		margin-bottom: 20rpx;
	}

	// 背景图占满容器，座位百分比直接相对背景图。
	.seatmap {
		position: relative;
		background-color: #FFFFFF;
		border-radius: 20rpx;
		margin-bottom: 20rpx;
		overflow: hidden;
		box-sizing: border-box;
	}
	.seat-bg {
		width: 100%;
		display: block;
		border-radius: 12rpx;
	}
	// 座位定位层: 非编辑模式只是透明点击区(未预约时背景图座位号直接可见)
	// 新图的 5/6、20/21 相邻较近，42rpx 点击区避免边缘重叠。
	.seat-abs {
		position: absolute;
		transform: translate(-50%, -50%);
		width: 42rpx;
		height: 42rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		z-index: 10;
	}
	// 编辑模式的座位拖拽标记
	// 编辑工具栏: 普通文档流显示在地图下方, 不遮挡底部座位
	// 编辑缩放控制行
	.map-row {
		display: flex;
		flex-direction: row;
		justify-content: flex-start;
		align-items: flex-start;
		margin-bottom: 30rpx;
	}
	.seat-col {
		display: flex;
		flex-direction: row;
		flex-wrap: nowrap;
	}
	.seat-item {
		margin-right: 26rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
	}
	.seat-empty {
		width: 56rpx;
		height: 56rpx;
	}
	// 后端无数据座位的灰色标记(保证所有座位可见)
	.seat-miss {
		width: 52rpx;
		height: 52rpx;
		border-radius: 50%;
		background-color: rgba(153, 153, 153, 0.55);
		border: 2rpx solid #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.seat-miss-num {
		color: #ffffff;
		font-size: 22rpx;
		font-weight: bold;
	}
	.map-spacer {
		width: 60rpx;
	}

	.foot {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background-color: #FFFFFF;
		border-top-left-radius: 20rpx;
		border-top-right-radius: 20rpx;
		// height: 200rpx;
		box-shadow: 4rpx -4rpx 16px 2rpx #68686870;
		// border-top: 1rpx solid #b6b6b6;
		padding: 40rpx;
	}
</style>
