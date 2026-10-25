<template>
	<page-meta :page-style="'overflow:'+((show || homeLoading)?'hidden':'visible')">
		<view class="page-bg">
			<book-loading :loading="homeLoading" fullscreen :delay="0" :min-duration="400" text="正在为你准备自习时光…"></book-loading>
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
			<!--
				通知公告(后台「系统管理-通知公告」维护):
				有已发布的公告才显示; 点一下看全文。闭店/临时调整这类通知放这里, 顾客一进首页就能看到。
			-->
			<view v-if="noticeList.length > 0" class="notice-bar" @click="noticeShow = true">
				<u-icon name="bell" color="#ff8215" size="34"></u-icon>
				<text class="notice-bar-text">{{ noticeList[0].contentText || noticeList[0].title }}</text>
				<text class="notice-bar-more">{{ noticeList.length > 1 ? ('共' + noticeList.length + '条') : '详情' }} ›</text>
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
			<!--
				一键开门: 有今日预约 且 后端确认"本机真的开得了门"才显示。
				本机门禁跑的是时之盾私有协议(protocolVersion=0), 服务器指令开不了门(实测回 code 7/2/1),
				厂商文档里的远程开门属于 protocolVersion=1 标准协议。所以按钮默认不显示;
				现场把设备协议改成标准协议并重启, 或加装开门继电器并配好 studyroom.door.open-url 后,
				后端开关一开, 按钮自动出现 —— 无需重新上传小程序。
			-->
			<view v-if="todayBooking && doorOpenEnabled" class="door-open-card">
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
				<view class="promo-heading"><text class="promo-heading-title">热门活动</text><text class="promo-heading-note">答岸 · 自习时光</text></view>
				<view v-for="item in promoList" :key="item.id" class="promo-card" role="button" :aria-label="'查看活动：' + item.title" @click="toPromo(item)">
					<view class="promo-top">
						<view class="promo-image">
							<image v-if="item.imageUrl && !item.imageFailed" :src="item.imageUrl" mode="aspectFit" @error="item.imageFailed = true"></image>
							<text v-else class="promo-image-fallback">答岸</text>
						</view>
						<view class="promo-copy"><text v-if="item.tag" class="promo-tag">{{ item.tag }}</text><text class="promo-title">{{ item.title }}</text><text v-if="item.subtitle" class="promo-subtitle">{{ item.subtitle }}</text></view>
					</view>
					<view class="promo-footer">
						<view v-if="hasPromoPrice(item.price)" class="promo-price"><text class="promo-currency">¥</text><text class="promo-amount">{{ fmtPrice(item.price) }}</text><text class="promo-unit">{{ promoUnit(item.priceUnit, item.price) }}</text><text v-if="hasPromoPrice(item.originalPrice) && Number(item.originalPrice) > Number(item.price)" class="promo-original">¥{{ fmtPrice(item.originalPrice) }}</text></view>
						<text v-else class="promo-price-empty">了解活动与适用规则</text>
						<view class="promo-action"><text>查看详情</text><u-icon name="arrow-right" size="22" color="#2586c5"></u-icon></view>
					</view>
				</view>

		</view>
		<view style="margin-top: 20rpx; padding-bottom: 10rpx; display: flex; justify-content: center;">
			<u-text :bold="false" size="24" color="#353535" align="center" :text="oneToke" />
		</view>
		<!-- 公告详情弹层(纯 view 实现, 与项目里其它弹窗一致, 不额外引组件) -->
		<view v-if="noticeShow" class="notice-mask" @click="noticeShow = false">
			<view class="notice-card" @click.stop>
				<view class="notice-card-title">通知公告</view>
				<scroll-view scroll-y class="notice-card-body">
					<view v-for="(n, ni) in noticeList" :key="ni" class="notice-item">
						<view class="notice-item-title">{{ n.title }}</view>
						<rich-text class="notice-item-content" :nodes="n.content"></rich-text>
						<view v-if="ni < noticeList.length - 1" class="notice-divider"></view>
					</view>
				</scroll-view>
				<view class="notice-card-close" @click="noticeShow = false">关闭</view>
			</view>
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
		getNoticeList,
		getStore,
		getBalance,
		getCard,
		getMyCard,
		myTodaySeat,
		seatPowerOn,
		seatPowerOff,
		accessOpenDoor,
		accessDoorAvailable
	} from '@/config/api.js'
	import { judgeDeviceResult } from '@/utils/device-result.js'
	import { isCardUsable, isCardUnused, cardRemainDays, cardDate } from '@/utils/card-usable.js'
	import { isLoggedIn } from '@/utils/auth.js'
import { runUserGuide } from '@/utils/user-guide.js'
	import { hasPromoPrice, formatPromoPrice, formatPromoUnit } from '@/utils/promo-display.js'
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
			// 一键开门是否可用(后端开关)。本机设备是"时之盾"私有协议(protocolVersion=0),
			// 服务器发不出开门口令, 所以默认 false、按钮不显示; 开关打开后自动出现, 无需重新上传小程序
			doorOpenEnabled: false,
				myCards: [],
				promoList: [],
				promoLoading: false,
				homeLoading: true,
				// 通知公告(后台「系统管理-通知公告」): 最新在前, 首页只显示第一条, 点开看全部
				noticeList: [],
				noticeShow: false
			}
		},
		computed: {
			...mapState(['oneToke', 'store'])
		},
		methods: {
			...mapMutations(['setIndex']),
			async loadHome() {
				this.homeLoading = true
				// 弱网/登录重试时也不让整屏一直停在加载画面。
				this._homeLoadingTimer = setTimeout(() => { if (this._homeAlive) this.homeLoading = false }, 12000)
				try {
					await Promise.all([this.setSwiper(), this.loadPromo(), this.getStoreList()].map(request => request.catch(() => {})))
				} finally {
					clearTimeout(this._homeLoadingTimer)
					this._homeLoadingTimer = null
					if (this._homeAlive) this.homeLoading = false
				}
			},
			cachedStore() {
				try {
					const raw = uni.getStorageSync('store')
					const saved = typeof raw === 'string' ? JSON.parse(raw) : raw
					return saved && saved.roomId ? saved : null
				} catch (error) { return null }
			},
			/**
			 * 首页通知公告(后台「系统管理-通知公告」维护的)。
			 *
			 * 无需登录: 首页对未登录的人也要能看到闭店/临时调整这类通知。
			 * 有已发布公告时首页顶部显示一条公告条(只显示最新一条), 点开看全部全文。
			 */
			async loadNotice() {
				try {
					const res = await getNoticeList({ limit: 5 }, { custom: { catch: true, toast: false } })
					const list = (res && res.data) ? res.data : []
					this.noticeList = (list || []).filter(function(n) {
						return n && (n.title || n.contentText)
					})
				} catch (e) {
					this.noticeList = []
				}
			},
			toCardPromo() {
				uni.navigateTo({
					url: "/other_pages/recharge-card/recharge-card"
				})
			},
			// 首页热门活动(后台可编辑): 取上架中的活动, 无数据则整块不显示
			async loadPromo() {
				if (this.promoLoading) return
				this.promoLoading = true
				try {
					const res = await getPromoList({}, { timeout: 10000, custom: { catch: true, toast: false } })
					const list = (res && res.data) ? res.data : []
					// 配图地址有两种形态(与轮播图同一套约定, 见 setSwiper):
					//   1) /upload/...  —— 后台上传接口返回的本地相对路径 → 拼当前环境域名;
					//   2) http(s)://... —— 云OSS / 静态资源的绝对地址 → 原样使用。
					// 少这一步, 后台新上传的配图在小程序里就是灰色破图(小程序不认相对路径, 只有轮播图补了域名)。
					this.promoList = (list || []).filter(function(p) {
						return p && p.title
					}).map(function(p) {
						var u = p && p.imageUrl
						if (u && u.indexOf('/upload/') === 0) {
							var host = 'https://api.dayousuoan.top'
							try {
								host = require('@/config/config.js').currentHost()
							} catch (e) {}
							u = host + u
						}
						return { ...p, imageUrl: u, imageFailed: false }
					})
				} catch (e) {
					this.promoList = []
				} finally {
					this.promoLoading = false
				}
			},
			// 价格展示: 799 -> 799, 799.5 -> 799.50
			fmtPrice: formatPromoPrice,
			promoUnit: formatPromoUnit,
			hasPromoPrice,
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
						timeout: 10000,
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
				const { data: res } = await getStore({}, { timeout: 10000, custom: { catch: true, toast: false } })
				const rows = res && Array.isArray(res.rows) ? res.rows : []
				const store = this.cachedStore()
				if (!store && rows.length) {
					const val = rows[0]
					this.$store.commit('setStore', val)
					console.log('this.store', this.store)
					uni.setStorageSync('store', JSON.stringify(val))
					this.$store.dispatch('setStore', val)
				} else if (store) {
					this.$store.dispatch('setStore', store)
				}
				this.$store.commit('setStoreList', rows)
				this.storeList = rows
			},
			/**
			 * 清空"只有登录用户才有"的页面数据(退出登录 / 登录态失效时调用)。
			 *
			 * 注意这些都是页面 data, 不是缓存 —— 退出登录时 mine.vue 只做了 clearStorageSync(),
			 * 而首页 onShow 不会重建页面实例, 所以 myCards 会一直是上一个账号的值:
			 * 表现就是"已经退出登录了, 回到首页还在显示我的周期卡"。
			 */
			clearUserState() {
				this.myCards = []
				this.todayBooking = null
				this.doorOpenEnabled = false
				// 余额/卡券还留在 vuex 与缓存里, 一并复位, 免得其它页面读到上一个账号的数据
				try {
					this.$store.commit('logout')
					this.$store.commit('setBalance', 0)
					this.$store.commit('setCard', [])
				} catch (e) {}
				try {
					uni.removeStorageSync('balance')
					uni.removeStorageSync('card')
				} catch (e) {}
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
						// 只清"账号数据", 绝不要 uni.clearStorageSync() 一锅端:
						// request.js 的 401 静默重登可能刚换到新 token, 一锅端会把新 token 一起清掉,
						// 结果就是"明明已登录, 进预约页却被拦请先登录, 退掉再登才好"(实测踩过)。
						this.clearUserState()
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
			 * 查询「一键开门」当前是否可用, 决定按钮显不显示。
			 *
			 * 为什么要有这道闸门: 本机门禁设备跑的是"时之盾"私有协议(protocolVersion=0),
			 * 服务器发不出开门口令 —— 实测把厂商文档里的任何指令发过去, 分别被回
			 * code 7(不认该动作)/code 2(报文格式)/code 1(拒绝); 设备也从未订阅文档协议的 cs 主题。
			 * 厂商文档里的远程开门属于 protocolVersion=1 标准协议。
			 * 所以按钮默认不显示, 免得用户点了却开不了门。现场把设备协议改成标准协议并重启、
			 * 或加装继电器并配好 studyroom.door.open-url 后, 后端开关打开, 按钮自动出现。
			 */
			async loadDoorAvailable() {
				try {
					const res = await accessDoorAvailable({}, { custom: { catch: true } })
					this.doorOpenEnabled = !!(res && res.code === 200 && res.data === true)
				} catch (e) {
					this.doorOpenEnabled = false
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
			this._homeAlive = true
			const store = this.cachedStore()
			if (store) this.$store.dispatch('setStore', store)
			this.loadHome()
		},
		onUnload() { this._homeAlive = false; clearTimeout(this._homeLoadingTimer) },
		onShow() {
			this.setIndex(0)
			// 公告: 无需登录, 每次进首页都拉一次(闭店/临时调整这类通知要新鲜)
			this.loadNotice()
			// 只在已登录时查开门可用性: 未登录时这个接口必然 401, 会白白触发一次静默重登
			// (而每次静默重登都会把上一个 token 顶下线 —— 别在首页制造这种无意义的 401)
			if (isLoggedIn()) {
				this.loadDoorAvailable()
			}
			// 登录态只看 token(见 utils/auth.js):
			// isLogin 缓存标记与真实登录态可能不同步(静默重登 / 401 清缓存路径), 会错判成"未登录"
			if (isLoggedIn()) {
				this.getAccount()
				this.loadMyCards()
				this.loadTodayBooking()
				// 新人引导(还没弹过的) / 未录人脸提醒: 每次进首页检查, 同一天最多提醒一次
				runUserGuide()
			} else {
				// 退出登录(或被踢下线)后回到首页: 必须清掉上一个账号残留的"内存数据"。
				// 首页走的是 onShow —— 页面实例不会重建, 退出时只 clearStorageSync() 清缓存并不够,
				// 否则会继续显示"我的周期卡""今日预约"等上一个账号的内容(实测就是这样)。
				this.clearUserState()
			}
			const store = this.cachedStore()
			if (store) this.$store.dispatch('setStore', store)
		}
	}
</script>

<style lang="scss">
	// 页面背景由根容器设置（避免标签选择器在组件wxss中不被允许的警告）
	.page-bg {
		min-height: 100vh;
		background-color: $u-bg-color;
	}

	.content-hot { margin: 40rpx 40rpx 0; }
	.content-hot .promo-heading { display: flex; align-items: center; justify-content: space-between; margin-bottom: 36rpx; }
	.content-hot .promo-heading-title { color: #26394c; font-size: 36rpx; font-weight: 600; }
	.content-hot .promo-heading-note { margin-left: 24rpx; color: #7d8c9c; font-size: 22rpx; }
	.content-hot .promo-card { box-sizing: border-box; padding: 32rpx; margin-bottom: 32rpx; background: #ffffff; color: #26394c; border-radius: 34rpx; box-shadow: 0 8rpx 36rpx rgba(37,69,95,.035); }
	.content-hot .promo-top { display: flex; align-items: center; }
	.content-hot .promo-image { display: flex; align-items: center; justify-content: center; width: 176rpx; height: 200rpx; flex-shrink: 0; overflow: hidden; border-radius: 22rpx; background: #f0f6fa; }
	.content-hot .promo-image image { display: block; width: 100%; height: 100%; }
	.content-hot .promo-image-fallback { padding: 20rpx; color: #6c92ae; font-size: 28rpx; line-height: 44rpx; text-align: center; white-space: pre-line; }
	.content-hot .promo-copy { flex: 1; min-width: 0; margin-left: 28rpx; }
	.content-hot .promo-tag { display: inline-block; padding: 6rpx 14rpx; border-radius: 10rpx; background: #edf7fe; color: #2586c5; font-size: 22rpx; line-height: 32rpx; }
	.content-hot .promo-title { display: block; margin-top: 14rpx; color: #26394c; font-size: 32rpx; font-weight: 600; line-height: 48rpx; word-break: break-word; }
	.content-hot .promo-subtitle { display: block; margin-top: 10rpx; color: #738293; font-size: 24rpx; line-height: 40rpx; word-break: break-word; }
	.content-hot .promo-footer { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; margin-top: 30rpx; padding-top: 24rpx; border-top: 1rpx solid #edf1f5; }
	.content-hot .promo-price { display: flex; flex-wrap: wrap; align-items: baseline; color: #ac5d29; }
	.content-hot .promo-currency { font-size: 28rpx; margin-right: 6rpx; }
	.content-hot .promo-amount { font-size: 54rpx; line-height: 66rpx; font-weight: 600; }
	.content-hot .promo-unit { margin-left: 6rpx; color: #738293; font-size: 24rpx; }
	.content-hot .promo-original { margin-left: 18rpx; color: #97a2ae; font-size: 22rpx; text-decoration: line-through; }
	.content-hot .promo-price-empty { color: #738293; font-size: 22rpx; }
	.content-hot .promo-action { display: flex; align-items: center; flex-shrink: 0; min-height: 60rpx; margin-left: 12rpx; color: #2586c5; font-size: 24rpx; }
	.content-hot .promo-action text { margin-right: 12rpx; }

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

	// 首页通知公告条(后台通知公告维护; 只有已发布的才显示)
	.notice-bar {
		display: flex;
		align-items: center;
		margin: 0 40rpx 10rpx 40rpx;
		padding: 18rpx 24rpx;
		background-color: #fff8ec;
		border-radius: 16rpx;
	}

	.notice-bar-text {
		flex: 1;
		margin: 0 12rpx;
		font-size: 26rpx;
		color: #8a5a00;
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
	}

	.notice-bar-more {
		font-size: 24rpx;
		color: #ff8215;
	}

	// 公告详情弹层
	.notice-mask {
		position: fixed;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		z-index: 9999;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.notice-card {
		width: 620rpx;
		max-height: 72vh;
		background: #ffffff;
		border-radius: 20rpx;
		padding: 30rpx;
		display: flex;
		flex-direction: column;
	}

	.notice-card-title {
		font-size: 32rpx;
		font-weight: bold;
		color: #303133;
		text-align: center;
	}

	.notice-card-body {
		margin-top: 20rpx;
		max-height: 52vh;
	}

	.notice-item-title {
		font-size: 28rpx;
		font-weight: bold;
		color: #303133;
		margin-bottom: 10rpx;
	}

	.notice-item-content {
		font-size: 26rpx;
		color: #606266;
		line-height: 1.7;
	}

	.notice-divider {
		height: 1rpx;
		background: #eeeeee;
		margin: 24rpx 0;
	}

	.notice-card-close {
		margin-top: 20rpx;
		padding-top: 16rpx;
		border-top: 1rpx solid #f0f0f0;
		text-align: center;
		color: #35a5ed;
		font-size: 28rpx;
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
