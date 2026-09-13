<template>
	<page-meta :page-style="'overflow:'+(show?'hidden':'visible')">
		<view>
			<my-navbar leftText="预定位置" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
				leftIconSize="40">
			</my-navbar>
			<view style="margin: auto 40rpx;">
				<!-- 预约情况 -->
				<view style=" width: 100%;">
					<view class="seat-head">
						<u-icon name="https://api.dayousuoan.top/upload/appstatic/other_pages/static/seat.png" size="70"></u-icon>
						<p style="margin:auto 20rpx;margin-right: 40rpx;">可预约:{{noReservedNum}}</p>
						<u-icon name="https://api.dayousuoan.top/upload/appstatic/other_pages/static/seat-fill.png" size="70"></u-icon>
						<p style="margin:auto 20rpx;">已预约:{{reservedNum}}</p>
					</view>
				</view>
				<!-- 座位平面图: 背景=门店布局图(固定布局, 坐标从服务器加载) -->
				<!-- 坐标统一相对背景图本身: 背景图占满容器, 座位百分比定位 -->
				<view class="seatmap" id="seatmap">
					<!-- 门店布局图背景(占满容器) -->
					<image src="/static/index/seat-layout.jpg" class="seat-bg" mode="widthFix"></image>
					<!-- 座位层: 仅渲染后端存在的座位(visiblePositions), 点击选座 -->
					<view v-for="(pos, seatNum) in visiblePositions" :key="seatNum" class="seat-abs"
						:style="{ left: pos.x + '%', top: pos.y + '%' }" @click="onSeatTap(seatNum)">
						<!-- 未预约: 什么都不渲染, 背景图上的座位号直接可见, 仅保留可点击区域 -->
						<template v-if="getSeatByNum(seatNum).status == true"></template>
						<!-- 已预约且有头像: 显示头像标记 -->
						<image v-else-if="getSeatByNum(seatNum).occupantAvatar"
							:src="normAvatar(getSeatByNum(seatNum).occupantAvatar)" class="seat-avatar"></image>
						<!-- 已预约无头像: 显示已预约图标 -->
						<u-icon v-else name="https://api.dayousuoan.top/upload/appstatic/other_pages/static/seat-fill.png" size="48"></u-icon>
					</view>
				</view>
			</view>
			<!-- 一言区域 -->
			<view style="margin-top: 40rpx; margin-bottom: 350rpx;">
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
					<view v-if="seat.occupantAvatar" style="display: flex; justify-content: center; align-items: center; margin-top: 20rpx;">
						<image :src="normAvatar(seat.occupantAvatar)" style="width: 88rpx; height: 88rpx; border-radius: 50%; border: 2rpx solid #35a5ed;"></image>
					</view>
					<u-text v-if="seat.occupantAvatar" :bold="false" size="24" color="#999" text="该座位已被占用" align="center"
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
	import {
		getSeat,
		getSeatPositions
	} from '@/config/api.js'
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
				// ========== 座位平面图（改这里就能改布局） ==========
				// 规则：
				// 1. 二维数组，每个内层数组 = 平面图上的一排座位（从左到右）
				// 2. 数字 = 座位号（对应后端 sr_seat.seat_num），0 = 空位（占位保持对齐）
				// 3. 从上到下 = 图的上方到下方；0 越多 = 该排越靠右/间隙越大
				// 4. 座位必须都在 1-22 内且不重复，否则点不到/显示错位
				// 示例：[7,8,9] 表示一排三个座位 7 8 9；[7,0,8] 表示 7 和 8 中间隔一个空位
				// ==================================================
				seatLayout: [
					// ===== 静音区(图右上) =====
					[19, 18, 17, 16, 0, 0, 0],   // 上排
					[0, 0, 0, 13, 14, 15, 0],    // 中排
					[22, 21, 20, 0, 0, 0, 0],    // 右墙竖排(图上竖列, 此处近似横排显示)
					// ===== 轻音区(图左中) =====
					[7, 12, 0, 0, 0, 0, 0],      // 7↔12 同排对坐
					[8, 11, 0, 0, 0, 0, 0],      // 8↔11
					[9, 10, 0, 0, 0, 0, 0],      // 9↔10
					[5, 6, 0, 0, 0, 0, 0],       // 轻音区下方
					// ===== 休息区旁 =====
					[1, 2, 3, 4, 0, 0, 0]        // 休息区上方一排
				],
				week: '',
				reservedNum: 0, //已预约
				noReservedNum: 0, //可预约
				seat: {},
				// ===== 座位布局坐标(固定, 从服务器加载) =====
				seatPositions: {} // 座位号 -> {x, y} 百分比坐标(布局图上)
			}
		},
		computed: {
			...mapState(['oneToke', 'store']),
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
				uni.navigateBack()
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
				const params = {
					roomId: id,
					startTime: start,
					endTime: end
				}
				const {
					data: res
				} = await getSeat(params, {
					custom: {
						auth: true
					}
				})
				console.log("所有座位详情", res)
				this.seatCom = res.seatCom
				this.seatVip = res.seatVip
				this.reservedNum = res.reservedNum
				this.noReservedNum = res.noReservedNum
				// 构建 座位号 -> 座位 索引, 供平面图布局按号取座位
				const map = {}
				const all = (res.seatCom || []).concat(res.seatVip || [])
				all.forEach(function(s) {
					if (s && s.seatNum != null) map[String(s.seatNum)] = s
				})
				this.seatMap = map
			},
			getSeatByNum(n) {
				return this.seatMap ? this.seatMap[String(n)] : null
			},
			// ===== 布局图编辑(点图下方文字进入, 拖动座位保存) =====
			// 优先级: 服务器(所有设备共享) > 本地缓存(v3) > 本地旧版(v1/v2迁移) > 默认排布
			async loadPositions() {
				const that = this
				const roomId = this.getRoomId()
				// 1. 先尝试从服务器拉取(解决真机/换机坐标丢失; 该接口免登录白名单, 无需带token)
				try {
					const res = await getSeatPositions({ roomId }, {
						custom: { auth: false, catch: true, toast: false }
					})
					// 兼容三种返回形态: res.data 为对象 / res.data 为JSON字符串 / 旧后端把JSON放 res.msg
					let parsed = null
					const d = res && res.data
					const m = res && res.msg
					if (d && typeof d === 'string' && d.trim()) {
						try { parsed = JSON.parse(d) } catch (e2) {}
					} else if (d && typeof d === 'object') {
						parsed = d
					} else if (m && typeof m === 'string' && m.trim() && m.indexOf('{') === 0) {
						try { parsed = JSON.parse(m) } catch (e2) {}
					}
					if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
						this.seatPositions = parsed
						// 同步到本地缓存(离线/弱网时仍可用)
						uni.setStorageSync('studyroom.seatPositions.v3', parsed)
						return
					}
				} catch (e) {}
				// 2. 本地缓存 v3(最新版: 背景图占满容器, 坐标直接相对背景图)
				let saved = uni.getStorageSync('studyroom.seatPositions.v3')
				if (!saved || typeof saved !== 'object' || Object.keys(saved).length === 0) {
					// v2/v1: 旧版(容器含 padding 12, 背景图 646 从 12 处开始) 数据 → 迁移到背景图坐标系
					const old = uni.getStorageSync('studyroom.seatPositions.v2') ||
						uni.getStorageSync('studyroom.seatPositions.v1')
					if (old && typeof old === 'object' && Object.keys(old).length > 0) {
						saved = {}
						// 旧容器: 宽 670(border-box 含 padding 24), 背景图宽 646 起点 12
						// 新容器: 背景图占满 670, 起点 0 → 新x = (旧x/100*670 - 12)/646*100
						Object.keys(old).forEach(k => {
							const p = old[k]
							if (!p || p.x == null || p.y == null) return
							saved[k] = {
								x: Math.round(((p.x / 100 * 670 - 12) / 646) * 1000) / 10,
								y: Math.round(((p.y / 100 * 725 - 12) / 701) * 1000) / 10
							}
						})
					}
				}
				if (saved && typeof saved === 'object' && Object.keys(saved).length > 0) {
					this.seatPositions = saved
				} else {
					this.buildDefaultPositions()
				}
			},
			getRoomId() {
				try {
					let store = null
					try { store = JSON.parse(uni.getStorageSync('store')) } catch (e) { store = null }
					if (store && store.roomId) return store.roomId
					if (this.store && this.store.roomId) return this.store.roomId
				} catch (e) {}
				return null
			},
			// 从 seatLayout 网格推导初始坐标(第一次进入时用)
			buildDefaultPositions() {
				const pos = {}
				const rows = this.seatLayout.length
				let maxCols = 0
				this.seatLayout.forEach(r => { if (r.length > maxCols) maxCols = r.length })
				this.seatLayout.forEach((row, ri) => {
					row.forEach((n, ci) => {
						if (n) {
							pos[String(n)] = {
								x: Math.round(((ci + 0.5) / maxCols) * 1000) / 10,
								y: Math.round(((ri + 0.5) / rows) * 1000) / 10
							}
						}
					})
				})
				this.seatPositions = pos
			},
			onSeatTap(num) {
				const seat = this.getSeatByNum(num)
				if (seat) this.showSeat(seat)
			}
		},
		onLoad(options) {
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
			const isLogin = uni.getStorageSync('isLogin')
			if (isLogin !== true && isLogin !== 'true' && isLogin !== 1) {
				uni.showModal({
					title: '请先登录',
					content: '预约选座需要先登录，是否前往「我的」页登录？',
					confirmText: '去登录',
					success: (r) => {
						if (r.confirm) {
							uni.switchTab({ url: '/pages/mine/mine' })
						} else {
							uni.navigateBack()
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
				this.loadPositions()
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
		}
	}
</script>

<style lang="scss">
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

	.vip {
		background-color: #FFFFFF;
		border-radius: 20rpx;
		padding-top: 30rpx;
		margin-bottom: 20rpx;
	}

	// 平面图式座位布局: 背景图 + 座位绝对定位
	// 关键: 背景图占满容器(无 padding), 座位百分比直接相对背景图,
	// 编辑模式容器宽度 = 670×scale(背景图等比放大), 非编辑 = 670, 百分比天然一致, 无需任何换算
	.seatmap {
		position: relative;
		background-color: #FFFFFF;
		border-radius: 20rpx;
		margin-bottom: 20rpx;
		overflow: hidden;
		box-sizing: border-box;
	}
	// 编辑模式地图滚动容器(无 padding, 内部 seatmap 直接撑开滚动区域)
	.seat-bg {
		width: 100%;
		display: block;
		border-radius: 12rpx;
	}
	// 座位定位层: 非编辑模式只是透明点击区(未预约时背景图座位号直接可见)
	// 点击区 48rpx 贴合背景图上的座位号方块大小, 避免误触相邻座位
	.seat-abs {
		position: absolute;
		transform: translate(-50%, -50%);
		width: 48rpx;
		height: 48rpx;
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
	.seat-avatar {
		width: 48rpx;
		height: 48rpx;
		border-radius: 50%;
		background-color: #e6e6e6;
		border: 2rpx solid #35a5ed;
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
