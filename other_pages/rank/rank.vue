<template>
	<view>
		<my-navbar title="排行榜" leftIcon="arrow-left" bgColor="#4facfe" :custom="false" :autoBack="true"
			titleStyle="color:#ffffff" leftIconColor="#ffffff" leftIconSize="40"></my-navbar>
		<scroll-view scroll-y="true" :style="{height: viewHeight +'rpx'}">
			<view style="background-image: linear-gradient(to bottom, #4facfe 0%, #00f2fe 100%);position: relative;">
				<view class="container">
					<view style="margin: auto 160rpx;padding-top: 50rpx;">
						<u-subsection bgColor="#ffffff80" :list="list" :current="current" fontSize="24"
							@change="sectionChange"></u-subsection>
					</view>
					<view style="margin-top: 20rpx;">
						<u-text :bold="false" size="24" color="#ffffff" align="center"
							:text="current == 0 ? '累计到店学习天数越多排名越靠前（一天只计一次）' : (current == 1 ? '每天开灯签到，连续天数越多排名越靠前' : '今日 6 点后，谁先到谁先开灯')" />
					</view>
				</view>
			</view>

			<!-- 榜单说明 + 前三名 -->
			<view class="top-three">
				<view class="podium" v-if="rankList.length >= 3">
					<view class="p-item second">
						<view class="medal">🥈</view>
						<u-avatar :src="normAvatar(rankList[1].avatarUrl)" size="100rpx"></u-avatar>
						<view class="p-name">{{rankList[1].nickname}}</view>
						<view class="p-val">{{valText(rankList[1])}}</view>
					</view>
					<view class="p-item first">
						<view class="medal">🥇</view>
						<u-avatar :src="normAvatar(rankList[0].avatarUrl)" size="120rpx"></u-avatar>
						<view class="p-name">{{rankList[0].nickname}}</view>
						<view class="p-val">{{valText(rankList[0])}}</view>
					</view>
					<view class="p-item third">
						<view class="medal">🥉</view>
						<u-avatar :src="normAvatar(rankList[2].avatarUrl)" size="100rpx"></u-avatar>
						<view class="p-name">{{rankList[2].nickname}}</view>
						<view class="p-val">{{valText(rankList[2])}}</view>
					</view>
				</view>
				<view v-else-if="rankList.length == 2">
					<view class="podium">
						<view class="p-item second">
							<view class="medal">🥈</view>
							<u-avatar :src="normAvatar(rankList[1].avatarUrl)" size="100rpx"></u-avatar>
							<view class="p-name">{{rankList[1].nickname}}</view>
							<view class="p-val">{{valText(rankList[1])}}</view>
						</view>
						<view class="p-item first">
							<view class="medal">🥇</view>
							<u-avatar :src="normAvatar(rankList[0].avatarUrl)" size="120rpx"></u-avatar>
							<view class="p-name">{{rankList[0].nickname}}</view>
							<view class="p-val">{{valText(rankList[0])}}</view>
						</view>
					</view>
				</view>
				<view v-else-if="rankList.length == 1">
					<view class="podium">
						<view class="p-item first">
							<view class="medal">🥇</view>
							<u-avatar :src="normAvatar(rankList[0].avatarUrl)" size="120rpx"></u-avatar>
							<view class="p-name">{{rankList[0].nickname}}</view>
							<view class="p-val">{{valText(rankList[0])}}</view>
						</view>
					</view>
				</view>
			</view>

			<!-- 4名以后 -->
			<view v-if="rankList.length > 3">
				<view class="container-list">
					<view class="list-item" :class="{activeItem:index%2==0}" v-for="(item,index) in rankList.slice(3)"
						:key="index">
						<view>
							<u-row>
								<!--
									注意: u-row 是 12 栅格, 这里必须是 2+2+4+4=12。
									原来写的是 2+2+6+4=14, 超了 2 格, 于是最右边的数值列被挤出卡片外
									—— 就是"第四名的连续几天飞出图外"的原因。
								-->
								<u-col span="2">
									<u-text :bold="true" size="32" align="center" color="#000000" :text="index+4" />
								</u-col>
								<u-col span="2">
									<u-avatar :src="normAvatar(item.avatarUrl)" size="80rpx"></u-avatar>
								</u-col>
								<u-col span="4">
									<view class="ellip">
										<u-text :bold="true" size="30" align="left" color="#000000" :text="clip(item.nickname, 8)" />
									</view>
								</u-col>
								<u-col span="4">
									<view style="display: flex; flex-direction: column; align-items: flex-end; padding-right: 10rpx;">
										<view class="ellip" style="max-width: 100%;">
											<u-text :bold="true" size="30" color="#4facfe" align="right"
												:text="clip(valText(item), 8)" />
										</view>
										<view class="ellip" style="max-width: 100%;" v-if="subText(item)">
											<u-text size="22" color="#999" align="right"
												:text="clip(subText(item), 8)" />
										</view>
									</view>
								</u-col>
							</u-row>
						</view>
					</view>
				</view>
			</view>

			<view v-if="rankList.length == 0" class="empty">
				<u-empty text="暂无数据，快去开灯签到吧" mode="list" />
			</view>

			<view style="height: 100rpx;"></view>
		</scroll-view>

		<!-- 我的排名 -->
		<view class="foot">
			<view style="margin: 20rpx 40rpx;display: flex;align-items: center;">
				<u-avatar :src="normAvatar(myInfo.avatarUrl)" size="80rpx"></u-avatar>
				<view style="margin-left: 20rpx;">
					<u-text :bold="true" size="28" :text="myInfo.nickname || '我'" />
					<u-text size="24" color="#999" :text="myRankText" />
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		getDaysRank,
		getStreakRank,
		getEarlyRank
	} from '@/config/api.js'
	export default {
		data() {
			return {
				list: ['学习天数', '连续签到', '今日早到'],
				current: 0,
				rankList: [],
				viewHeight: 1200,
				myInfo: {},
				myRank: -1
			}
		},
		computed: {
			myRankText() {
				if (this.myRank < 0) return ''
				if (this.myRank === 0) return '🏆 当前第 1 名'
				return '当前第 ' + (this.myRank + 1) + ' 名'
			}
		},
		methods: {
			// 头像归一化: 后端可能返回裸 base64, 需加 data:image 前缀否则加载报错
			normAvatar(val) {
				if (!val) return ''
				var s = String(val)
				if (s.indexOf('data:image') === 0) return s
				if (s.indexOf('http') === 0 || s.indexOf('/') === 0 || s.indexOf('wxfile') === 0) return s
				if (/^[A-Za-z0-9+/=]+$/.test(s) && s.length > 50) {
					return 'data:image/jpeg;base64,' + s
				}
				return s
			},
			// 超长文本截断: 多余部分用 … 收尾。
			// 阈值取 8 而非 5 —— 正常值最长也就"累计 128 天"(7 字符), 卡在 5 会把"连续 12 天"这种
			// 正常结果也截掉, 反而更难读。真正的防溢出靠 12 栅格 + CSS ellipsis, 这里只是兜底。
			clip(val, max) {
				if (val == null) return ''
				const s = String(val)
				const n = max || 8
				return s.length > n ? s.slice(0, n) + '…' : s
			},
			// 主数值: 领奖台和列表都用它, 所以保持简短
			valText(item) {
				// 0 = 学习天数榜(主榜): 累计到店学习天数
				if (this.current == 0) {
					return '累计 ' + (item.totalDays != null ? item.totalDays : 0) + ' 天'
				}
				// 1 = 自律榜(连续签到)
				if (this.current == 1) {
					return '连续 ' + (item.streak != null ? item.streak : 0) + ' 天'
				}
				// 2 = 今日早到榜: 显示开灯时间
				if (item.checkInTime) {
					const t = new Date(String(item.checkInTime).replace(/-/g, '/'))
					const pad = function(n) { return n < 10 ? '0' + n : '' + n }
					return pad(t.getHours()) + ':' + pad(t.getMinutes())
				}
				return '-'
			},
			// 次要信息: 天数榜和自律榜各把另一个数字补在后面(说明书要求两个数都要能看到),
			// 但都塞进主数值会挤坏领奖台布局, 所以单独一行、只在列表里显示
			subText(item) {
				if (this.current == 0 && item.streak != null) {
					return '连续 ' + item.streak + ' 天'
				}
				if (this.current == 1 && item.totalDays != null) {
					return '累计 ' + item.totalDays + ' 天'
				}
				return ''
			},
			sectionChange(e) {
				this.current = e
				this.myRank = -1
				this.rankList = []
				this.loadRank()
			},
			async loadRank() {
				try {
					let res
					if (this.current == 0) {
						res = await getDaysRank({}, { custom: { auth: true, catch: true } })
					} else if (this.current == 1) {
						res = await getStreakRank({}, { custom: { auth: true, catch: true } })
					} else {
						res = await getEarlyRank({}, { custom: { auth: true, catch: true } })
					}
					const list = (res && res.data) || []
					this.rankList = list
					// 找我的排名
					this.myRank = -1
					const myUid = uni.getStorageSync('userId')
					for (let i = 0; i < list.length; i++) {
						const u = list[i]
						if (u.userId != null && myUid != null && String(u.userId) === String(myUid)) {
							this.myRank = i
							break
						}
					}
				} catch (e) {
					console.error('加载排行榜失败', e)
				}
			}
			// 原 getHours() 每次进页面都调一次 /record/mine, 但结果只 console.log, 不渲染任何东西
			// —— 纯白调接口, 已删除。要看"我的学习时长"请走「我的—学习记录」页。
		},
		onReady() {
			const that = this
			uni.getSystemInfo({
				success(res) {
					that.viewHeight = (res.windowHeight - 160) * (750 / res.windowWidth)
				}
			})
		},
		onShow() {
			const userInfo = uni.getStorageSync('userInfo')
			try {
				this.myInfo = userInfo ? JSON.parse(userInfo) : {}
			} catch (e) {
				this.myInfo = {}
			}
			this.loadRank()
		}
	}
</script>

<style lang="scss">
	.container {
		margin: auto 20rpx;
		height: 260rpx;
	}

	// 前三名领奖台
	.top-three {
		background-color: #ffffff;
		margin: 20rpx;
		border-radius: 20rpx;
		padding: 20rpx 0 30rpx;
	}

	.podium {
		display: flex;
		justify-content: center;
		align-items: flex-end;
	}

	.p-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		margin: 0 20rpx;
		padding-top: 30rpx;

		.medal {
			font-size: 40rpx;
			margin-bottom: 10rpx;
		}

		.p-name {
			font-size: 26rpx;
			color: #333;
			margin-top: 12rpx;
			max-width: 180rpx;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}

		.p-val {
			font-size: 28rpx;
			color: #4facfe;
			font-weight: bold;
			margin-top: 6rpx;
		}
	}

	.first {
		order: 1;
	}

	.second {
		order: 0;
	}

	.third {
		order: 2;
	}

	.container-list {
		border-radius: 20rpx;
		margin: auto 20rpx;
		margin-top: 20rpx;
		background-color: #ffffff;
	}

	.list-item {
		padding-top: 20rpx;
		height: 100rpx;
	}

	.activeItem {
		background-color: #f1f1f1;
	}

	/* 超长昵称/数值一律省略号收尾, 不让它把列表行撑破 */
	.ellip {
		overflow: hidden;
		white-space: nowrap;
		text-overflow: ellipsis;
		max-width: 100%;
	}

	.empty {
		margin-top: 60rpx;
	}

	.foot {
		height: 120rpx;
		width: 100%;
		background-color: #ffffff;
		position: absolute;
		bottom: 0rpx;
	}
</style>
