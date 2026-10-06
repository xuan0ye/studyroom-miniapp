<template>
	<view style="background-color: #ffffff; min-height: 100vh;">
		<my-navbar leftText=" " :custom="true" :autoBack="false" />
		<view style="margin: 100rpx; margin-top: 200rpx;">

			<u-row>
				<u-col span="2">
					<u-icon color="#1daa07" name="weixin-circle-fill" size="100"></u-icon>
				</u-col>
				<u-col span="10">
					<view style="padding-top: 15px; margin-left: 10px;">
						<text style="font-size: 18px; font-weight: 700;">答岸自习室</text>
						<text style="font-weight: 600; font-size: 16px;"> 授权登录</text>
					</view>
				</u-col>
			</u-row>

			<view style="margin: 10px 0px;">
				<u-line />
			</view>

			<view style="margin-top: 10px; font-size: 16px; font-weight: 600; color: #666;">
				<text>授权微信手机号以完成登录</text>
			</view>

			<u-line />

			<view style="margin-top: 60px; font-size: 13px; color: #999; text-align: center;">
				<view class="agree-row" @click="agree = !agree">
					<view class="agree-check" :class="{ 'checked': agree }">
						<u-icon v-if="agree" name="checkmark" color="#fff" size="16"></u-icon>
					</view>
					<text>已阅读并同意</text>
					<text style="color: #2B85E4;" @click.stop="toAgreement('user')">《用户服务协议》</text>
					<text>和</text>
					<text style="color: #2B85E4;" @click.stop="toAgreement('privacy')">《隐私政策》</text>
				</view>
			</view>

			<view style="margin-top: 40px; display: flex; flex-direction: column; align-items: center;">
				<!-- 微信手机号快速验证按钮-->
				<button
					class="phone-login-btn"
					open-type="getPhoneNumber"
					@getphonenumber="handleGetPhoneNumber"
					:loading="loading"
					:disabled="loading"
				>
					<view style="display: flex; align-items: center; justify-content: center;">
						<u-icon name="weixin-circle-fill" color="#fff" size="36" />
						<text style="margin-left: 10rpx; color: #fff; font-size: 30rpx;">微信手机号一键登录</text>
					</view>
				</button>
				<view style="margin-top: 30rpx;" @click="skipLogin">
					<text style="color: #999; font-size: 24rpx;">暂不登录，先看看</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { login, phone } from '@/config/api.js'
	import { markNewUserFromLogin, runUserGuide } from '@/utils/user-guide.js'
	export default {
		name: 'my-login',
		data() {
			return {
				loading: false,
				agree: false
			}
		},
		methods: {
			toAgreement(type) {
				uni.navigateTo({
					url: '/other_pages/agreement/agreement?type=' + type
				})
			},
			handleGetPhoneNumber(e) {
				const that = this
				// 合规前置检查: 未勾选协议时不得发起授权登录
				if (!this.agree) {
					uni.$u.toast('请先阅读并勾选同意协议')
					return
				}
				console.log('getPhoneNumber event:', e.detail)
				if (e.detail.errMsg !== 'getPhoneNumber:ok') {
					uni.$u.toast('授权取消')
					return
				}
				that.loading = true
				const phoneCode = e.detail.code

				// 步骤1: 先调用wx.login获取登录code
				uni.login({
					provider: 'weixin',
					success(res) {
						// 本地联调: dev 环境且开启 devMockLogin 时使用模拟 code
						const appConfig = require('@/config/config.js')
						const loginCode = (process.env.NODE_ENV !== 'production' && appConfig.devMockLogin) ? 'mock-demo' : res.code
						// 步骤2: 发送 login code 到后端获取token
						login({ code: loginCode }, {
							header: { 'content-type': 'application/x-www-form-urlencoded' }
						}).then((data) => {
							uni.setStorageSync('token', data.data.token)
							uni.setStorageSync('isLogin', true)
							// 记录"本次是否新注册": 新人引导延后到整个登录流程结束再弹(先不打断授权手机号)
							markNewUserFromLogin(data.data)

							// 步骤3: 发送 phone code 到后端绑定手机号
							return phone({ code: phoneCode }, {
								header: { 'content-type': 'application/x-www-form-urlencoded' },
								custom: { auth: true }
							})
						}).then((phoneData) => {
							console.log('手机号绑定成功', phoneData)
							uni.setStorageSync('phone', phoneData.data.phoneNumber)
							that.loading = false
							uni.$u.toast('登录成功')
							// 新人引导: 新用户弹「联系客服领体验卡 + 先录人脸再到店」, 老用户检查人脸提醒
							runUserGuide()

							// 回到上一页或首页
							setTimeout(() => {
								const pages = getCurrentPages()
								if (pages.length > 1) {
									uni.navigateBack()
								} else {
									uni.switchTab({ url: '/pages/index/index' })
								}
							}, 500)
						}).catch((err) => {
							that.loading = false
							console.error('登录失败:', err)
							// 如果 login 成功但 phone 失败，也算登录成功（只是没手机号）
							if (uni.getStorageSync('token')) {
								uni.$u.toast('登录成功')
								setTimeout(() => {
									const pages = getCurrentPages()
									if (pages.length > 1) {
										uni.navigateBack()
									} else {
										uni.switchTab({ url: '/pages/index/index' })
									}
								}, 500)
							} else {
								uni.$u.toast('登录失败，请重试')
							}
						})
					},
					fail(err) {
						that.loading = false
						console.error('wx.login失败:', err)
						uni.$u.toast('登录失败，请重试')
					}
				})
			},
			skipLogin() {
				const pages = getCurrentPages()
				if (pages.length > 1) {
					uni.navigateBack()
				} else {
					uni.switchTab({ url: '/pages/index/index' })
				}
			}
		}
	}
</script>

<style>
	.phone-login-btn {
		width: 540rpx;
		height: 90rpx;
		background: linear-gradient(135deg, #07c160, #06ad56);
		border-radius: 45rpx;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 0;
		margin: 0;
		line-height: 90rpx;
	}
	.phone-login-btn::after {
		border: none;
	}

	.agree-row {
		display: flex;
		flex-direction: row;
		align-items: center;
		justify-content: center;
		flex-wrap: wrap;
	}

	.agree-check {
		width: 32rpx;
		height: 32rpx;
		border-radius: 50%;
		border: 2rpx solid #ccc;
		margin-right: 8rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.agree-check.checked {
		background: #07c160;
		border-color: #07c160;
	}
</style>
