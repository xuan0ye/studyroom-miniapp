<template>
	<view class="wifi-page">
		<my-navbar leftText="到店 Wi-Fi" leftIcon="arrow-left" :custom="false" :autoBack="true" bgColor="#ffffff" leftIconSize="40" />
		<view class="wifi-content">
			<view v-if="checkingCard" class="wifi-panel">正在检查会员卡…</view>
			<view v-else-if="canUseWifi" class="wifi-panel">
				<view class="wifi-network">
					<view class="wifi-icon"><u-icon name="wifi" size="46" color="#2586c5" /></view>
					<view>
						<text class="wifi-label">网络名称</text>
						<text class="wifi-name">{{ wifi.ssid }}</text>
					</view>
				</view>
				<view class="wifi-password">
					<text class="wifi-label">密码</text>
					<text class="wifi-password-value" :user-select="true">{{ wifi.password }}</text>
				</view>
				<u-button color="#2586c5" shape="circle" text="连接 Wi-Fi" :loading="connecting" :disabled="connecting" @click="connect" />
				<view class="wifi-copy">
					<u-button color="#2586c5" plain shape="circle" text="复制密码" @click="copyPassword" />
				</view>
				<text v-if="feedback" class="wifi-feedback" :class="{ 'wifi-confirmed': connected }" role="status">{{ feedback }}</text>
				<text v-else class="wifi-feedback">也可在手机 Wi-Fi 设置中选择「{{ wifi.ssid }}」，输入上方密码。</text>
			</view>
			<view v-else class="wifi-panel">{{ unavailableMessage }}</view>
		</view>
	</view>
</template>

<script>
	import { storeWifi } from '@/config/store-wifi.js'
	import { getMyCard } from '@/config/api.js'
	import { isLoggedIn } from '@/utils/auth.js'
	import { connectStoreWifi, hasValidStoreWifiCard } from '@/utils/store-wifi.js'

	export default {
		data() {
			return {
				wifi: storeWifi,
				checkingCard: true,
				canUseWifi: false,
				unavailableMessage: '',
				connecting: false,
				connected: false,
				feedback: '',
				unloaded: false
			}
		},
		onShow() {
			this.checkCard()
		},
		onUnload() {
			this.unloaded = true
		},
		methods: {
			async checkCard() {
				this._cardRequest = null
				this.canUseWifi = false
				this.checkingCard = false
				if (!isLoggedIn()) {
					this.unavailableMessage = '请登录后使用到店 Wi-Fi。'
					return
				}
				if (!this.wifi.password) {
					this.unavailableMessage = '请向店员咨询门店 Wi-Fi。'
					return
				}
				this.checkingCard = true
				const request = getMyCard({}, { custom: { auth: true, catch: true, toast: false } })
				this._cardRequest = request
				try {
					const res = await request
					if (this.unloaded || this._cardRequest !== request) return
					const cards = res && res.data ? res.data : res
					this.canUseWifi = isLoggedIn() && hasValidStoreWifiCard(cards)
					this.unavailableMessage = '持有效卡可使用到店 Wi-Fi。'
				} catch (error) {
					if (this.unloaded || this._cardRequest !== request) return
					this.unavailableMessage = '暂时无法验证会员卡，请返回后重试。'
				} finally {
					if (!this.unloaded && this._cardRequest === request) this.checkingCard = false
				}
			},
			async connect() {
				if (this.connecting || !this.canUseWifi || !isLoggedIn()) return
				this.connecting = true
				this.connected = false
				this.feedback = ''
				const manual = '请在手机 Wi-Fi 设置中选择「' + this.wifi.ssid + '」，输入上方密码。'
				try {
					let api
					// #ifdef MP-WEIXIN
					api = wx
					// #endif
					const device = api && (api.getDeviceInfo ? api.getDeviceInfo() : uni.getSystemInfoSync())
					const result = await connectStoreWifi(api, device && device.platform, this.wifi)
					if (this.unloaded) return
					this.connected = result === 'connected'
					this.feedback = this.connected ? '已连接「' + this.wifi.ssid + '」' : manual
				} catch (error) {
					if (this.unloaded) return
					const hint = Number(error && error.errCode) === 12005 ? '请先打开手机的 Wi-Fi 开关。' : '暂未连上。'
					this.feedback = hint + manual
				} finally {
					if (!this.unloaded) this.connecting = false
				}
			},
			copyPassword() {
				if (!this.canUseWifi || !isLoggedIn()) return
				uni.setClipboardData({
					data: this.wifi.password,
					fail: () => {
						if (!this.unloaded) uni.showToast({ title: '请长按密码复制', icon: 'none' })
					}
				})
			}
		}
	}
</script>

<style scoped>
	.wifi-page { min-height: 100vh; background: #f5f9fc; }
	.wifi-content { padding: 32rpx 40rpx; }
	.wifi-panel { padding: 36rpx; border-radius: 24rpx; background: #fff; color: #24364a; }
	.wifi-network { display: flex; align-items: center; }
	.wifi-icon { display: flex; align-items: center; justify-content: center; width: 84rpx; height: 84rpx; margin-right: 22rpx; border-radius: 20rpx; background: #eaf5fd; }
	.wifi-label { display: block; color: #536579; font-size: 25rpx; }
	.wifi-name { display: block; margin-top: 5rpx; font-weight: 600; font-size: 38rpx; }
	.wifi-password { margin: 30rpx 0; padding: 22rpx 24rpx; border-radius: 16rpx; background: #f5f8fc; }
	.wifi-password-value { display: block; margin-top: 8rpx; font-family: monospace; font-size: 33rpx; word-break: break-all; }
	.wifi-copy { margin-top: 18rpx; }
	.wifi-feedback { display: block; margin-top: 24rpx; color: #536579; font-size: 25rpx; line-height: 1.7; }
	.wifi-confirmed { color: #18724c; }
</style>
