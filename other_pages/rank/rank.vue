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
							:text="current == 0 ? '每天开灯签到，连续天数越多排名越靠前' : '今日 6 点后，谁先到谁先开灯'" />
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
								<u-col span="2">
									<u-text :bold="true" size="32" align="center" color="#000000" :text="index+4" />
								</u-col>
								<u-col span="2">
									<u-avatar :src="normAvatar(item.avatarUrl)" size="80rpx"></u-avatar>
								</u-col>
								<u-col span="6">
									<u-text :bold="true" size="30" align="left" color="#000000" :text="item.nickname" />
								</u-col>
								<u-col span="4">
									<view style="display: flex; justify-content: flex-end; padding-right: 20rpx;">
										<u-text :bold="true" size="32" color="#4facfe" align="right"
											:text="valText(item)" />
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
		getStreakRank,
		getEarlyRank,
		getRecordHousrs
	} from '@/config/api.js'
	export default {
		data() {
			return {
				list: ['连续签到', '今日早到'],
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
			valText(item) {
				if (this.current == 0) return (item.streak != null ? item.streak : 0) + ' 天'
				// 早到榜: 显示签到时间
				if (item.checkInTime) {
					const t = new Date(String(item.checkInTime).replace(/-/g, '/'))
					const pad = function(n) { return n < 10 ? '0' + n : '' + n }
					return pad(t.getHours()) + ':' + pad(t.getMinutes())
				}
				return '-'
			},
			sectionChange(e) {
				this.current = e
				this.loadRank()
			},
			async loadRank() {
				try {
					let res
					if (this.current == 0) {
						res = await getStreakRank({}, { custom: { auth: true, catch: true } })
					} else {
						res = await getEarlyRank({}, { custom: { auth: true, catch: true } })
					}
					const list = (res && res.data) || []
					this.rankList = list
					// 找我的排名
					this.myRank = -1
					const myOpenid = uni.getStorageSync('openid')
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
			},
			async getHours() {
				try {
					const { data: res } = await getRecordHousrs({}, { custom: { auth: true, catch: true } })
					console.log('hours', res)
				} catch (e) {}
			}
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
			this.getHours()
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
