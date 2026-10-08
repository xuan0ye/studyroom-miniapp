<template>
	<view>
		<my-navbar leftText="门禁人脸" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<view class="container">
			<!-- 使用说明 -->
			<view class="tip-card">
				<u-text size="26" color="#666" text="录入人脸后，到店可刷脸进入自习室。人脸照片服务器不存储、仅门禁设备本地用于比对；门禁权限随预约结束自动失效。" />
			</view>

			<!--
				已移除「扫码录入人脸（官方通道）」二维码块。
				原因是它会把用户引到厂商页面(access.yefiot.com)录脸: 那样人脸只进设备、不进我们的数据库,
				于是门店门禁上会积累一批"系统不知道是谁、也无法撤销"的权限
				(实测设备上 127 人里, 120 人属于这类)。
				现在只保留本页的"拍照上传"一条路径 —— 录过的人我们才有记录, 预约结束才能自动撤销。
			-->

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
			<view v-if="profile && profile.jobnumber" class="status-card">
				<view class="status-row">
					<u-text size="28" color="#333" text="人脸下发状态：" />
					<u-tag :text="syncLabel(profile.syncStatus)" :type="syncType(profile.syncStatus)" size="mini" />
				</view>
				<view class="status-row" v-if="profile.syncErrmsg">
					<u-text size="26" color="#e64340" :text="profile.syncErrmsg" />
				</view>
				<view class="status-row" v-if="profile.jobnumber">
					<u-text size="26" color="#999" :text="'门禁工号：' + profile.jobnumber" />
				</view>
				<!-- 门禁设备真实在线情况: 人脸"已下发"不等于设备在线 -->
				<view class="status-row">
					<u-text size="26" :color="deviceOnline ? '#67c23a' : '#e64340'"
						:text="deviceOnline ? '门禁设备在线' : ('门禁设备不在线' + (profile.deviceLastOnline ? '（最后在线 ' + profile.deviceLastOnline + '）' : '（从未接入）'))" />
				</view>
			</view>

			<view style="margin-top: 30rpx;">
				<u-button color="#35a5ed" size="large" shape="circle" :loading="uploading" @click="upload"
					text="提交人脸，开通门禁" />
			</view>

			<!--
				离屏 canvas: 只用于把照片缩到门禁设备能吃的大小(宽高 < 1024 的 JPEG)。
				放在屏幕外即可, 不需要用户看见。
			-->
			<canvas canvas-id="faceCanvas" id="faceCanvas"
				style="position: fixed; left: -9999px; top: -9999px; width: 800px; height: 800px;"></canvas>
			<!--
				一键开门(2026-10-08 恢复): 原先撤掉是因为判定"该型号不支持服务器远程开门" ——
				但那个结论来自用 action 协议 {"action":"open_door"} 的实测, 而厂商两版协议文档里
				"远程开门"都是走 cs 协议的 cmd 报文(v1.11 (五) cmd=openDoor / v1.12 第11节 cmd=F1openDoor),
				设备回 {"result":0} 即成功, 并会补一条"开门记录上传"(开门类型 5=远程开门)。
				后端已改为按文档下发, 并以设备回执 result=0 为准 —— 失败会如实报错, 不会假成功。
			-->
			<view v-if="canOpenDoor" style="margin-top: 20rpx; padding: 24rpx; background: #f0fff6; border-radius: 16rpx;">
				<u-text size="26" color="#19be6b" align="center" text="到店可直接点下面按钮开门, 也可以刷脸进门" />
				<view style="margin-top: 16rpx; display: flex; justify-content: center;">
					<u-button type="success" color="#19be6b" shape="circle" size="medium"
						:loading="doorLoading" @click="openDoor" text="一键开门" />
				</view>
				<view style="margin-top: 10rpx;">
					<u-text size="22" color="#999" align="center"
						text="按钮只在当天有有效预约时可用；刷脸不成功可找工作人员，或改用门禁机上的刷卡/密码" />
				</view>
			</view>
		</view>
		<!-- 人脸隐私告知弹窗(进入页面即弹出; 不同意无法使用拍照录入) -->
		<view v-if="privacyShow" class="facepriv-mask" @click.stop.prevent="refusePrivacy">
			<view class="facepriv-card" @click.stop.prevent>
				<view class="facepriv-title">人脸隐私告知</view>
				<view class="facepriv-body">
					<view class="facepriv-item">· 用途：你的人脸照片仅用于「到店刷脸开门」1:1 比对；</view>
					<view class="facepriv-item">· 服务器不存储：照片会经本系统接口转发到门店门禁设备，服务器不留存、不落库；</view>
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
				// 一键开门(仅当天有有效预约时可点; 后端会再校验)
				doorLoading: false,
				// 人脸隐私同意(独立key v2: 老版本同意过也要重新确认新隐私条款)
				faceConsented: uni.getStorageSync('face_enroll_consent_v2') === '1',
				privacyShow: false,
				privacyResolve: null
			}
		},
		computed: {
			// 是否显示「一键开门」: 后端按"当天有有效预约"判定, 与人脸下发状态无关
			canOpenDoor() {
				return !!(this.profile && this.profile.canOpenDoor)
			},
			// 门禁设备是否在线: 超过 1 天未上线即视为离线(与后端 buildPublishFailReason 口径一致)
			deviceOnline() {
				var t = this.profile && this.profile.deviceLastOnline
				if (!t) return false
				var d = new Date(String(t).replace(/-/g, '/'))
				if (isNaN(d.getTime())) return false
				return (Date.now() - d.getTime()) < 86400000
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
				// 原实现只是把原图 readFile 成 base64 —— 名为压缩、实为不压缩,
				// 所以手机原图(3~5MB)转 base64 必然超过 30 万字符的门槛, 用户怎么压都没用。
				// 现在真的用 canvas 缩放 + 转 JPEG:
				//   ① 门禁设备要求宽高 < 1024, 原图分辨率本来就不合规;
				//   ② 设备只吃 JPEG;
				//   ③ 缩到 800px/质量 0.7 后 base64 通常 10~25 万字符, 稳稳在门槛内。
				var MAX = 800
				var QUALITY = 0.7
				var fallback = function() {
					uni.getFileSystemManager().readFile({
						filePath: path,
						encoding: 'base64',
						success: (r) => { that.faceBase64 = r.data },
						fail: () => { that.faceBase64 = ''; uni.$u.toast('读取照片失败') }
					})
				}
				uni.getImageInfo({
					src: path,
					success: (info) => {
						var w = info.width || 0
						var h = info.height || 0
						if (!w || !h) return fallback()
						if (w > MAX || h > MAX) {
							var ratio = Math.min(MAX / w, MAX / h)
							w = Math.round(w * ratio)
							h = Math.round(h * ratio)
						}
						var ctx = uni.createCanvasContext('faceCanvas', that)
						ctx.drawImage(info.path, 0, 0, w, h)
						ctx.draw(false, function() {
							uni.canvasToTempFilePath({
								canvasId: 'faceCanvas',
								width: w,
								height: h,
								destWidth: w,
								destHeight: h,
								fileType: 'jpg',
								quality: QUALITY,
								success: (out) => {
									uni.getFileSystemManager().readFile({
										filePath: out.tempFilePath,
										encoding: 'base64',
										success: (r) => { that.faceBase64 = r.data },
										fail: fallback
									})
								},
								fail: fallback
							}, that)
						})
					},
					fail: fallback
				})
			},
			// 原 saveQr()「保存二维码到相册」已随官方扫码通道一起移除(见模板注释)
			async upload() {
				if (!this.faceBase64) return uni.$u.toast('请先选择人脸照片')
				// 提交前再次确认同意状态（防止本地缓存被清除）
				if (!this.faceConsented) {
					var agreed = await this.ensureFaceConsent()
					if (!agreed) return
				}
				if (this.faceBase64.length > 300000) {
					// 正常路径下 canvas 已缩到 800px/质量 0.7, 不该再到这; 到这说明压缩那步失败了
					return uni.$u.toast('照片处理失败（' + Math.round(this.faceBase64.length / 1000) + 'K），请重选一张或改用拍照')
				}
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
			/**
			 * 一键开门(2026-10-08 恢复)。
			 * 后端按厂商协议文档下发 cmd=F1openDoor(cs 通道), 并以设备回执 result=0 作为成功判据,
			 * 所以这里返回成功 = 门真的开了; 无有效预约/设备不在线 都会如实报错。
			 */
			async openDoor() {
				if (this.doorLoading) return
				this.doorLoading = true
				try {
					const res = await accessOpenDoor({}, { custom: { auth: true, catch: true } })
					if (res && res.code === 200 && res.data === true) {
						uni.$u.toast('门已打开，请推门进入')
					} else {
						uni.$u.toast((res && res.msg) || '开门失败，请到门口刷脸或联系工作人员')
					}
				} catch (e) {
					uni.$u.toast((e && e.msg) || '开门失败，请到门口刷脸或联系工作人员')
				} finally {
					this.doorLoading = false
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

	/* 原 .qr-card / .qr-title-row / .qr-box / .qr-img 已随官方扫码通道移除 */

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
