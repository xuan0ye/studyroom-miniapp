<template>
	<view>
		<my-navbar leftText="门禁人脸" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<view class="container">
			<!-- 使用说明 -->
			<view class="tip-card">
				<u-text size="26" color="#666" text="录入人脸后，到店可刷脸进入自习室。人脸照片服务器不存储、仅门禁设备本地用于比对；门禁权限随预约结束自动失效。" />
			</view>

			<!-- 官方扫码录入(叶飞云门禁) -->
			<view class="qr-card">
				<view class="qr-title-row">
					<u-text :bold="true" size="30" color="#333" text="扫码录入人脸（官方通道）" />
					<u-tag text="推荐" type="success" size="mini" />
				</view>
				<u-text size="24" color="#888" text="长按下方二维码识别，或保存图片后用微信扫一扫，在官方页面录入人脸后即可刷脸进门" />
				<view class="qr-box">
					<image src="https://api.dayousuoan.top/upload/appstatic/other_pages/static/access/face-enroll-qr.png" mode="aspectFit" class="qr-img" show-menu-by-longpress="true" />
				</view>
				<view style="margin-top: 20rpx;">
					<u-button color="#35a5ed" plain size="small" shape="circle" @click="saveQr" text="保存二维码到相册" />
				</view>
			</view>

			<!-- 人脸照片 -->
			<view class="face-card" @click="chooseImage">
				<image v-if="faceUrl" :src="faceUrl" class="face-img" mode="aspectFill" />
				<view v-else class="face-placeholder">
					<u-icon name="camera-fill" color="#bbbbbb" size="80"></u-icon>
					<view style="height: 16rpx;"></view>
					<u-text size="28" color="#999" text="点击拍照或从相册选择人脸照片" />
				</view>
			</view>

			<!-- 当前档案状态 -->
			<view v-if="profile" class="status-card">
				<view class="status-row">
					<u-text size="28" color="#333" text="门禁状态：" />
					<u-tag :text="syncLabel(profile.syncStatus)" :type="syncType(profile.syncStatus)" size="mini" />
				</view>
				<view class="status-row" v-if="profile.syncErrmsg">
					<u-text size="26" color="#e64340" :text="profile.syncErrmsg" />
				</view>
				<view class="status-row" v-if="profile.jobnumber">
					<u-text size="26" color="#999" :text="'门禁工号：' + profile.jobnumber" />
				</view>
			</view>

			<view style="margin-top: 30rpx;">
				<u-button color="#35a5ed" size="large" shape="circle" :loading="uploading" @click="upload"
					text="提交人脸，开通门禁" />
			</view>
			<view style="margin-top: 20rpx;" v-if="profile && profile.syncStatus === 1">
				<u-button type="warning" plain size="large" shape="circle" :loading="opening" @click="openDoor"
					text="远程开门" />
			</view>
		</view>
		<!-- 人脸隐私告知弹窗(进入页面即弹出; 不同意无法使用拍照录入) -->
		<view v-if="privacyShow" class="facepriv-mask" @click.stop.prevent="refusePrivacy">
			<view class="facepriv-card" @click.stop.prevent>
				<view class="facepriv-title">人脸隐私告知</view>
				<view class="facepriv-body">
					<view class="facepriv-item">· 用途：你的人脸照片仅用于「到店刷脸开门」1:1 比对；</view>
					<view class="facepriv-item">· 服务器不存储：照片不会上传、不会保存到自习室服务器；</view>
					<view class="facepriv-item">· 仅门禁本地保存：照片只写入门店门禁设备本地，用于开门时比对；</view>
					<view class="facepriv-item">· 有效期：门禁权限随本次预约结束自动失效，设备端人脸将被清除，也可随时联系门店删除。</view>
				</view>
				<view class="facepriv-btns">
					<view class="facepriv-btn facepriv-no" @click.stop="refusePrivacy">不同意</view>
					<view class="facepriv-btn facepriv-yes" @click.stop="agreePrivacy">同意并继续</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { accessFaceUpload, accessProfile, accessOpenDoor } from '@/config/api.js'
	import { ensurePrivacyAuth } from '@/utils/privacy-auth.js'
	export default {
		data() {
			return {
				faceUrl: '',
				faceBase64: '',
				profile: null,
				uploading: false,
				opening: false,
				// 人脸隐私同意(独立key v2: 老版本同意过也要重新确认新隐私条款)
				faceConsented: uni.getStorageSync('face_enroll_consent_v2') === '1',
				privacyShow: false,
				privacyResolve: null
			}
		},
		methods: {
			/** 人脸隐私告知(用途限定 + 存储策略): 未同意不采集; 已同意过(本版本)直接放行 */
			ensureFaceConsent() {
				if (this.faceConsented) return Promise.resolve(true)
				return new Promise((resolve) => {
					this.privacyResolve = resolve
					this.privacyShow = true
				})
			},
			agreePrivacy() {
				this.privacyShow = false
				this.faceConsented = true
				uni.setStorageSync('face_enroll_consent_v2', '1')
				var r = this.privacyResolve
				this.privacyResolve = null
				if (r) r(true)
			},
			refusePrivacy() {
				this.privacyShow = false
				var r = this.privacyResolve
				this.privacyResolve = null
				if (r) r(false)
				uni.$u.toast('不同意将无法使用拍照/相册录入人脸，可长按二维码走官方通道，或到店咨询工作人员')
			},
			syncLabel(s) {
				if (s === 1) return '已同步'
				if (s === 2) return '同步失败'
				return '待同步'
			},
			syncType(s) {
				if (s === 1) return 'success'
				if (s === 2) return 'error'
				return 'primary'
			},
			async chooseImage() {
				var that = this
				// 人脸采集前需单独同意，未同意则不拉起相机/相册
				var agreed = await this.ensureFaceConsent()
				if (!agreed) return
				// 微信隐私保护指引授权（相机/相册/选中的照片）：未同意则微信官方弹窗提示
				var privacyOk = await ensurePrivacyAuth()
				if (!privacyOk) {
					uni.$u.toast('需先同意《隐私保护指引》才能拍照/选择相册照片')
					return
				}
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['camera', 'album'],
					success: (res) => {
						var path = res.tempFilePaths[0]
						that.faceUrl = path
						that.compressToBase64(path)
					}
				})
			},
			compressToBase64(path) {
				var that = this
				uni.getFileSystemManager().readFile({
					filePath: path,
					encoding: 'base64',
					success: (res) => {
						that.faceBase64 = res.data
					},
					fail: () => {
						uni.$u.toast('读取照片失败')
					}
				})
			},
			saveQr() {
				var that = this
				// 包内静态图片需先解析出本地可写路径再保存相册
				uni.getImageInfo({
					src: 'https://api.dayousuoan.top/upload/appstatic/other_pages/static/access/face-enroll-qr.png',
					success: (info) => {
						uni.saveImageToPhotosAlbum({
							filePath: info.path,
							success: () => {
								uni.$u.toast('已保存，打开微信扫一扫即可录入')
							},
							fail: (e) => {
								if (e && e.errMsg && e.errMsg.indexOf('auth') > -1) {
									uni.showModal({
										title: '提示',
										content: '需要相册权限，请在设置中开启',
										confirmText: '去设置',
										success: (r) => {
											if (r.confirm) uni.openSetting()
										}
									})
								} else {
									uni.$u.toast('保存失败，可长按二维码识别')
								}
							}
						})
					},
					fail: () => {
						uni.$u.toast('二维码加载失败，可长按识别')
					}
				})
			},
			async upload() {
				if (!this.faceBase64) return uni.$u.toast('请先选择人脸照片')
				// 提交前再次确认同意状态（防止本地缓存被清除）
				if (!this.faceConsented) {
					var agreed = await this.ensureFaceConsent()
					if (!agreed) return
				}
				if (this.faceBase64.length > 300000) return uni.$u.toast('照片过大，请更换或压缩后再试')
				this.uploading = true
				try {
					const { data: profile } = await accessFaceUpload({ facePhotoBase64: this.faceBase64 }, { custom: { auth: true, catch: true } })
					this.profile = profile
					if (profile && profile.syncStatus === 1) {
						uni.$u.toast('人脸已同步到门禁，可刷脸进门')
					} else if (profile && profile.syncStatus === 2) {
						uni.$u.toast((profile.syncErrmsg && profile.syncErrmsg.indexOf('未绑定') > -1) ? '自习室未绑定门禁设备' : '同步失败，请稍后重试')
					} else {
						uni.$u.toast('已提交，等待同步')
					}
				} catch (e) {
					uni.$u.toast((e && e.msg) || '上传失败，请稍后再试')
				} finally {
					this.uploading = false
				}
			},
			async openDoor() {
				this.opening = true
				try {
					await accessOpenDoor({}, { custom: { auth: true, catch: true } })
					uni.$u.toast('开门指令已下发')
				} catch (e) {
					uni.$u.toast((e && e.msg) || '开门失败，请稍后再试')
				} finally {
					this.opening = false
				}
			},
			async loadProfile() {
				try {
					const { data: profile } = await accessProfile({}, { custom: { auth: true, catch: true } })
					this.profile = profile || null
				} catch (e) {
					this.profile = null
				}
			}
		},
		onLoad() {
			// 进入人脸界面即弹出「人脸隐私告知」(业务弹层: 用途限定 + 服务器不存储 + 仅门禁本地)
			// 同意后再走微信《隐私保护指引》授权(相机/相册, 官方弹窗, 未同意不阻塞浏览)
			this.ensureFaceConsent().then((ok) => {
				if (ok) {
					ensurePrivacyAuth()
				}
			})
		},
		onShow() {
			this.loadProfile()
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		padding: 30rpx;
	}

	.tip-card {
		background: #f0f7ff;
		border-radius: 16rpx;
		padding: 20rpx 24rpx;
		margin-bottom: 30rpx;
	}

	.qr-card {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 24rpx;
		margin-bottom: 30rpx;
		border: 2rpx solid #e5e5e5;
	}

	.qr-title-row {
		display: flex;
		align-items: center;
		margin-bottom: 12rpx;
	}

	.qr-title-row .u-tag {
		margin-left: 12rpx;
	}

	.qr-box {
		margin-top: 20rpx;
		background: #ffffff;
		border-radius: 16rpx;
		padding: 20rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		border: 2rpx dashed #d5d5d5;
	}

	.qr-img {
		width: 420rpx;
		height: 420rpx;
	}

	.face-card {
		height: 420rpx;
		background: #f7f7f7;
		border-radius: 20rpx;
		display: flex;
		justify-content: center;
		align-items: center;
		overflow: hidden;
		border: 2rpx dashed #d5d5d5;
	}

	.face-img {
		width: 100%;
		height: 100%;
	}

	.face-placeholder {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.status-card {
		background: #fff;
		border-radius: 16rpx;
		padding: 24rpx;
		margin-top: 30rpx;
	}

	.status-row {
		display: flex;
		align-items: center;
		margin-bottom: 12rpx;
	}

	/* 人脸隐私告知弹层 */
	.facepriv-mask {
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

	.facepriv-card {
		width: 600rpx;
		background: #ffffff;
		border-radius: 24rpx;
		padding: 40rpx 36rpx 30rpx;
		box-sizing: border-box;
	}

	.facepriv-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #333333;
		text-align: center;
		margin-bottom: 24rpx;
	}

	.facepriv-body {
		max-height: 520rpx;
		overflow-y: auto;
	}

	.facepriv-item {
		font-size: 27rpx;
		color: #555555;
		line-height: 1.7;
		margin-bottom: 14rpx;
	}

	.facepriv-btns {
		display: flex;
		margin-top: 30rpx;
	}

	.facepriv-btn {
		flex: 1;
		height: 84rpx;
		line-height: 84rpx;
		text-align: center;
		font-size: 30rpx;
		border-radius: 44rpx;
	}

	.facepriv-no {
		color: #999999;
		background: #f2f2f2;
		margin-right: 24rpx;
	}

	.facepriv-yes {
		color: #ffffff;
		background: #35a5ed;
	}
</style>
