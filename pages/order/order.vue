<template>
	<view style="position: relative;">
		<my-navbar title="预约选座" :custom="false" :autoBack="false"></my-navbar>
		<view class="container">
			<view>
				<view>
					<u-text :bold="false" size="26" color="#c2c2c2" text="预约门店" />
				</view>
				<view style="display:flex; flex-direction:row; margin-top: 20rpx;">
					<view style="width: 305rpx;">
						<u-text lines="1" :bold="true" size="36" color="#5b5b5b" :text="store.roomName" />
					</view>
					<view style="margin-top: 10rpx; margin-left: 20rpx;" @click="changeShowStore()">
						<u-text :bold="true" size="26" color="#35a5ed" text="切换门店" />
					</view>
				</view>
			</view>
			<u-divider></u-divider>
			<view style="margin-top: 40rpx;">
				<u-text :bold="false" size="26" color="#c2c2c2" text="预约日期" />
				<picker mode="date" :start="minDate" :end="maxDate" :value="selectDate" @change="onDateChange">
					<view style="display:flex; align-items:center; margin-top: 20rpx;">
						<u-icon name="calendar" color="#35a5ed" size="45" />
						<view style="margin-left: 16rpx;">
							<u-text :bold="true" size="34" color="#35a5ed" :text="dateLabel" />
						</view>
						<u-icon name="arrow-down" color="#35a5ed" size="30" style="margin-left: 10rpx;" />
					</view>
				</picker>
			</view>
			<u-divider></u-divider>
			<view style="display:flex; justify-content: space-between; align-items:center; margin-top: 30rpx;">
				<u-text :bold="false" size="26" color="#c2c2c2" text="日卡价格" />
				<u-text :bold="true" size="34" color="#ff6600" :text="'¥' + (cardPrice || dailyPrice)" />
			</view>
			<view style="display:flex; justify-content: space-between; align-items:center; margin-top: 20rpx;">
				<u-text :bold="false" size="26" color="#c2c2c2" text="我的日卡" />
				<u-text :bold="true" size="32" color="#35a5ed" :text="availableCards + ' 张可用'" />
			</view>
			<view style="margin-top: 20rpx;">
				<u-text :bold="false" size="22" color="#9a9a9a" text="24小时营业，预约当天全天不限时长使用" />
			</view>
		</view>
		<view style="margin: 40rpx;">
			<u-button color="#35a5ed" size="large" @click="toSeat">开始选座</u-button>
		</view>
		<view style="margin-top: 20rpx;">
			<u-text :bold="false" size="24" color="#353535" align="center" :text="oneToke" />
		</view>
		<my-tabbar></my-tabbar>

		<view style="max-height: 300rpx;">
			<my-action-sheet :list="storeList" :show="showStore" @closeShow="closeShowStore()"></my-action-sheet>
		</view>
	</view>
</template>

<script>
	import {
		mapState,
		mapMutations
	} from 'vuex'
	import {
		dailyConfig,
		getMyCard
	} from '@/config/api.js'
	export default {
		data() {
			return {
				showStore: false,
				dateLabel: '',
				selectDate: '',
				minDate: '',
				maxDate: '',
				dailyPrice: '20.00',
			cardPrice: '',
				availableCards: 0
			}
		},
		methods: {
			...mapMutations(['setIndex']),
			closeShowStore() {
				this.showStore = false
			},
			changeShowStore() {
				this.showStore = true;
			},
			async loadDailyConfig() {
				try {
					const {
						data: config
					} = await dailyConfig({
						roomId: this.store.roomId
					}, {
						custom: {
							auth: true,
							catch: true
						}
					})
					if (config && config.length > 0) {
						const priceConf = config.find(function(c) { return c.configKey === 'daily_price' })
						if (priceConf) {
							this.dailyPrice = (parseInt(priceConf.configValue) / 100).toFixed(2)
						}
					}
				} catch (e) {}
			},
			async loadDayCards() {
				try {
					const {
						data: card
					} = await getMyCard({}, {
						custom: {
							auth: true,
							catch: true
						}
					})
					if (card && card.length > 0) {
						const now = new Date()
						// 可用卡(日卡 term=1 / 周卡 term=7, 未过期未使用)
						var validCards = card.filter(function(c) {
							return c.card && (c.card.term === 1 || c.card.term === 7) && !c.consumed && c.expiryTime &&
								new Date(String(c.expiryTime).replace(/-/g, '/')) > now
						})
						this.availableCards = validCards.length
						// 日卡价格只从日卡(term=1)取, 防止周卡价冒充日卡价展示
						if (!this.cardPrice && validCards.length > 0) {
							var dayCard = validCards.find(function(c) { return c.card && c.card.term === 1 }) || validCards[0]
							if (dayCard && dayCard.card && dayCard.card.price) {
								this.cardPrice = (Math.round(parseFloat(dayCard.card.price) * 100) / 100).toFixed(2)
							}
						}
					}
				} catch (e) {}
			},
			onDateChange(e) {
				this.selectDate = e.detail.value
				var weekArr = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
				var d = new Date(this.selectDate.replace(/-/g, '/'))
				var label = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + weekArr[d.getDay()]
				this.dateLabel = (this.selectDate === this.minDate ? '今天 ' : '') + label
			},
			toSeat() {
				var weekArr = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
				var today = new Date()
				today.setHours(0, 0, 0, 0)
				var start = new Date(today)
				var end = new Date(today)
				if (this.selectDate) {
					var sel = new Date(this.selectDate.replace(/-/g, '/'))
					sel.setHours(0, 0, 0, 0)
					start = new Date(sel)
					end = new Date(sel)
				}
				// 自习室24小时营业: 全天 00:00 - 次日 00:00
				start.setHours(0, 0, 0, 0)
				end.setDate(end.getDate() + 1)
				end.setHours(0, 0, 0, 0)
				uni.$u.route('/other_pages/check-seat/check-seat', {
					mode: 'daily',
					startTimestamp: start.getTime(),
					endTimestamp: end.getTime(),
					dateLabel: this.dateLabel,
					dateStr: this.selectDate || this.minDate
				})
			}
		},
		computed: {
			...mapState(['oneToke', 'store', 'storeList'])
		},
		onLoad() {
			var weekArr = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
			var today = new Date()
			var pad = function(n) { return n < 10 ? '0' + n : '' + n }
			var todayStr = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate())
			var max = new Date(today.getTime() + 30 * 24 * 3600 * 1000)
			this.minDate = todayStr
			this.maxDate = max.getFullYear() + '-' + pad(max.getMonth() + 1) + '-' + pad(max.getDate())
			this.selectDate = todayStr
			this.dateLabel = '今天 ' + (today.getMonth() + 1) + '月' + today.getDate() + '日 ' + weekArr[today.getDay()]
		},
		onShow() {
			this.setIndex(1)
			const isLogin = uni.getStorageSync('isLogin')
			if (isLogin !== true && isLogin !== 'true' && isLogin !== 1) {
				// 未登录: 引导登录后再预约
				uni.showModal({
					title: '请先登录',
					content: '预约座位需要先登录，是否前往「我的」页登录？',
					confirmText: '去登录',
					success: (r) => {
						if (r.confirm) {
							uni.switchTab({ url: '/pages/mine/mine' })
						}
					}
				})
				return
			}
			this.loadDailyConfig()
			this.loadDayCards()
		}
	}
</script>

<style lang="scss">
	.container {
		background-color: #FFFFFF;
		margin: 40rpx;
		padding: 40rpx;
		border-radius: 20rpx;
	}
</style>