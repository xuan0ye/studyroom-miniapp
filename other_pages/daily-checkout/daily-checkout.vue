<template>
	<view>
		<my-navbar leftText="日卡预约" leftIcon="arrow-left" :custom="false" :autoBack="true" leftIconSize="40" />
		<view class="container">
			<view class="info-card">
				<view class="info-row">
					<u-text :bold="true" size="32" :text="storeName" />
				</view>
				<view class="info-row">
					<u-text size="28" color="#666" :text="'座位：' + seatNum" />
				</view>
				<view class="info-row">
					<u-text size="28" color="#666" :text="'日期：' + today" />
				</view>
				<u-divider />
				<view class="price-row">
					<u-text size="28" color="#333" text="价格" />
					<u-text :bold="true" size="36" color="#35a5ed" :text="'¥' + (showPriceFen / 100).toFixed(2)" />
				</view>
			</view>

			<view class="section">
				<u-text :bold="true" size="28" color="#333" text="选择卡券（日卡/周卡）" />
				<view style="height: 20rpx;" />
				<view v-if="dayCards.length > 0">
					<view class="card-item" v-for="card in dayCards" :key="card.id"
						:class="{ selected: selectedCardId === card.id, locked: card.locked }"
						@click="selectCard(card)">
						<u-row align="center">
							<u-col :span="2">
								<u-icon :name="selectedCardId === card.id ? 'checkmark-circle-fill' : 'checkmark-circle'" 
									:color="selectedCardId === card.id ? '#35a5ed' : '#ccc'" size="44" />
							</u-col>
							<u-col :span="6">
								<u-text :bold="true" size="28" :text="card.cardTitle" />
								<u-text size="24" color="#999" :text="card.windowText ? (card.windowText + ' 可用 · 每天单独预约') : (card.unused ? ('未使用 · 首次预约后 ' + card.remainDays + ' 天有效') : (card.term === 7 ? ('7天有效，剩 ' + card.remainDays + ' 天') : (card.remainDays + ' 天剩余')))" />
								<view v-if="card.locked" style="margin-top: 4rpx;">
									<u-text size="22" color="#e6a23c" :text="card.lockEndLabel + '，期间无需重复预约'" />
								</view>
							</u-col>
							<u-col :span="4" textAlign="right">
								<u-tag :type="card.locked ? 'warning' : 'success'" size="mini" :text="card.locked ? '已锁座' : '可用'" />
							</u-col>
						</u-row>
					</view>
				</view>
				<view v-else class="empty-state">
					<u-empty text="暂无可用卡券" mode="list" />
					<u-text size="24" color="#999" text="请先购买日卡或周卡" align="center" />
						<view style="margin-top: 24rpx;">
							<u-button color="#35a5ed" size="medium" text="去购买" @click="goBuyCard" />
						</view>
				</view>
			</view>

			<!-- 选择座位: 没有从选座页带座位号进来时(如"预约今天"入口)在本页选座 -->
			<view class="section" v-if="!routeSeat">
				<u-text :bold="true" size="28" color="#333"
					:text="selectedWindowDays() > 1 ? ('选择座位（该卡需连续锁定 ' + selectedWindowDays() + ' 天，只显示整段空着的座位）') : '选择座位'" />
				<view v-if="areaTip" style="margin-top: 8rpx;">
					<u-text size="24" color="#e6a23c" :text="areaTip" />
				</view>
				<view style="margin-top: 10rpx;">
					<u-text size="24" color="#999" :text="seatId ? ('已选：' + seatNum + ' 号座位') : '请点击下方座位号选择'" />
				</view>
				<view v-if="seatLoading" style="margin-top: 16rpx;">
					<u-text size="24" color="#999" text="正在查询可用座位..." />
				</view>
				<view v-else-if="visibleSeats.length === 0" style="margin-top: 16rpx;">
					<u-text size="24" color="#999"
						:text="hasRoom ? '该时段暂无可选座位，请更换日期或联系门店' : '未获取到门店信息，请返回首页重新选择门店'" />
				</view>
				<view v-else class="seat-grid" style="margin-top: 16rpx;">
					<view class="seat-chip" :class="{ 'seat-chip-on': seatId === s.seatId }" v-for="s in visibleSeats"
						:key="s.seatId" @click="pickSeat(s)">
						<u-text size="26" :bold="seatId === s.seatId"
							:color="seatId === s.seatId ? '#ffffff' : '#333333'" :text="s.seatNum + '号'" />
					</view>
				</view>
			</view>

			<view style="margin-top: 40rpx;">
				<u-button type="primary" color="#35a5ed" size="large" 
					:disabled="!selectedCardId || !seatId" :loading="submitting"
					@click="confirmCheckout" text="确认预约" />
			</view>

			<view style="height: 20rpx;" />
			<u-button type="default" size="large" @click="goBack" text="返回" />
		</view>
	</view>
</template>

<script>
	import { dailyConfig, dailyOrder, getMyCard, getSeat } from '@/config/api.js'
	import { isCardUsable, isCardUnused, cardRemainDays, cardDate, cardLockDays, cardWindowText } from '@/utils/card-usable.js'
	export default {
		data() {
			return {
				storeName: '',
				seatNum: '',
				seatId: '',
				roomId: '',
				today: '',
				dateStr: '',
				dailyPrice: 2000,
				dayCards: [],
				selectedCardId: null,
				submitting: false,
				routeSeat: false,      // 从选座页带座位号进来时为 true(不再显示选座区)
				seatList: [],          // 可选座位(已按所选卡券的锁定时长过滤)
				seatLoading: false
			}
		},
		methods: {
			async loadConfig() {
				try {
					const { data: config } = await dailyConfig({ roomId: this.roomId }, { custom: { auth: true } })
					if (config && config.length > 0) {
						const priceConf = config.find(function(c) { return c.configKey === 'daily_price' })
						if (priceConf) this.dailyPrice = parseInt(priceConf.configValue) || 2000
					}
				} catch (e) {}
			},
			async loadDayCards() {
				try {
					const { data: card } = await getMyCard({}, { custom: { auth: true, 'catch': true } })
					if (card && card.length > 0) {
						const now = new Date()
						this.dayCards = card.filter(function(c) {
							// 可用卡统一口径(与后端一致): 未激活的卡不过期, 已用完/已过期的卡不展示;
							// 区域限制与时段冲突由后端 bookByDayCard 统一校验, 前端不再按 term 写死卡种
							return isCardUsable(c)
						}).map(function(c) {
							const now = new Date()
							const remainDays = cardRemainDays(c)
							const unused = isCardUnused(c)
							// 周卡已锁座: lockEndTime 在未来 => 该卡已锁定座位, 期间无需重复预约
							let locked = false
							let lockEndLabel = ''
							if (c.lockSeatId && c.lockEndTime) {
								const lockEnd = cardDate(c.lockEndTime)
								if (lockEnd && lockEnd > now) {
									locked = true
									lockEndLabel = '已锁座至 ' + (lockEnd.getMonth() + 1) + '月' + lockEnd.getDate() + '日'
								}
							}
							return {
								id: c.id,
								priceFen: c.card.price ? Math.round(parseFloat(c.card.price) * 100) : 0,
								cardTitle: c.card.cardTitle,
								remainDays: remainDays,
								// 一次预约锁定的天数: 固定区间卡=1天(每天单独预约), 周卡=7天, 月卡=剩余天数
								lockDays: cardLockDays(c),
								windowText: cardWindowText(c),
								term: c.card.term,
								cardType: c.card.cardType,
								unused: unused,
								locked: locked,
								lockEndLabel: lockEndLabel,
								lockSeatId: c.lockSeatId
							}
						})
					}
				} catch (e) {
					console.error('加载日卡失败', e)
				}
			},
			selectCard(card) {
				if (card.locked) {
					uni.showToast({ title: '该卡已锁座，期间无需重复预约', icon: 'none' })
					return
				}
				this.selectedCardId = card.id
				// 卡券锁定时长不同 => 可选座位不同(周卡锁7天/月卡锁31天, 必须整段都空着), 重新拉一次可选座位
				this.reloadSeats()
			},
			// 当前门店(优先路由参数, 其次全局 store / 本地缓存)
			currentStore() {
				try {
					const st = this.$store && this.$store.state ? this.$store.state.store : null
					if (st && st.roomId) return st
				} catch (e) {}
				try {
					const raw = uni.getStorageSync('store')
					if (raw) return typeof raw === 'string' ? JSON.parse(raw) : raw
				} catch (e) {}
				return {}
			},
			bookingDateObj() {
				const s = (this.dateStr || '').replace(/-/g, '/')
				const d = s ? new Date(s) : new Date()
				if (isNaN(d.getTime())) return new Date()
				d.setHours(0, 0, 0, 0)
				return d
			},
			// 所选卡券一次预约占用的天数(固定区间卡/日卡=1天, 周卡=7天, 月卡按剩余天数)
			selectedWindowDays() {
				const sel = this.dayCards.find(c => c.id === this.selectedCardId)
				if (!sel) return 1
				return parseInt(sel.lockDays) || 1
			},
			// 卡券区域限制: 0=不限 / 1=仅沉浸区(16-19号) / 2=禁止沉浸区
			selectedAreaLimit() {
				const sel = this.dayCards.find(c => c.id === this.selectedCardId)
				if (!sel) return 0
				const t = sel.cardType != null ? sel.cardType : (sel.card ? sel.card.cardType : 0)
				return t == null ? 0 : t
			},
			isImmersion(seat) {
				if (!seat) return false
				if (seat.seatArea === 1 || seat.seatArea === '1') return true
				return !!(seat.areaName && String(seat.areaName).indexOf('沉浸') >= 0)
			},
			// 按卡券区域限制过滤后的可选座位
			visibleSeats() {
				const limit = this.selectedAreaLimit()
				const that = this
				return (this.seatList || []).filter(function(s) {
					const immer = that.isImmersion(s)
					if (limit === 2 && immer) return false
					if (limit === 1 && !immer) return false
					return true
				})
			},
			areaTip() {
				const limit = this.selectedAreaLimit()
				if (limit === 2) return '该卡不可预约沉浸区(16-19号)座位，已为你过滤'
				if (limit === 1) return '该卡仅限沉浸区(16-19号)座位，已为你过滤'
				return ''
			},
			async loadSeats() {
				const roomId = this.roomId || this.currentStore().roomId
				if (!roomId) {
					this.seatList = []
					return
				}
				const days = this.selectedWindowDays()
				const base = this.bookingDateObj()
				const start = uni.$u.date(base, 'yyyy-mm-dd') + ' 00:00:00'
				const end = uni.$u.date(new Date(base.getTime() + days * 86400000), 'yyyy-mm-dd') + ' 00:00:00'
				this.seatLoading = true
				try {
					const { data: res } = await getSeat({ roomId: roomId, startTime: start, endTime: end },
						{ custom: { auth: true, catch: true } })
					const all = ((res && res.seatCom) || []).concat((res && res.seatVip) || [])
					this.seatList = all.filter(function(s) {
						return s && s.status === true      // 整段窗口都空着的座位才可选
					}).map(function(s) {
						return { seatId: s.seatId, seatNum: s.seatNum, areaName: s.areaName || '', seatArea: s.seatArea }
					}).sort(function(a, b) {
						return (a.seatNum || 0) - (b.seatNum || 0)
					})
				} catch (e) {
					this.seatList = []
				} finally {
					this.seatLoading = false
				}
			},
			reloadSeats() {
				this.loadSeats().then(() => {
					if (!this.seatId) return
					const stillOk = (this.visibleSeats || []).some(s => s.seatId === this.seatId)
					if (!stillOk) {
						this.seatId = ''
						this.seatNum = ''
						uni.showToast({ title: '已按该卡时长重新筛选座位，请重新选择', icon: 'none' })
					}
				})
			},
			pickSeat(seat) {
				this.seatId = seat.seatId
				this.seatNum = seat.seatNum
			},
			// 提示: 短提示用 toast, 长提示(如"该座位已被占用(占用至12月10日)...")用弹窗, 否则会被截断
			showErr(msg) {
				const text = msg || '预约失败，请重试'
				if (String(text).length > 12) {
					uni.showModal({ title: '无法预约', content: String(text), showCancel: false, confirmText: '知道了' })
				} else {
					uni.showToast({ title: String(text), icon: 'none' })
				}
			},
			async confirmCheckout() {
				if (!this.selectedCardId) return uni.showToast({ title: '请选择卡券', icon: 'none' })
				if (!this.seatId) return uni.showToast({ title: '请选择座位', icon: 'none' })
				// 双重校验: 选中的卡若已锁座则拦截(防止列表刷新后状态变化)
				const sel = this.dayCards.find(c => c.id === this.selectedCardId)
				if (sel && sel.locked) {
					return uni.showToast({ title: '该卡已锁座，期间无需重复预约', icon: 'none' })
				}
				this.submitting = true
				try {
					const day = uni.$u.date(this.bookingDateObj(), 'yyyy-mm-dd')
					await dailyOrder({ seatId: this.seatId, cardUserId: this.selectedCardId, consumptionDate: day + ' 00:00:00' }, { custom: { auth: true, catch: true } })
					uni.showToast({ title: '预约成功', icon: 'success' })
					// 预约成功: 提示座位开关在首页(主页有今日座位开灯按钮, 预约今天的可直接开灯)
					setTimeout(function() {
						uni.showModal({
							title: '预约成功',
							content: '座位已预约。到店后请在「首页-今日预约灯光」打开座位开关/台灯。',
							showCancel: false,
							confirmText: '知道了',
							success() {
								// 用 reLaunch 确保清空页面栈, 避免 tabBar 高亮与实际页面不一致
								uni.reLaunch({ url: '/pages/index/index' })
							}
						})
					}, 600)
				} catch (e) {
					this.showErr(e && e.msg)
				} finally {
					this.submitting = false
				}
			},
			goBack() {
				uni.navigateBack()
			},
			goBuyCard() {
				uni.$u.route('/other_pages/recharge-card/recharge-card')
			}
		},
		computed: {
			// 是否拿到了门店(查可选座位必须先有 roomId)
			hasRoom() {
				return !!(this.roomId || this.currentStore().roomId)
			},
			showPriceFen() {
				const sel = this.dayCards.find(c => c.id === this.selectedCardId)
				return sel ? sel.priceFen : this.dailyPrice
			}
		},
		onShow() {
			this.loadConfig()
			this.loadDayCards()
			this.loadSeats()
		},
		onLoad(options) {
			this.seatId = options.seatId || ''
			this.seatNum = options.seatNum || ''
			this.storeName = options.storeName || ''
			this.roomId = options.roomId || ''
			this.dateStr = options.date || ''
			// 从选座页带座位号进来 => 不再显示选座区; 否则在本页选座
			this.routeSeat = !!options.seatId
			var d = new Date()
			this.today = this.dateStr || (d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate())
			const store = this.currentStore()
			if (!this.storeName && store.roomName) this.storeName = store.roomName
			if (!this.roomId && store.roomId) this.roomId = store.roomId
		}
	}
</script>

<style lang="scss" scoped>
	.container { padding: 30rpx; }
	.info-card { background: #fff; border-radius: 20rpx; padding: 30rpx; margin-bottom: 20rpx; }
	.info-row { margin-bottom: 16rpx; }
	.price-row { display: flex; justify-content: space-between; align-items: center; padding-top: 10rpx; }
	.section { margin-top: 20rpx; }
	.card-item { background: #f9f9f9; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; border: 2rpx solid transparent; }
	.card-item.selected { background: #e8f4ff; border-color: #35a5ed; }
	.seat-grid { display: flex; flex-wrap: wrap; }
	.seat-chip { min-width: 104rpx; padding: 14rpx 10rpx; margin: 0 14rpx 14rpx 0; border-radius: 12rpx; background: #f2f4f7; border: 2rpx solid transparent; text-align: center; }
	.seat-chip-on { background: #35a5ed; border-color: #35a5ed; }
	.card-item.locked { background: #faf6ef; border-color: #e6a23c; opacity: 0.85; }
	.empty-state { text-align: center; padding: 40rpx 0; }
</style>
