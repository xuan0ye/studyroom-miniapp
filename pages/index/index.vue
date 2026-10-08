<template>
	<page-meta :page-style="'overflow:'+(show?'hidden':'visible')">
		<view class="page-bg">
			<view>
				<my-navbar leftText=" " :storeName="store.roomName || ''" :custom="true" :autoBack="false" :show="show"
					@changeShow="changeShow">
				</my-navbar>
			</view>
			<view style="padding: 40rpx 40rpx 30rpx 40rpx;">
				<swiper class="home-swiper" indicator-dots indicator-color="rgba(255,255,255,0.4)"
					indicator-active-color="#ffffff" circular autoplay interval="4000" duration="500">
					<swiper-item v-for="(banner, bi) in swiperList" :key="bi">
						<image class="home-swiper-img" :src="banner.url" mode="scaleToFill"></image>
					</swiper-item>
				</swiper>
			</view>
			<view>
				<my-index-card></my-index-card>
			</view>
			<!-- 今日预约座位灯光控制 -->
			<view v-if="todayBooking" class="today-light-card">
				<view class="today-light-left">
					<view class="today-light-title">
						<u-icon name="server-man" color="#35a5ed" size="34"></u-icon>
						<u-text :bold="true" size="30" color="#333" text="今日预约" style="margin-left: 10rpx;" />
					</view>
					<view style="margin-top: 8rpx;">
						<u-text size="26" color="#666" :text="'座位：' + (todayBooking.seatNum ? todayBooking.seatNum + ' 号' : '未选座位')" />
					</view>
					<view style="margin-top: 4rpx;" v-if="todayBooking.checkInTime">
						<u-text size="24" color="#4facfe" :text="'已签到：' + fmtTime(todayBooking.checkInTime)" />
					</view>
				</view>
				<view class="today-light-right">
					<u-button size="small" type="primary" color="#35a5ed" shape="circle"
						:loading="lightLoading === 'on'" @click="lightOn" text="开灯" />
					<u-button size="small" type="default" shape="circle"
						:loading="lightLoading === 'off'" @click="lightOff" text="关灯" style="margin-left: 16rpx;" />
				</view>
			</view>
			<!-- 一键开门: 有今日预约才显示(后端也只放行当天有有效预约的人) -->
			<view v-if="todayBooking" class="door-open-card">
				<view class="door-open-left">
					<u-icon name="home" color="#19be6b" size="34"></u-icon>
					<view style="margin-left: 12rpx;">
						<u-text :bold="true" size="30" color="#333" text="到店开门" />
						<view style="margin-top: 4rpx;">
							<u-text size="22" color="#909399" text="门口点一下即可开门；刷脸也能进" />
						</view>
					</view>
				</view>
				<u-button size="small" type="success" color="#19be6b" shape="circle"
					:loading="doorLoading" @click="openDoor" text="一键开门" />
			</view>
			<!-- 我的周期卡(周卡/月卡: 开卡日期/到期日期/锁座状态) -->
			<view v-if="myCards.length > 0" class="my-card-status">
				<view class="my-card-status-title">
					<u-icon name="gift" color="#e6a23c" size="30"></u-icon>
					<u-text :bold="true" size="28" color="#333" text="我的周期卡" style="margin-left: 8rpx;" />
				</view>
				<view v-for="(mc, mi) in myCards" :key="mi" class="my-card-status-item">
					<view class="my-card-status-left">
						<u-text :bold="true" size="28" color="#35a5ed" :text="mc.cardTitle" />
						<view style="margin-top: 6rpx;">
							<u-text size="24" color="#666" :text="mc.unused ? ('未使用 · 首次预约后 ' + mc.remainDays + ' 天有效') : ('开卡：' + mc.startLabel + '　到期：' + mc.expiryLabel)" />
						</view>
						<view style="margin-top: 4rpx;">
							<u-text size="22" color="#999" :text="'剩余 ' + mc.remainDays + ' 天'" />
						</view>
					</view>
					<view class="my-card-status-right">
						<u-tag v-if="mc.locked" text="已锁座" type="warning" size="mini" />
						<u-tag v-else text="可用" type="success" size="mini" />
					</view>
				</view>
				<view class="my-card-status-tip">
					<u-text size="22" color="#9a9a9a" text="周卡/月卡一次预约即锁定整个周期，无需每天重复预约；到店在下方开灯即可" />
				</view>
			</view>
			<!-- 门禁人脸入口 -->
			<view>
				<my-index-ER></my-index-ER>
			</view>
			<!-- 热门活动(内容由后台「门店管理→热门活动」维护, 无数据则整块不显示) -->
			<view class="content-hot" v-if="promoList.length > 0">
				<view>
					<u-text :bold="true" size="24" color="#6a6a6a" :selectable="false" text="热门活动" />
				</view>
				<view class="hot-list" v-for="(item, pi) in promoList" :key="pi">
					<view style="margin-bottom: 40rpx;">
						<view class="hot-list-item" @click="toPromo(item)">
							<u-row gutter="6rpx">
								<u-col span="8">
									<view style="margin-left: 20rpx; margin-top: 30rpx;">
										<u-text :bold="true" size="36" color="#0f0f0f" :text="item.title" />
									</view>
									<view style="margin-left: 20rpx; margin-top: 12rpx;" v-if="item.subtitle">
										<u-text size="24" color="#8a8a8a" :text="item.subtitle" />
									</view>
									<view style="display: flex; align-items: center; margin-left: 20rpx; margin-top: 18rpx;">
										<u-text :bold="true" size="40" color="#fe2c55" :text="'¥' + fmtPrice(item.price)" />
										<u-text size="22" color="#8a8a8a" :text="item.priceUnit || ''"
											style="margin-left: 6rpx;" />
										<u-text v-if="item.originalPrice" size="22" color="#bbbbbb"
											:text="'原价 ¥' + fmtPrice(item.originalPrice)"
											style="margin-left: 14rpx; text-decoration: line-through;" />
									</view>
								</u-col>
								<u-col span="4">
									<view style="margin-right: 40rpx;">
										<u-image v-if="item.imageUrl" :src="item.imageUrl" mode="aspectFit"
											height="210rpx" width="210rpx"></u-image>
									</view>
								</u-col>
							</u-row>
						</view>
						<view style="display: flex; align-items: center;" @click="toPromo(item)">
							<u-icon name="arrow-rightward" size="32" label="查看详情" :bold="true" labelSize="26"
								labelColor="#35a5ed" labelPos="left"></u-icon>
							<view v-if="item.tag" style="margin-left: 16rpx;">
								<u-tag :text="item.tag" type="warning" size="mini" />
							</view>
						</view>
					</view>
				</view>

		</view>
		<view style="margin-top: 20rpx; padding-bottom: 10rpx; display: flex; justify-content: center;">
			<u-text :bold="false" size="24" color="#353535" align="center" :text="oneToke" />
		</view>
		<my-tabbar></my-tabbar>
			<view style="max-height: 300rpx;">
				<my-action-sheet :show="show" :list="storeList" @closeShow="closeShow"></my-action-sheet>
			</view>
		</view>
	</page-meta>

</template>

<script>
	import {
		getHitokoto
	} from 'common/request/api/hitokoto.js'
	import {
		mapState,
		mapMutations
	} from 'vuex'
	import {
		getSwiper,
		getPromoList,
		getStore,
		getBalance,
		getCard,
		getMyCard,
		myTodaySeat,
		seatPowerOn,
		seatPowerOff,
		accessOpenDoor
	} from '@/config/api.js'
	import { judgeDeviceResult } from '@/utils/device-result.js'
	import { isCardUsable, isCardUnused, cardRemainDays, cardDate } from '@/utils/card-usable.js'
import { runUserGuide } from '@/utils/user-guide.js'
	export default {
		data() {
			return {
				swiperList: [],
				show: false,
				storeList: [],
				todayBooking: null,
				lightLoading: '',
			// 一键开门(仅当天有有效预约时可点; 后端也会再校验一次)
			doorLoading: false,
				myCards: [],
				promoList: []
			}
		},
		computed: {
			...mapState(['oneToke', 'store'])
		},
		methods: {
			...mapMutations(['setIndex']),
			toCardPromo() {
				uni.navigateTo({
					url: "/other_pages/recharge-card/recharge-card"
				})
			},
			// 首页热门活动(后台可编辑): 取上架中的活动, 无数据则整块不显示
			async loadPromo() {
				try {
					const res = await getPromoList({}, { custom: { catch: true, toast: false } })
					const list = (res && res.data) ? res.data : []
					this.promoList = (list || []).filter(function(p) {
						return p && p.title
					})
				} catch (e) {
					this.promoList = []
				}
			},
			// 价格展示: 799 -> 799, 799.5 -> 799.50
			fmtPrice(v) {
				if (v === null || v === undefined || v === '') return ''
				const n = Number(v)
				if (isNaN(n)) return String(v)
				return n % 1 === 0 ? String(n) : n.toFixed(2)
			},
			// 点击活动: 优先用后台配置的跳转路径, 没配则去卡券套餐
			toPromo(item) {
				const url = item && item.linkUrl ? String(item.linkUrl) : ''
				if (!url) {
					this.toCardPromo()
					return
				}
				const tabBars = ['/pages/index/index', '/pages/order/order', '/pages/mine/mine']
				if (tabBars.indexOf(url) !== -1) {
					uni.switchTab({ url: url })
				} else {
					uni.navigateTo({
						url: url,
						fail: () => {
							uni.$u.toast('该活动暂未开放，请联系客服')
						}
					})
				}
			},
			changeShow() {
				this.show = true
				console.log(" index show = " + this.show)

			},
			closeShow() {
				this.show = false;
				console.log("index closeShow " + this.show)
			},
			async setSwiper() {
				try {
					const {
						data: res
					} = await getSwiper({}, {
						custom: {
							auth: true,
							catch: true
						}
					})
					// 后端有轮播图则用之; 否则回退到本地静态轮播图(微信上传的三张宣传图)
					if (res && res.length > 0) {
						// 轮播图 url 三种情况:
						// 1. /upload/... 后端本地存储 → 拼服务器域名
						// 2. /static/... 小程序包内静态资源 → 保持原样(绝对不可拼域名!)
						// 3. http(s) 云OSS 绝对地址 → 保持原样
						this.swiperList = res.map(function(item) {
							var u = item.url
							if (u && u.indexOf('/upload/') === 0) {
								// 按当前环境拼根地址(dev=本地后端, 真机/生产=线上), 否则 dev 模式加载线上404
								var host = 'https://api.dayousuoan.top'
								try {
									host = require('@/config/config.js').currentHost()
								} catch (e) {}
								item.url = host + u
							}
							return item
						})
					} else {
						this.swiperList = [{
							url: 'https://api.dayousuoan.top/upload/appstatic/index/banner1.jpg'
						}, {
							url: 'https://api.dayousuoan.top/upload/appstatic/index/banner2.jpg'
						}, {
							url: 'https://api.dayousuoan.top/upload/appstatic/index/banner3.jpg'
						}]
					}
				} catch (e) {
					// 接口失败也用本地图兜底
					this.swiperList = [{
						url: 'https://api.dayousuoan.top/upload/appstatic/index/banner1.jpg'
					}, {
						url: 'https://api.dayousuoan.top/upload/appstatic/index/banner2.jpg'
					}, {
						url: 'https://api.dayousuoan.top/upload/appstatic/index/banner3.jpg'
					}]
				}
			},
			async getStoreList() {
				const {
					data: res
				} = await getStore()
				console.log(res)
				const store = uni.getStorageSync('store')
				console.log('store----', store)
				if (store == null || store == '') {
					const val = res.rows[0]
					this.$store.commit('setStore', val)
					console.log('this.store', this.store)
					uni.setStorageSync('store', JSON.stringify(val))
					this.$store.dispatch('setStore', val)
				} else {
					this.$store.dispatch('setStore', JSON.parse(store))
				}
				this.$store.commit('setStoreList', res.rows)
				this.storeList = res.rows
			},
			async getAccount() {
				let account = {
					balance: null,
					card: null
				};
				try {
					const {
						data: balance
					} = await
					getBalance({}, {
						custom: {
							auth: true,
							catch: true
						}
					})
					const {
						data: card
					} = await getCard({}, {
						custom: {
							auth: true,
							catch: true
						}
					})
					console.log(balance, card)
					this.$store.dispatch("getBalance", balance.balance)
					uni.setStorageSync('balance', balance.balance)
					this.$store.dispatch("getCard", card)
					uni.setStorageSync('card', JSON.stringify(card))
				} catch (res) {
					if (res.code == 401) {
						uni.clearStorageSync()
					}
				}
			},
			// 加载今天待使用的预约(用于主页开灯按钮)
			async loadTodayBooking() {
				// 用"今日座位"接口: 覆盖周卡/月卡锁座期(锁座期间每天显示灯控按钮) + 今日预约
				try {
					const res = await myTodaySeat({ custom: { auth: true, catch: true, toast: false } })
					const list = (res && res.data) ? res.data : []
					if (list && list.length > 0) {
						this.todayBooking = list[0]
					} else {
						this.todayBooking = null
					}
				} catch (e) {
					// 接口不可用回退旧逻辑(按天预约当天)
					try {
						const { data: list2 } = await uni.$u.http.get('/api/wx/daily/record', {
							custom: { auth: true, catch: true, toast: false }
						})
						var d = new Date()
						var pad = function(n) { return n < 10 ? '0' + n : '' + n }
						var today = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
						var arr = list2 || []
						var found = null
						for (var i = 0; i < arr.length; i++) {
							var it = arr[i]
							if (it.status === 0 && it.seatId && String(it.consumptionDate || '').indexOf(today) === 0) {
								found = it
								break
							}
						}
						this.todayBooking = found
					} catch (e2) {
						this.todayBooking = null
					}
				}
			},
			fmtTime(t) {
				if (!t) return ''
				const dt = new Date(String(t).replace(/-/g, '/'))
				const pad = function(n) { return n < 10 ? '0' + n : '' + n }
				return pad(dt.getHours()) + ':' + pad(dt.getMinutes()) + ':' + pad(dt.getSeconds())
			},
			async lightOn() {
				if (!this.todayBooking) return
				this.lightLoading = 'on'
				try {
					const res = await seatPowerOn({ seatId: this.todayBooking.seatId }, { custom: { auth: true, catch: true } })
					const r = judgeDeviceResult(res, '座位灯已开启')
					uni.$u.toast(r.msg)
					if (r.ok) {
						this.loadTodayBooking()
					}
				} catch (e) {
					uni.$u.toast((e && e.msg) || '开灯失败，请稍后再试')
				} finally {
					this.lightLoading = ''
				}
			},
			/**
			 * 一键开门: 有今日有效预约才能开(后端也会再校验"当天有有效预约", 没有会如实报错)。
			 * 后端是等设备回执 result=0 才算成功的 —— 返回成功就是门真的开了, 不是"指令已下发"。
			 */
			async openDoor() {
				if (this.doorLoading) return
				this.doorLoading = true
				try {
					const res = await accessOpenDoor({}, { custom: { auth: true, catch: true } })
					if (res && res.code === 200 && res.data === true) {
						uni.$u.toast('门已打开，请推门进入')
					} else {
						uni.$u.toast((res && res.msg) || '开门失败，请到门口刷脸或联系工作人员')
					}
				} catch (e) {
					uni.$u.toast((e && e.msg) || '开门失败，请到门口刷脸或联系工作人员')
				} finally {
					this.doorLoading = false
				}
			},
			async lightOff() {
				if (!this.todayBooking) return
				this.lightLoading = 'off'
				try {
					const res = await seatPowerOff({ seatId: this.todayBooking.seatId }, { custom: { auth: true, catch: true } })
					const r = judgeDeviceResult(res, '座位灯已关闭')
					uni.$u.toast(r.msg)
				} catch (e) {
					uni.$u.toast((e && e.msg) || '关灯失败，请稍后再试')
				} finally {
					this.lightLoading = ''
				}
			},
			// 加载我的周期卡(周卡/月卡)信息: 开卡日期/到期日期/锁座状态
			async loadMyCards() {
				try {
					const res = await getMyCard({}, {
						custom: { auth: true, catch: true, toast: false }
					})
					const list = res && res.data ? res.data : res
					if (!list || !list.length) {
						this.myCards = []
						return
					}
					const now = new Date()
					this.myCards = list.filter(function(c) {
						// 周卡(term 7)/月卡长期卡(term>=30)/固定区间卡(如中秋国庆畅享券)
						if (!c.card) return false
						const fixed = !!(c.card.validEnd)
						const term = parseInt(c.card.term)
						if (!fixed && term !== 7 && term < 30) return false
						// 可用口径统一: 未激活(买来还没用过)的卡不过期, 已用完/已过期的卡不展示
						return isCardUsable(c)
					}).map(function(c) {
						const unused = isCardUnused(c)
						const remainDays = cardRemainDays(c)
						const expiry = cardDate(c.expiryTime)
						const start = c.createTime ? new Date(String(c.createTime).replace(/-/g, '/')) : now
						let locked = false
						if (c.lockSeatId && c.lockEndTime) {
							const lockEnd = cardDate(c.lockEndTime)
							locked = !!(lockEnd && lockEnd > new Date())
						}
						return {
							id: c.id,
							cardTitle: c.card.cardTitle || '周期卡',
							startLabel: (start.getMonth() + 1) + '月' + start.getDate() + '日',
							expiryLabel: expiry ? ((expiry.getMonth() + 1) + '月' + expiry.getDate() + '日') : '待启用',
							remainDays: remainDays,
							unused: unused,
							locked: locked
						}
					})
				} catch (e) {
					this.myCards = []
				}
			}

		},
		onLoad() {
			this.setSwiper()
			this.loadPromo()
			this.getStoreList()
			const store = uni.getStorageSync('store')
			if (store != null && store != '') {
				console.log('onLoad store---', store)
				this.$store.dispatch('setStore', JSON.parse(store))
			}

		},
		onShow() {
			this.setIndex(0)
			const isLogin = uni.getStorageSync('isLogin')
			if (isLogin == true) {
				this.getAccount()
				this.loadMyCards()
				// 新人引导(还没弹过的) / 未录人脸提醒: 每次进首页检查, 同一天最多提醒一次
				runUserGuide()
			}
			this.loadTodayBooking()
			const store = uni.getStorageSync('store')
			if (store != null && store != '') {
				console.log('onShow store---', store)
				this.$store.dispatch('setStore', JSON.parse(store))
			}
		}
	}
</script>

<style lang="scss">
	// 页面背景由根容器设置（避免标签选择器在组件wxss中不被允许的警告）
	.page-bg {
		min-height: 100vh;
		background-color: $u-bg-color;
	}

	.content-hot {
		margin: auto 40rpx;
		margin-top: 40rpx;

	}

	.hot-list {}

	.hot-list-item {
		// position: relative;
		padding: auto 20rpx;
		margin: 20rpx auto;
		height: 210rpx;
		background-color: #FFFFFF;
		border-radius: 20rpx;
	}

	.item-image {
		// position: absolute;

	}

	.today-light-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 0 40rpx;
		margin-top: 30rpx;
		padding: 26rpx 30rpx;
		background-color: #ffffff;
		border-radius: 20rpx;
		box-shadow: 0 6rpx 20rpx rgba(53, 165, 237, 0.12);
	}

	// 一键开门(有今日预约才显示)
	.door-open-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin: 0 40rpx;
		margin-top: 20rpx;
		padding: 26rpx 30rpx;
		background-color: #ffffff;
		border-radius: 20rpx;
		box-shadow: 0 6rpx 20rpx rgba(25, 190, 107, 0.12);
	}

	.door-open-left {
		display: flex;
		align-items: center;
	}

	// 我的周期卡卡片
	.my-card-status {
		margin: 0 40rpx;
		margin-top: 30rpx;
		padding: 26rpx 30rpx;
		background-color: #ffffff;
		border-radius: 20rpx;
		box-shadow: 0 6rpx 20rpx rgba(230, 162, 60, 0.12);
	}

	.my-card-status-title {
		display: flex;
		align-items: center;
		margin-bottom: 18rpx;
	}

	.my-card-status-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16rpx 0;
		border-top: 2rpx solid #f5f5f5;
	}

	.my-card-status-left {
		flex: 1;
		margin-right: 16rpx;
	}

	.my-card-status-right {
		flex-shrink: 0;
	}

	.my-card-status-tip {
		margin-top: 14rpx;
		padding-top: 14rpx;
		border-top: 2rpx solid #f5f5f5;
	}

	.home-swiper {
		width: 100%;
		height: 480rpx;
		border-radius: 16rpx;
		overflow: hidden;
	}

	.home-swiper-img {
		width: 100%;
		height: 480rpx;
		border-radius: 16rpx;
	}

	.today-light-left {
		flex: 1;
	}

	.today-light-title {
		display: flex;
		align-items: center;
	}

	.today-light-right {
		display: flex;
		align-items: center;
		margin-left: 20rpx;
	}
</style>
