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
								<u-text size="24" color="#999" :text="card.unused ? ('未使用 · 首次预约后 ' + card.remainDays + ' 天有效') : (card.term === 7 ? ('7天有效，剩 ' + card.remainDays + ' 天') : (card.remainDays + ' 天剩余'))" />
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

			<view style="margin-top: 40rpx;">
				<u-button type="primary" color="#35a5ed" size="large" 
					:disabled="!selectedCardId" :loading="submitting"
					@click="confirmCheckout" text="确认预约" />
			</view>

			<view style="height: 20rpx;" />
			<u-button type="default" size="large" @click="goBack" text="返回" />
		</view>
	</view>
</template>

<script>
	import { dailyConfig, dailyOrder, getMyCard } from '@/config/api.js'
	import { isCardUsable, isCardUnused, cardRemainDays, cardDate } from '@/utils/card-usable.js'
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
				submitting: false
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
								term: c.card.term,
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
					uni.showToast({ title: '该周卡已锁座，期间无需重复预约', icon: 'none' })
					return
				}
				this.selectedCardId = card.id
			},
			async confirmCheckout() {
				if (!this.selectedCardId) return uni.showToast({ title: '请选择日卡', icon: 'none' })
				// 双重校验: 选中的卡若已锁座则拦截(防止列表刷新后状态变化)
				const sel = this.dayCards.find(c => c.id === this.selectedCardId)
				if (sel && sel.locked) {
					return uni.showToast({ title: '该周卡已锁座，期间无需重复预约', icon: 'none' })
				}
				this.submitting = true
				try {
					await dailyOrder({ seatId: this.seatId, cardUserId: this.selectedCardId, consumptionDate: this.dateStr + ' 00:00:00' }, { custom: { auth: true, catch: true } })
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
					uni.showToast({ title: (e && e.msg) || '预约失败，请重试', icon: 'none' })
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
			showPriceFen() {
				const sel = this.dayCards.find(c => c.id === this.selectedCardId)
				return sel ? sel.priceFen : this.dailyPrice
			}
		},
		onShow() {
			this.loadConfig()
			this.loadDayCards()
		},
		onLoad(options) {
			this.seatId = options.seatId || ''
			this.seatNum = options.seatNum || ''
			this.storeName = options.storeName || ''
			this.roomId = options.roomId || ''
			this.dateStr = options.date || ''
			var d = new Date()
			this.today = this.dateStr || (d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate())
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
	.card-item.locked { background: #faf6ef; border-color: #e6a23c; opacity: 0.85; }
	.empty-state { text-align: center; padding: 40rpx 0; }
</style>
