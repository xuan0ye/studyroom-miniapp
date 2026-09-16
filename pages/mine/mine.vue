<template style="position: relative;">
	<view>
		<my-navbar :custom="false" title=" " :autoBack="false"></my-navbar>
		<view class="container">
			<!-- 头像信息 -->
			<view class="user">
				<u-row>
					<u-col span="2">
						<!-- 微信头像昵称填写能力: button open-type=chooseAvatar 选微信头像 -->
						<button class="avatar-btn" open-type="chooseAvatar" @chooseavatar="onChooseAvatar">
							<u-avatar :src="userInfo.avatarUrl" size="112"></u-avatar>
							<view class="avatar-edit">
								<u-text size="20" color="#ffffff" text="换头像" />
							</view>
						</button>
					</u-col>
					<u-col span="8">
						<view class="user-info" v-if="isLogin">
							<!-- input type=nickname: 点击唤起微信昵称填写 -->
							<input class="nick-input" type="nickname" v-model="userInfo.nickName"
								:placeholder="userInfo.nickName || '点击设置昵称'" placeholder-class="nick-placeholder"
								@blur="saveNickName" />
							<view style="height: 15rpx;"></view>
							<u-text :bold="false" size="26" color="#c2c2c2" :text="userInfo.phone" v-if="isPhone" />
							<view v-else style="padding-right: 80rpx;">
								<u-button type="primary" size="mini" icon="phone" text="绑定手机号"
									@click="openPhoneTip" />
							</view>
							<!-- 是否在预约界面公开头像 -->
							<view class="avatar-public-row">
								<u-text :bold="false" size="24" color="#8a8a8a" text="预约界面公开我的头像" />
								<u-switch v-model="showAvatar" size="40" activeColor="#35a5ed"
									@change="onShowAvatarChange"></u-switch>
							</view>
						</view>
						<view v-else style="padding-left: 40rpx;">
							<u-button type="success" @click="getUserInfo" size="normal" icon="weixin-fill"
								text="微信用户一键登录" />
						</view>
					</u-col>
					<u-col span="1" offset="1" textAlign="right">
						<view class="user-icon">
							<u-icon :bold="false" name="https://api.dayousuoan.top/upload/appstatic/mine/setting.png" size="60"></u-icon>
						</view>
					</u-col>
				</u-row>
			</view>
			<!-- 四个宫格区域 -->
			<view class="my-grid">
				<!-- 上面两个 -->
				<view>
					<u-row gutter="0">
						<u-col span="5">
							<view class="grid-item" style="margin-right: 10rpx;" @click="toGrid(0)">
								<view style="height: 25rpx;">
								</view>
								<u-row>
									<u-col span="3">
										<view style="margin-left: 20rpx;margin-top: 4rpx;">
											<u-icon :bold="false" name="https://api.dayousuoan.top/upload/appstatic/mine/vip.png" size="50"></u-icon>
										</view>
									</u-col>
									<u-col span="6">
										<view style="margin-left: 7rpx">
											<u-text :bold="false" align="left" size="36" text="点" />
										</view>
									</u-col>
								</u-row>
								<view style="margin-top: 10rpx;">
									<u-row>
										<u-col span="3">
										</u-col>
										<u-col span="6">
											<view style="margin-left: 7rpx">
												<u-text :bold="false" align="left" color="#666666" size="24"
													:text="account.balance+'点'" />
											</view>
										</u-col>
									</u-row>
								</view>
							</view>
						</u-col>
						<u-col span="1"> </u-col>
						<u-col span="5" justify="end">
							<view class="grid-item" style="margin-left: 10rpx;" @click="toGrid(1)">
								<view style="height: 25rpx;">
								</view>
								<u-row>
									<u-col span="3">
										<view style="margin-left: 20rpx;margin-top: 4rpx;">
											<u-icon :bold="false" name="https://api.dayousuoan.top/upload/appstatic/mine/vipbox.png" size="50"></u-icon>
										</view>
									</u-col>
									<u-col span="6">
										<view style="margin-left: 7rpx">
											<u-text :bold="false" align="left" size="36" text="卡包" />
										</view>
									</u-col>
								</u-row>
								<view style="margin-top: 10rpx;">
									<u-row>
										<u-col span="3">
										</u-col>
										<u-col span="6">
											<view style="margin-left: 7rpx">
												<u-text :bold="false" align="left" color="#666666" size="24"
													:text="usableCardText" />
											</view>
										</u-col>
									</u-row>
								</view>
							</view>
						</u-col>
					</u-row>
				</view>
				<!-- 下面两个 -->
				<view style="margin-top: 20rpx;">
					<u-row gutter="0">
						<u-col span="5">
							<view class="grid-item" style="margin-right: 10rpx;" @click="toGrid(2)">
								<view style="height: 25rpx;">
								</view>
								<u-row>
									<u-col span="3">
										<view style="margin-left: 20rpx;margin-top: 4rpx;">
											<u-icon :bold="false" name="https://api.dayousuoan.top/upload/appstatic/mine/save.png" size="50"></u-icon>
										</view>
									</u-col>
									<u-col span="6">
										<view style="margin-left: 7rpx">
											<u-text :bold="false" align="left" size="36" text="储物柜" />
										</view>
									</u-col>
								</u-row>
								<view style="margin-top: 10rpx;">
									<u-row>
										<u-col span="3">
										</u-col>
										<u-col span="6">
											<view style="margin-left: 7rpx">
												<u-text :bold="false" align="left" color="#666666" size="24"
													text="暂未开通" />
											</view>
										</u-col>
									</u-row>
								</view>
							</view>
						</u-col>
						<u-col span="1"> </u-col>
						<u-col span="5" justify="end">
							<view class="grid-item" style="margin-left: 10rpx;" @click="toGrid(3)">
								<view style="height: 25rpx;">
								</view>
								<u-row>
									<u-col span="3">
										<view style="margin-left: 20rpx;margin-top: 4rpx;">
											<u-icon :bold="false" name="https://api.dayousuoan.top/upload/appstatic/mine/mark.png" size="50"></u-icon>
										</view>
									</u-col>
									<u-col span="6">
										<view style="margin-left: 7rpx">
											<u-text :bold="false" align="left" size="36" text="记录" />
										</view>
									</u-col>
								</u-row>
								<view style="margin-top: 10rpx;">
									<u-row>
										<u-col span="3">
										</u-col>
										<u-col span="6">
											<view style="margin-left: 7rpx">
												<u-text :bold="false" align="left" color="#666666" size="24"
													text="学习轨迹" />
											</view>
										</u-col>
									</u-row>
								</view>
							</view>
						</u-col>
					</u-row>
				</view>
			</view>
			<!-- 功能菜单区 -->
			<view class="rank-save">
				<!-- 积分卡片 -->
				<view class="points-card" @click="toPoints">
					<view style="display:flex;align-items:center;">
						<u-icon name="star" color="#ff9900" size="44" />
						<view style="margin-left: 20rpx;">
							<u-text :bold="true" size="32" color="#333" :text="points + ' 积分'" />
							<u-text size="22" color="#999" text="签到得积分 · 抵钱购卡 · 兑换好礼" />
						</view>
					</view>
					<view style="display:flex;align-items:center;">
						<u-text size="24" color="#35a5ed" text="查看详情" />
						<u-icon name="arrow-right" color="#35a5ed" size="26" />
					</view>
				</view>
				<!-- 第一组: 门禁人脸 / 我的预约 -->
				<view class="item" @click="toFaceEnroll">
					<view class="rank">
						<u-row>
							<u-col span="1">
								<view style="background-color: #ffffff;margin-left: 20rpx;width: 60rpx;">
									<u-icon :bold="false" name="fingerprint" size="50"></u-icon>
								</view>
							</u-col>
							<u-col span="7">
								<view style="margin-left: 35rpx;">
									<u-text :bold="false" size="36" text="门禁人脸" />
								</view>
							</u-col>
							<u-col span="4">
								<view style="background-color: #ffffff;margin-right: 20rpx;">
									<u-text :bold="false" size="24" color="#666666" align="right" text="录入人脸刷脸进门" />
								</view>
							</u-col>
						</u-row>
					</view>
				</view>
				<!-- 双人卡兑换 -->
				<view class="item" @click="toCardRedeem">
					<view class="rank">
						<u-row>
							<u-col span="1">
								<view style="background-color: #ffffff;margin-left: 20rpx;width: 60rpx;">
									<u-icon :bold="false" name="gift-fill" size="50" color="#fe2c55"></u-icon>
								</view>
							</u-col>
							<u-col span="7">
								<view style="margin-left: 35rpx;">
									<u-text :bold="false" size="36" text="双人卡兑换" />
								</view>
							</u-col>
							<u-col span="4">
								<view style="background-color: #ffffff;margin-right: 20rpx;">
									<u-text :bold="false" size="24" color="#666666" align="right" text="输入兑换码领卡" />
								</view>
							</u-col>
						</u-row>
					</view>
				</view>
				<view class="item" @click="toSubscription">
					<view class="rank">
						<u-row>
							<u-col span="1">
								<view style="background-color: #ffffff;margin-left: 20rpx;width: 60rpx;">
									<u-icon :bold="false" name="https://api.dayousuoan.top/upload/appstatic/mine/vipbox.png" size="50"></u-icon>
								</view>
							</u-col>
							<u-col span="7">
								<view style="margin-left: 35rpx;">
									<u-text :bold="false" size="36" text="我的预约" />
								</view>
							</u-col>
							<u-col span="4">
								<view style="background-color: #ffffff;margin-right: 20rpx;">
									<u-text :bold="false" size="24" color="#666666" align="right" text="座位预约记录" />
								</view>
							</u-col>
						</u-row>
					</view>
				</view>
				<!-- 第二组: 排行榜 / AI学伴 -->
				<view class="item" @click="toRank">
					<view class="rank">
						<u-row>
							<u-col span="1">
								<view style="background-color: #ffffff;margin-left: 20rpx;width: 60rpx;">
									<u-icon :bold="false" name="https://api.dayousuoan.top/upload/appstatic/mine/rank.png" size="50"></u-icon>
								</view>
							</u-col>
							<u-col span="7">
								<view style="background-color: #ffffff;margin-left: 35rpx;">
									<u-text :bold="false" size="36" text="排行榜" />
								</view>
							</u-col>
							<u-col span="4">
								<view style="background-color: #ffffff;margin-right: 20rpx;">
									<u-text :bold="false" size="24" color="#666666" align="right" text="每日学习排行榜" />
								</view>
							</u-col>
						</u-row>
					</view>
				</view>
				<view class="item" @click="toAI">
					<view class="rank">
						<u-row>
							<u-col span="1">
								<view class="ai-badge">
									<u-text text="AI" size="22" color="#ffffff" bold></u-text>
								</view>
							</u-col>
							<u-col span="7">
								<view style="margin-left: 35rpx;">
									<u-text :bold="false" size="36" text="AI 学伴" />
								</view>
							</u-col>
							<u-col span="4">
								<view style="margin-right: 20rpx;">
									<u-text :bold="false" size="24" color="#666666" align="right" text="问答 · 查座 · 学情" />
								</view>
							</u-col>
						</u-row>
					</view>
				</view>
				<!-- 第三组: 意见反馈 -->
				<view class="item" @click="toFeedback">
					<view class="rank">
						<u-row>
							<u-col span="1">
								<view style="background-color: #ffffff;margin-left: 20rpx;width: 60rpx;">
									<u-icon :bold="false" name="https://api.dayousuoan.top/upload/appstatic/mine/edit.png" size="50"></u-icon>
								</view>
							</u-col>
							<u-col span="7">
								<view style="margin-left: 35rpx;">
									<u-text :bold="false" size="36" text="意见反馈" />
								</view>
							</u-col>
							<u-col span="4">
								<view style="background-color: #ffffff;margin-right: 20rpx;">
									<u-text :bold="false" size="24" color="#666666" align="right" text="联系客服/退款" />
								</view>
							</u-col>
						</u-row>
					</view>
				</view>
				<!-- 退出登录 -->
				<view class="item" @click="logout">
					<view class="rank">
						<u-row>
							<u-col span="1">
								<view style="background-color: #ffffff;margin-left: 20rpx;width: 60rpx;">
									<u-icon :bold="false" name="https://api.dayousuoan.top/upload/appstatic/mine/setting.png" size="50"></u-icon>
								</view>
							</u-col>
							<u-col span="7">
								<view style="margin-left: 35rpx;">
									<u-text :bold="false" size="36" color="#e64340" text="退出登录" />
								</view>
							</u-col>
							<u-col span="4">
								<view style="background-color: #ffffff;margin-right: 20rpx;">
									<u-text :bold="false" size="24" color="#e64340" align="right" text="清理缓存数据" />
								</view>
							</u-col>
						</u-row>
					</view>
				</view>
			</view>
		<!-- 底部一言标语(在菜单最后, tabbar 上方) -->
		<view class="ont-toke">
			<u-text :bold="false" size="24" color="#353535" align="center" :text='oneToke' />
		</view>

		<my-tabbar></my-tabbar>
		</view>
		<!-- 手机号用途说明弹层(收集前告知; 可暂不绑定) -->
		<view v-if="phoneTipShow" class="myph-mask" @click.stop="skipPhoneBind">
			<view class="myph-card" @click.stop>
				<view class="myph-title">手机号用途说明</view>
				<view class="myph-body">
					<view class="myph-item">· 手机号仅用于作为你的登录账号，以及必要时的订单/售后联系；</view>
					<view class="myph-item">· 不会被用于其它用途，也不会泄露给第三方；</view>
					<view class="myph-item">· 你也可以暂不绑定，直接用当前微信账号继续使用全部功能，之后随时可回到本页补绑。</view>
				</view>
				<view class="myph-btns">
					<view class="myph-btn myph-no" @click="skipPhoneBind">暂不绑定</view>
					<button class="myph-btn myph-open" open-type="getPhoneNumber" @getphonenumber="getPhoneNumber">同意并绑定</button>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		mapState,
		mapMutations
	} from 'vuex';
	import {
		login,
		phone,
		getBalance,
		getCard,
		uploadAvatar,
		updateUser,
		getUserProfile,
		myPoints
	} from '@/config/api.js';
	import { ensurePrivacyAuth } from '@/utils/privacy-auth.js';
	import { isCardUsable } from '@/utils/card-usable.js';
	export default {
		data() {
			return {
				oneTokeMarginTop: 0,
				pagePath: [
					'/other_pages_mine/account/account',
					'/other_pages_mine/card_package/card_package',
					'/other_pages_mine/locker/locker',
					'/other_pages_mine/learn_record/learn_record'
				],
				loginLoading: false,
				userInfo: {},
				phone: undefined,
				isLogin: false,
				isPhone: false,
				status: false,
				points: 0,
				showAvatar: true,
				phoneTipShow: false,
			}
		},
		computed: {
			...mapState(['oneToke', 'account']),
			// 可用卡数量文案: 与「我的会员卡(卡包)」口径一致 —— 未激活的卡不过期, 也算可用
			usableCardText() {
				var list = (this.account && this.account.card) ? this.account.card : []
				var usable = list.filter(function(c) {
					return isCardUsable(c)
				})
				return (usable.length > 0 ? usable.length + '张可用' : '暂无可用卡')
			}

		},
		methods: {
			...mapMutations(['setAccount', 'setIndex']),
			setOneTokeMargin() {
				const _this = this
				uni.getSystemInfo({
					success(res) {
						console.log(res.windowWidth)
						_this.oneTokeMarginTop = parseInt((res.windowHeight - 45) * (750 / res.windowWidth))
						console.log(_this.oneTokeMarginTop)
					}
				})
			},
			async changeAvatar() {
				var that = this
				// 微信隐私保护指引授权（相册/相机/选中的照片）：未同意先弹官方窗
				var privacyOk = await ensurePrivacyAuth()
				if (!privacyOk) {
					uni.$u.toast('需先同意《隐私保护指引》才能从相册/相机选择头像')
					return
				}
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: (res) => {
						var path = res.tempFilePaths[0]
						// 先经 getImageInfo 转规范路径再读取, 避免部分机型 readFile 直接读临时路径失败
						uni.getImageInfo({
							src: path,
							success: (info) => {
								that.readAvatarAsBase64(info.path)
							},
							fail: () => {
								that.readAvatarAsBase64(path)
							}
						})
					}
				})
			},
			// 微信官方头像选择(open-type=chooseAvatar)
			onChooseAvatar(e) {
				var that = this
				var path = e.detail.avatarUrl
				if (!path) return
				// 本地预览立即更新(临时路径, 仅当前会话有效)
				that.userInfo.avatarUrl = path
				// 微信 chooseAvatar 返回的临时路径在部分机型/基础库下 readFile 直接读会失败,
				// 先经 getImageInfo 转成规范本地路径再转 base64 上传
				uni.getImageInfo({
					src: path,
					success: (info) => {
						that.readAvatarAsBase64(info.path)
					},
					fail: () => {
						// getImageInfo 失败则尝试直接用原路径读取
						that.readAvatarAsBase64(path)
					}
				})
			},
			// 读取头像临时文件转 base64 并上传后端持久化
			readAvatarAsBase64(path) {
				var that = this
				uni.getFileSystemManager().readFile({
					filePath: path,
					encoding: 'base64',
					success: (r) => {
						var b64 = r.data
						if (b64.length > 300000) {
							uni.$u.toast('头像图片过大，请更换或压缩后再试')
							return
						}
						uploadAvatar({ avatarUrl: b64 }, { custom: { auth: true, catch: true } })
							.then(() => {
								var dataUrl = 'data:image/jpeg;base64,' + b64
								that.userInfo.avatarUrl = dataUrl
								var cached = uni.getStorageSync('userInfo')
								if (cached) {
									try {
										var obj = typeof cached === 'string' ? JSON.parse(cached) : cached
										obj.avatarUrl = dataUrl
										uni.setStorageSync('userInfo', JSON.stringify(obj))
									} catch (e2) {}
								}
								uni.$u.toast('头像已更新')
							})
							.catch((err) => {
								uni.$u.toast((err && err.msg) || '头像上传失败，请稍后再试')
							})
					},
					fail: () => {
						uni.$u.toast('读取头像失败')
					}
				})
			},
			// 头像值归一化: 后端可能返回裸 base64, u-avatar 需要 data:image 前缀, 否则当成路径加载报错
			normalizeAvatar(val) {
				if (!val) return ''
				var s = String(val)
				// 已经是 data:image 前缀
				if (s.indexOf('data:image') === 0) return s
				// 服务器本地存储头像(/upload/...) → 按当前运行环境拼根地址(dev=本地后端, 真机/生产=线上)
				if (s.indexOf('/upload/') === 0) {
					try {
						var cfg = require('@/config/config.js')
						return cfg.currentHost() + s
					} catch (e) {}
					return 'https://api.dayousuoan.top' + s
				}
				// 是 http(s) 或本地路径
				if (s.indexOf('http') === 0 || s.indexOf('/') === 0 || s.indexOf('wxfile') === 0) return s
				// 否则按裸 base64 处理(图片数据以常见头开头)
				if (/^[A-Za-z0-9+/=]+$/.test(s) && s.length > 50) {
					return 'data:image/jpeg;base64,' + s
				}
				return s
			},
			// 从后端拉取用户资料并合并到本地(头像/昵称优先用后端已保存的)
			async refreshUserProfile() {
				var that = this
				try {
					const res = await getUserProfile({}, { custom: { auth: true, catch: true } })
					const profile = res && res.data ? res.data : res
					if (!profile) return
					var cached = uni.getStorageSync('userInfo')
					var local = {}
					if (cached) {
						try { local = typeof cached === 'string' ? JSON.parse(cached) : cached } catch (e) {}
					}
					// 优先后端已保存的头像/昵称
					if (profile.avatarUrl) {
						var normAvatar = that.normalizeAvatar(profile.avatarUrl)
						local.avatarUrl = normAvatar
						local.nickName = profile.nickname || local.nickName || '微信用户'
						that.userInfo = Object.assign({}, that.userInfo || {}, {
							avatarUrl: normAvatar,
							nickName: profile.nickname || that.userInfo.nickName
						})
					}
					if (profile.phone) {
						local.phone = profile.phone
						that.userInfo.phone = profile.phone
						that.isPhone = true
						uni.setStorageSync('isPhone', true)
					}
					// 公开头像开关(默认公开)
					if (profile.showAvatar != null) {
						that.showAvatar = profile.showAvatar === 1
					}
					uni.setStorageSync('userInfo', JSON.stringify(local))
				} catch (e) {
					console.log('刷新用户资料失败', e)
				}
			},
			// 保存昵称(微信昵称填写 input type=nickname)
			saveNickName() {				var that = this
				var nick = (this.userInfo.nickName || '').trim()
				if (!nick || nick === '微信用户') return
				// 更新本地缓存
				var cached = uni.getStorageSync('userInfo')
				if (cached) {
					try {
						var obj = typeof cached === 'string' ? JSON.parse(cached) : cached
						obj.nickName = nick
						uni.setStorageSync('userInfo', JSON.stringify(obj))
					} catch (e) {}
				}
				// 上传后端(更新用户昵称)
				updateUser({ nickname: nick }, { custom: { auth: true, catch: true } })
					.then(() => {
						uni.$u.toast('昵称已更新')
					})
					.catch(() => {})
			},
			// 是否在预约界面公开头像开关
			onShowAvatarChange(val) {
				var that = this
				that.showAvatar = !!val
				// 同步到后端(UserBo.showAvatar: 1公开 0不公开)
				updateUser({ showAvatar: that.showAvatar ? 1 : 0 }, { custom: { auth: true, catch: true } })
					.then(() => {
						uni.$u.toast(that.showAvatar ? '已公开头像' : '已隐藏头像')
					})
					.catch(() => {
						uni.$u.toast('设置失败，请重试')
					})
			},
			toRank() {
				console.log(this.isLogin)
				if (this.isLogin == true) {
					uni.navigateTo({
						url: '/other_pages/rank/rank'
					})
				} else {
					uni.$u.toast("请先登录")
				}

			},
			toAI() {
				if (this.isLogin) {
					uni.navigateTo({
						url: '/other_pages/ai/ai-chat'
					})
				} else {
					uni.$u.toast("请先登录")
				}
			},
						toGrid(num) {
				if (this.isLogin) {
					uni.navigateTo({
						url: this.pagePath[num]
					})
				} else {
					uni.$u.toast("请先登录")
				}

			},
			async toLogin(info, wxCode) {
				const that = this
				try {
					// 本地联调: dev 环境且开启 devMockLogin 时使用模拟 code
					const appConfig = require('@/config/config.js')
					const code = (process.env.NODE_ENV !== 'production' && appConfig.devMockLogin) ? 'mock-demo' : wxCode
					const {
						data
					} = await login({
						code: code
					}, {
						header: {
							'content-type': 'application/x-www-form-urlencoded'
						}
					})
					console.log(data)
					if (data && data.token) {
						uni.setStorageSync('token', data.token)
						uni.setStorageSync('status', true)
						that.status = true
						const localUserInfo = {
							...(info.userInfo || {}),
							nickname: info.userInfo?.nickName || '微信用户',
							avatarUrl: that.normalizeAvatar(info.userInfo?.avatarUrl || '')
						}
						uni.setStorageSync('userInfo', JSON.stringify(localUserInfo))
						uni.setStorageSync('isLogin', true)
						that.userInfo = localUserInfo
						that.isLogin = true
						uni.showToast({
							icon: 'success',
							title: '登录成功'
						})
						this.getAccount().catch(() => {})
						// 登录后拉取后端已保存的用户资料(头像/昵称), 优先用用户上传过的, 避免每次登录被微信默认值覆盖
						this.refreshUserProfile()
					} else {
						uni.$u.toast('登录失败，请重试')
					}
				} catch (err) {
					const message = err?.msg || err?.errMsg || "微信登录失败，请重试"
					console.log("toLogin error:", err)
					uni.$u.toast(message)
				} finally {
					uni.hideLoading()
				}
			},
			checkLogin() {
				return new Promise((resolve, reject) => {
					uni.login({
						provider: 'weixin',
						success(res) {
							if (res && res.code) {
								resolve(res.code)
							} else {
								reject(new Error('获取登录凭证失败'))
							}
						},
						fail(err) {
							reject(err)
						}
					})
				})
			},
			getUserInfo() {
				// 防止快速连点导致 showLoading/hideLoading 不配对
				if (this.loginLoading) return
				this.loginLoading = true
				const that = this
				uni.showLoading({
					title: "正在登录中"
				})
				that.checkLogin().then((wxCode) => {
					// 新版微信基础库 getUserProfile 已无法弹出授权，直接使用默认昵称登录
					const mockUserInfo = {
						userInfo: {
							nickName: '微信用户',
							avatarUrl: ''
						}
					}
					return that.toLogin(mockUserInfo, wxCode)
				}).catch((err) => {
					uni.$u.toast(err?.errMsg || "获取微信登录凭证失败")
				}).finally(() => {
					uni.hideLoading()
					that.loginLoading = false
				})
			},
			// 打开手机号用途说明弹层(收集前告知; 可暂不绑定)
			openPhoneTip() {
				this.phoneTipShow = true
			},
			// 暂不绑定: 关闭弹层, 账号仍可用(手机号仅作为账号, 非必需)
			skipPhoneBind() {
				this.phoneTipShow = false
			},
			getPhoneNumber(e) {
				console.log(e)
				const that = this
				const msg = e.detail.errMsg
				const code = {
					code: e.detail.code
				}
				if (msg == "getPhoneNumber:ok") {
					uni.showLoading({
						title: "正在获取"
					})
					phone(code, {
						header: {
							'content-type': 'application/x-www-form-urlencoded'
						},
						custom: {
							auth: true
						}
					}).then((res) => {

						that.userInfo.phone = res.data.phoneNumber
						uni.setStorageSync('userInfo', JSON.stringify(that.userInfo))
						uni.setStorageSync('isPhone', true)
						that.isPhone = true
						that.phoneTipShow = false
						console.log(that.userInfo)
						console.log(res)
						uni.hideLoading()
						uni.showToast({
							icon: 'success'
						})
					}).catch((err) => {
						uni.hideLoading()
						uni.showToast({
							title: '获取手机号失败，请重试',
							icon: 'none'
						})
					})
				} else {
					// 用户拒绝授权: 可暂不绑定, 账号与功能不受影响
					this.phoneTipShow = false
					uni.$u.toast('已取消绑定，可暂不绑定；需要时随时可回本页绑定')
				}

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
					// 加载积分
					try {
						const { data: p } = await myPoints({}, { custom: { auth: true, catch: true } })
						this.points = Number(p && p.points != null ? p.points : 0)
					} catch (e) {
						this.points = 0
					}
				} catch (res) {
					if (res.code == 401) {
						uni.clearStorageSync()
						this.initData()
					}
				}
				// console.log("getAccount-----", account)


			},
						toSubscription() {
				if (!this.isLogin) {
					uni.$u.toast("请先登录")
					return
				}
				uni.navigateTo({
					url: '/other_pages_mine/my_bookings/my_bookings'
				})
			},
			toFaceEnroll() {
				if (!this.isLogin) {
					uni.$u.toast("请先登录")
					return
				}
				uni.navigateTo({
					url: '/other_pages/access/face-enroll'
				})
			},
			toCardRedeem() {
				uni.navigateTo({
					url: '/other_pages_mine/card-redeem/card-redeem'
				})
			},
			toFeedback() {
				uni.navigateTo({
					url: '/other_pages/feedback/feedback'
				})
			},
			toPoints() {
				uni.navigateTo({
					url: '/other_pages/points/points'
				})
			},
			logout() {
				var that = this
				uni.showModal({
					title: '退出登录',
					content: '退出后将清理本地缓存数据，确定退出吗？',
					confirmText: '退出',
					confirmColor: '#e64340',
					success: (res) => {
						if (!res.confirm) return
						// 清理本地缓存
						uni.clearStorageSync()
						// 重置页面状态
						that.userInfo = {}
						that.phone = undefined
						that.isLogin = false
						that.isPhone = false
						that.status = false
						// 重新加载初始数据
						that.initData()
						uni.$u.toast('已退出登录')
						setTimeout(function() {
							uni.switchTab({ url: '/pages/index/index' })
						}, 600)
					}
				})
			},initData() {
				Object.assign(this, {
					loginLoading: false,
				userInfo: {},
					phone: undefined,
					isLogin: false,
					isPhone: false,
					status: false,
				});
			}

		},
		onShow() {
			console.log("onShow----------")
			this.setIndex(2)
			// 进入「我的」页即提醒隐私授权（头像/昵称/手机号等能力前置同意，官方弹窗）
			ensurePrivacyAuth()
			var isLogin = uni.getStorageSync('isLogin')
			if (isLogin == true) {
				this.getAccount()
				this.refreshUserProfile()
			}
		},
		onReady() {
			console.log("onReady---------")
			this.setOneTokeMargin()
		},
		onLoad() {
			var isLogin = uni.getStorageSync('isLogin')
			if (isLogin == true) {
				// this.getAccount()
				var cached = uni.getStorageSync('userInfo')
				if (cached) {
					try {
						this.userInfo = typeof cached === 'string' ? JSON.parse(cached) : cached
						// 兼容旧缓存里的裸 base64 头像
						if (this.userInfo && this.userInfo.avatarUrl) {
							this.userInfo.avatarUrl = this.normalizeAvatar(this.userInfo.avatarUrl)
						}
					} catch (e) {
						this.userInfo = {}
					}
				} else {
					this.userInfo = {}
				}
				this.isLogin = isLogin
				var isPhone = uni.getStorageSync('isPhone')
				if (isPhone != null && isPhone != '') {
					this.isPhone = isPhone
				} else {
					this.isPhone = false
				}

			} else {
				this.userInfo = {}
				this.isLogin = false
			}
		}
	}
</script>

<style lang="scss">
	.container {
		margin: auto 20rpx;
		margin-top: 20rpx;
		// background-color: #398ADE;
		// height: 300rpx;

	}

	.user {
		.avatar-btn {
			background: transparent;
			padding: 0;
			margin: 0;
			line-height: normal;
			border: none;
			position: relative;
			display: inline-block;

			&::after {
				border: none;
			}
		}

		.user-avatar {
			// margin-top: 20rpx;
			position: relative;

			.avatar-edit {
				position: absolute;
				bottom: -6rpx;
				left: 50%;
				transform: translateX(-50%);
				background: rgba(0, 0, 0, 0.5);
				border-radius: 20rpx;
				padding: 2rpx 12rpx;
				white-space: nowrap;
			}
		}

		.user-info {
			// padding-top: 10rpx;
			margin-left: 30rpx;

			.nick-input {
				width: 320rpx;
				height: 48rpx;
				font-size: 36rpx;
				font-weight: bold;
				color: #303133;
			}

			.nick-placeholder {
				color: #909399;
				font-weight: normal;
			}

			.avatar-public-row {
				display: flex;
				align-items: center;
				margin-top: 12rpx;
				gap: 16rpx;
			}
		}

		.user-icon {}
	}

	.my-grid {
		margin-top: 60rpx;

		// background-color: #4CD964;
		.ai-badge {
	margin-left: 20rpx;
	width: 60rpx;
	height: 60rpx;
	border-radius: 14rpx;
	background: linear-gradient(135deg, #4f7cfe, #7a5cfe);
	display: flex;
	align-items: center;
	justify-content: center;
}
.grid-item {
			// padding: 20rpx auto;
			width: 346rpx;
			height: 150rpx;
			background-color: #ffffff;
			border-radius: 20rpx;
		}
	}

	.rank-save {

		.points-card {
			margin-top: 20rpx;
			background: linear-gradient(135deg, #fff7e6, #fff1cc);
			border-radius: 20rpx;
			padding: 26rpx 30rpx;
			display: flex;
			justify-content: space-between;
			align-items: center;
			border: 2rpx solid #ffe0a3;
		}

		.item {
			margin-top: 20rpx;
			height: 150rpx;
			width: 100%;
			background-color: #ffffff;
			border-radius: 20rpx;
		}

		.rank {
			padding-top: 48rpx;
		}
	}

		.menu-section {
		margin-top: 30rpx;
	}
	.menu-item {
		padding: 30rpx;
		background: #ffffff;
		border-radius: 20rpx;
	}
	.ont-toke {
		margin: 60rpx 40rpx 30rpx;
		display: flex;
		justify-content: center;
	}

	/* 手机号用途说明弹层 */
	.myph-mask {
		position: fixed;
		left: 0;
		top: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.55);
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.myph-card {
		width: 620rpx;
		background: #ffffff;
		border-radius: 24rpx;
		padding: 40rpx 36rpx 32rpx;
		box-sizing: border-box;
	}

	.myph-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #333333;
		text-align: center;
		margin-bottom: 24rpx;
	}

	.myph-body {
		max-height: 480rpx;
		overflow-y: auto;
	}

	.myph-item {
		font-size: 27rpx;
		color: #555555;
		line-height: 1.7;
		margin-bottom: 14rpx;
	}

	.myph-btns {
		display: flex;
		align-items: center;
		margin-top: 30rpx;
	}

	.myph-btn {
		flex: 1;
		height: 84rpx;
		line-height: 84rpx;
		text-align: center;
		font-size: 30rpx;
		border-radius: 44rpx;
	}

	.myph-no {
		color: #999999;
		background: #f2f2f2;
		margin-right: 24rpx;
	}

	.myph-open {
		color: #ffffff;
		background: #07c160;
		padding: 0;
		margin: 0;
		border: none;
	}

	.myph-open::after {
		border: none;
	}
</style>



