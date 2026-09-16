<template>
	<view>
		<view style="position: relative;">
			<my-navbar leftText="预定位置" leftIcon="arrow-left" :custom="false" :autoBack="true" leftIconSize="40">
			</my-navbar>
			<!-- 模式切换选项卡 -->
			<view class="mode-tabs">
				<u-tabs :list="modeList" :current="modeCurrent" @click="modeClick" lineWidth="120rpx"
					lineHeight="4rpx" :activeStyle="activeTabStyle" :inactiveStyle="inactiveTabStyle"
					:scrollable="false" lineColor="#35a5ed">
				</u-tabs>
			</view>

			<!-- 按小时模式 -->
			<view v-show="modeCurrent === 0" class="container">
				<view style="padding: 40rpx;">
					<view>
						<view>
							<u-text :bold="false" size="26" color="#c2c2c2" text="预约门店" />
						</view>
						<view
							style="display:flex; flex-direction:row; margin-top: 20rpx; justify-content: space-around;">
							<view style="width: 305rpx;">
								<u-text lines="1" :bold="true" size="36" color="#5b5b5b" :text="store.roomName" />
							</view>
							<view style="margin-top: 10rpx;padding: auto 0;">
								<u-text :bold="true" size="26" color="#5b5b5b" :text="'('+time+')'" />
							</view>
							<view style="margin-top: 10rpx; margin-left: 20rpx;" @click="changeShowStore">
								<u-text :bold="true" size="26" color="#35a5ed" text="切换门店" />
							</view>
						</view>
					</view>
					<u-divider></u-divider>
					<view style="margin-top: 40rpx;">
						<view>
							<u-text :bold="false" size="26" color="#c2c2c2" text="预约开始时间" />
						</view>
						<view style="margin-top: 30rpx;" @click="showStartPicker = true">
							<u-icon name="calendar" color="#35a5ed" size="55" :label="label" :bold="true" labelSize="34"
								labelColor="#35a5ed" labelPos="right" fontWeight="bold" space="20rpx"></u-icon>
							<view style="margin-top: 10rpx; margin-left: 60rpx;">
								<u-text :bold="false" size="24" color="#35a5ed" text="点击修改开始时间" align="left" />
							</view>
						</view>
					</view>
					<u-divider></u-divider>

				</view>
				<view style="margin-top: 10rpx;">
					<view style="margin-left: 40rpx;">
						<u-text :bold="false" size="26" color="#c2c2c2" text="选择时长" />
					</view>
					<view style="margin-top: 30rpx; width: 100%; padding: 20rpx;">
						<view class="tag-item">
							<view class="" v-for="(item, index) in radios" :key="index"
								style="margin-left: 30rpx;margin-bottom: 40rpx;">
								<u-tag :text="`${index + 1} 小时`" :plain="!item.checked" type="info" :name="index"
									shape="circle" size="medium" @click="radioClick">
								</u-tag>
							</view>
							<view style="margin-left: 30rpx;">
								<u-tag text="到关店" :plain="!endChecked" type="info" name="end" shape="circle"
									size="medium" @click="endClick">
								</u-tag>
							</view>
						</view>
					</view>
				</view>
				<view style="display: flex; flex-direction: row;margin: 20rpx 40rpx;">
					<view>
						<p>{{orderTotal ==0 ? '请选择': '已选择'}}</p>
					</view>
					<view style="margin-left: 20rpx;">
						<u-text :bold="true" size="30" color="#35a5ed"
							:text="`${orderHours==0? '': orderHours+'小时'} ${orderTotal%1==0.5? '30分钟': ''}`" />
					</view>
					<view style="margin-left: 20rpx;">
						<u-tag text="+1小时" size="mini" @click="addHours">
						</u-tag>
					</view>
					<view style="margin-left: 20rpx;">
						<u-tag text="+30分钟" size="mini" @click="addMinutes">
						</u-tag>
					</view>
				</view>
				<view style="height: 20rpx;"></view>
			</view>

			<!-- 按天模式 -->
			<view v-show="modeCurrent === 1" class="container daily-mode">
				<view style="padding: 40rpx;">
					<view>
						<u-text :bold="false" size="26" color="#c2c2c2" text="预约门店" />
					</view>
					<view style="margin-top: 20rpx;">
						<u-text lines="1" :bold="true" size="36" color="#5b5b5b" :text="store.roomName" />
					</view>
					<u-divider></u-divider>
					<!-- 日期选择 -->
					<view style="margin-top: 30rpx;">
						<view>
							<u-text :bold="false" size="26" color="#c2c2c2" text="选择日期" />
						</view>
						<view style="margin-top: 20rpx;display:flex;align-items:center;justify-content:center;">
							<view class="date-picker-box" @click="showDatePicker = true">
								<u-icon name="calendar" color="#35a5ed" size="45" />
								<view style="margin-left: 16rpx;">
									<u-text :bold="true" size="34" color="#35a5ed" :text="dailyDateLabel" />
								</view>
							</view>
						</view>
					</view>
					<u-divider></u-divider>
					<!-- 价格信息 -->
					<view class="daily-price-row">
						<view>
							<u-text size="26" color="#888" text="日卡价格" />
						</view>
						<view>
							<u-text :bold="true" size="38" color="#ff6600" :text="'¥' + dailyPrice" />
						</view>
					</view>
					<view class="daily-price-row" style="margin-top: 10rpx;">
						<view>
							<u-text size="26" color="#888" text="可用日卡" />
						</view>
						<view>
							<u-text :bold="true" size="32" color="#35a5ed" :text="availableCards + ' 张'" />
						</view>
					</view>
					<!-- 周卡锁座提示 -->
					<view v-if="lockCardTip" class="daily-price-row" style="margin-top: 10rpx; background: #fff7e6; border-radius: 12rpx; padding: 12rpx 20rpx;">
						<u-text size="24" color="#e6a23c" :text="lockCardTip" />
					</view>
				</view>
				<view style="margin: 20rpx 40rpx;">
					<u-button color="#35a5ed" size="large" @click="dailyBook">
						预约今天
					</u-button>
				</view>
			</view>

			<!-- 底部按钮（小时模式） -->
			<view v-show="modeCurrent === 0" style="margin: 40rpx;">
				<u-button color="#35a5ed" size="large" @click="toCheck">
					开始选座
				</u-button>
			</view>
		</view>

		<!-- 门店切换 -->
		<view style="max-height: 300rpx;">
			<my-action-sheet :list="storeList" :show="showStore" @closeShow="closeShowStore()"></my-action-sheet>
		</view>

		<!-- 日期选择器 -->
		<u-datetime-picker :show="showDatePicker" v-model="dailyTimestamp" mode="date" @confirm="dailyDateConfirm"
			@cancel="showDatePicker = false" :minDate="minDate" closeOnClickOverlay>
		</u-datetime-picker>
		<u-datetime-picker :show="showStartPicker" v-model="startPickerValue" mode="datetime"
			@confirm="startTimeConfirm" @cancel="showStartPicker = false" :minDate="startPickerMin" closeOnClickOverlay>
		</u-datetime-picker>
	</view>
</template>

<script>
	import {
		mapState,
	} from 'vuex'
	import {
		dailyConfig,
		getMyCard
	} from '@/config/api.js'
	import { isCardUsable } from '@/utils/card-usable.js'
	export default {
		props: {
			orderTimestamp: { type: Number },
			storeName: { type: String },
			time: { type: String },
			orderDay: { type: String }
		},
		computed: {
			...mapState(['storeList', 'store'])
		},
		data() {
			const today = new Date()
			today.setHours(0, 0, 0, 0)
			return {
				label: '',
				showStartPicker: false,
				startPickerValue: Date.now(),
				startPickerMin: Date.now(),
				radios: [],
				hours: 0,
				total: 0,
				orderTotal: 0,
				endChecked: false,
				orderHours: 0,
				showStore: false,
				// 模式切换
				modeCurrent: 0,
				modeList: [
					{ name: '按小时' },
					{ name: '按天' }
				],
				activeTabStyle: { color: '#35a5ed', fontWeight: 'bold', fontSize: '28rpx' },
				inactiveTabStyle: { color: '#999', fontSize: '28rpx' },
				// 按天模式
				showDatePicker: false,
				dailyTimestamp: today.getTime(),
				dailyDateLabel: '',
				dailyPrice: 0,
				availableCards: 0,
				lockCardTip: '',
				minDate: today.getTime()
			}
		},
		methods: {
			setLabel() {
				var weekArr = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
				var date = new Date(this.orderTimestamp)
				this.label = uni.$u.date(this.orderTimestamp, "mm月dd日") + " ( " + weekArr[date.getDay()] + ") " + uni.$u
					.date(this.orderTimestamp, 'hh:MM')
			},
			startTimeConfirm(e) {
				this.showStartPicker = false
				this.orderTimestamp = e.value
				this.orderTotal = 0
				this.orderHours = 0
				this.endChecked = false
				this.radios = []
				this.setLabel()
				this.setHours()
			},
			radioClick(name) {
				this.orderTotal = name + 1
				this.orderHours = parseInt(this.orderTotal)
				this.endChecked = false
				this.radios.map((item, index) => {
					item.checked = index === name ? true : false
				})
			},
			endClick() {
				this.orderTotal = this.total
				this.orderHours = parseInt(this.orderTotal)
				this.endChecked = true
				this.radios.map((item, index) => {
					item.checked = false
				})
			},
			addHours() {
				this.orderTotal += 1
				if (this.orderTotal > this.total) {
					this.orderTotal -= 1
					uni.showToast({ title: '超过最大可预约时间', duration: 2000, icon: 'none' })
				}
				this.orderHours = parseInt(this.orderTotal)
			},
			addMinutes() {
				this.orderTotal = Math.round((this.orderTotal + 0.5) * 10) / 10
				if (this.orderTotal > this.total) {
					this.orderTotal -= 0.5
					uni.showToast({ title: '超过最大可预约时间', duration: 2000, icon: 'none' })
				}
				this.orderHours = parseInt(this.orderTotal)
			},
			toCheck() {
				if (this.orderTotal == 0) {
					uni.showToast({ title: '请选择预约时长', duration: 2000, icon: 'none' })
				} else {
					var expiration = new Date(this.orderTimestamp)
					var whole = parseInt(this.orderTotal)
					expiration.setHours(expiration.getHours() + whole)
					if (this.orderTotal % 1 == 0.5) {
						expiration.setMinutes(expiration.getMinutes() + 30)
					}
					uni.$u.route('/other_pages/check-seat/check-seat', {
						startTimestamp: this.orderTimestamp,
						endTimestamp: expiration.getTime(),
						orderTotal: this.orderTotal
					})
				}
			},
			setHours() {
				var date = new Date(this.orderTimestamp)
				var now = new Date(new Date(this.orderTimestamp).setHours(23))
				now.setMinutes(0)
				const hours = new Date(now.getTime() - date.getTime())
				this.hours = hours.getUTCHours()
				const minutes = hours.getMinutes() === 30 ? 0.5 : 0
				this.total = this.hours + minutes
				for (var i = 0; i < this.hours; i++) {
					if (i > 5) break
					this.radios.push({ checked: false })
				}
			},
			changeShowStore() { this.showStore = true },
			closeShowStore() { this.showStore = false },
			// 模式切换
			modeClick(item) {
				this.modeCurrent = item.index
			},
			// 按天模式
			dailyDateConfirm(e) {
				this.showDatePicker = false
				const date = new Date(e.value)
				const weekArr = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
				this.dailyDateLabel = (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + weekArr[date.getDay()]
			},
			async loadDailyConfig() {
				try {
					const { data: res } = await dailyConfig({ roomId: this.store.roomId }, { custom: { auth: true, catch: true } })
					if (res) this.dailyPrice = res.price || 0
				} catch (e) { console.error(e) }
			},
			async loadCards() {
				try {
					const { data: cards } = await getMyCard({}, { custom: { auth: true, catch: true } })
					if (cards && cards.length > 0) {
						const now = new Date()
						// 日卡/周卡(term=1/7)且可用: 未激活(买来还没用过)的卡不过期
						const dayCards = cards.filter(function(c) {
							if (!c.card || (c.card.term !== 1 && c.card.term !== 7)) return false
							return isCardUsable(c)
						})
						this.availableCards = dayCards.length
						// 统计已锁座的周卡(lockEndTime 在未来)并记录锁座信息
						const lockedCards = dayCards.filter(function(c) {
							return c.lockSeatId && c.lockEndTime && new Date(String(c.lockEndTime).replace(/-/g, '/')) > now
						})
						if (lockedCards.length > 0) {
							const lockEnd = new Date(String(lockedCards[0].lockEndTime).replace(/-/g, '/'))
							this.lockCardTip = '周卡已锁座至 ' + (lockEnd.getMonth() + 1) + '月' + lockEnd.getDate() + '日，期间无需重复预约'
						} else {
							this.lockCardTip = ''
						}
					}
				} catch (e) { console.error(e) }
			},
			dailyBook() {
				// 注意: 这里之前把时间戳直接当 date 传给卡券预约页, 导致后端解析日期失败("预约今天"用不了);
				// 统一格式化为 yyyy-mm-dd, 并带上门店 roomId(卡券预约页要用它查可选座位)
				uni.$u.route('/other_pages/daily-checkout/daily-checkout', {
					storeName: this.store.roomName,
					roomId: this.store.roomId,
					date: uni.$u.date(new Date(this.dailyTimestamp), 'yyyy-mm-dd')
				})
			}
		},
		onLoad() {
			this.setLabel()
			this.setHours()
			// 初始化按天日期
			const weekArr = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
			const today = new Date()
			this.dailyDateLabel = (today.getMonth() + 1) + '月' + today.getDate() + '日 ' + weekArr[today.getDay()]
			this.loadDailyConfig()
			this.loadCards()
		},
		onHide() { console.log("hide") }
	}
</script>

<style lang="scss">
	.mode-tabs {
		background: #fff;
		margin: 0 40rpx;
		border-radius: 16rpx;
		padding: 10rpx 0;
	}

	.container {
		background-color: #FFFFFF;
		margin: 20rpx 40rpx;
		border-radius: 20rpx;
	}

	.daily-mode {
		padding-bottom: 20rpx;
	}

	.tag-item {
		width: 90%;
		height: auto;
		display: flex;
		flex-wrap: wrap;
	}

	.date-picker-box {
		display: flex;
		align-items: center;
		padding: 20rpx 40rpx;
		background: #f5faff;
		border-radius: 16rpx;
		border: 2rpx solid #d0ebff;
	}

	.daily-price-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10rpx 0;
	}
</style>
