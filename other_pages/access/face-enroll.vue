<template>
	<view>
		<my-navbar leftText="门禁人脸" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<view class="container">
			<!-- 使用说明 -->
			<view class="tip-card">
				<u-text size="26" color="#666" text="有当前有效预约或参观券，可拍照上传，也可站到门禁前使用设备摄像头录脸。请本人操作，通行时间以门店授权为准。" />
			</view>

			<view class="enrollment-card">
				<view class="enrollment-heading">
					<u-icon :name="hasUploadedFace ? 'checkmark-circle-fill' : 'account'" :color="hasUploadedFace ? '#19be6b' : '#35a5ed'" size="42" />
					<view class="enrollment-title">{{ profileLoading ? '正在读取人脸状态…' : (hasUploadedFace ? '已上传人脸' : '门禁人脸') }}</view>
				</view>
				<view class="enrollment-description">{{ hasUploadedFace ? '人脸已成功提交至门禁。如需更换照片，可重新录入。' : '如果已录过人脸并能正常刷脸进门，无需重复上传；需要新增或更换照片时，可在下方录入。' }}</view>
				<view v-if="hasUploadedFace && !editingFace" class="edit-face" @click="beginFaceEdit">重新录入人脸</view>
				<view v-if="hasUploadedFace && editingFace && !uploading" class="edit-face" @click="cancelFaceEdit">取消更换</view>
			</view>

			<!-- 人脸照片 -->
			<view v-if="showEnrollmentForm && cameraEnabled" class="door-camera-card">
				<u-button plain color="#35a5ed" shape="circle" :loading="cameraBusy" :disabled="uploading"
					@click="startDoorCapture" text="到门禁前，用设备摄像头拍照" />
				<view class="door-camera-tip">请本人站到门禁摄像头前，一次只站一人。拍摄后先核对照片，再确认录入。</view>
				<view v-if="cameraMessage" class="door-camera-message">{{ cameraMessage }}</view>
				<view v-if="cameraSessionId" class="door-camera-cancel" @click="cancelDoorCapture">取消本次门禁拍照</view>
			</view>
			<view v-if="showEnrollmentForm" class="face-card" @click="chooseImage">
				<image v-if="faceUrl" :src="faceUrl" class="face-img" mode="aspectFill" />
				<view v-else class="face-placeholder">
					<u-icon name="camera-fill" color="#bbbbbb" size="80"></u-icon>
					<view style="height: 16rpx;"></view>
					<u-text size="28" color="#999" text="点击拍照或从相册选择人脸照片" />
				</view>
			</view>

			<view v-if="operationMessage" class="operation-message" :class="{ 'operation-success': operationSucceeded }">{{ operationMessage }}</view>
			<view v-if="showEnrollmentForm" style="margin-top: 30rpx;">
				<u-button color="#35a5ed" size="large" shape="circle" :loading="uploading" @click="upload"
					:disabled="(!!cameraSessionId && cameraStatus !== 'READY') || profileLoading"
					:text="cameraSessionId ? '确认照片是本人，完成录入' : (hasUploadedFace ? '确认更换人脸' : '提交人脸，开通门禁')" />
			</view>

			<!--
				离屏 canvas: 只用于把照片缩到门禁设备能吃的大小(宽高 < 1024 的 JPEG)。
				放在屏幕外即可, 不需要用户看见。
			-->
			<canvas canvas-id="faceCanvas" id="faceCanvas"
				style="position: fixed; left: -9999px; top: -9999px; width: 800px; height: 800px;"></canvas>
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
					<view class="facepriv-item">· 用途：你的人脸照片仅用于本店门禁身份核验和刷脸开门；</view>
					<view class="facepriv-item">· 采集方式：本人拍照/选择相册照片，或本人站在门禁前使用设备摄像头；门禁拍摄后需核对本人照片再确认；</view>
					<view class="facepriv-item">· 临时处理：照片经服务器处理并下发门禁。门禁拍摄的预览在2分钟后或离开本页时清理；已下发照片的后台内存缓存约30分钟，不提供公开图片地址；</view>
					<view class="facepriv-item">· 通行授权：通行时间由门店设置，可联系门店更新权限或删除设备端人脸。</view>
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
	import { accessFaceUpload, accessProfile, accessOpenDoor, accessCameraCapabilities, accessCameraStart, accessCameraStatus, accessCameraConfirm, accessCameraCancel } from '@/config/api.js'
	import { ensurePrivacyAuth } from '@/utils/privacy-auth.js'
	import { FACE_CONSENT_KEY, cameraPreviewPath, isCameraPreviewFile } from '@/utils/door-camera.js'
	export default {
		data() {
			return {
				faceUrl: '',
				faceBase64: '',
				profile: null,
				profileLoading: true,
				profileGeneration: 0,
				editingFace: false,
				operationMessage: '',
				operationSucceeded: false,
				uploading: false,
				cameraEnabled: false,
				cameraBusy: false,
				cameraStarting: false,
				cameraStatus: '',
				cameraMessage: '',
				cameraSessionId: '',
				cameraPreviewFile: '',
				cameraTimer: null,
				cameraGeneration: 0,
				cameraActive: true,
				cameraStartedAt: 0,
				cameraExpiresAt: 0,
				// 一键开门(仅当天有有效预约时可点; 后端会再校验)
				doorLoading: false,
				// 新采集方式和临时缓存说明需重新确认。
				faceConsented: uni.getStorageSync(FACE_CONSENT_KEY) === '1',
				privacyShow: false,
				privacyResolve: null
			}
		},
		computed: {
			hasUploadedFace() { return !!(this.profile && Number(this.profile.syncStatus) === 1) },
			showEnrollmentForm() { return !this.profileLoading && (!this.hasUploadedFace || this.editingFace) },
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
			beginFaceEdit() { this.editingFace = true; this.operationMessage = '' },
			cancelFaceEdit() { this.cancelDoorCapture(); this.faceUrl = ''; this.faceBase64 = ''; this.editingFace = false; this.operationMessage = '' },
			applyEnrollmentResult(profile) {
				this.profileGeneration++
				this.profileLoading = false
				// A failed replacement does not invalidate an earlier successful upload.
				if (profile && Number(profile.syncStatus) === 1) {
					this.profile = profile; this.editingFace = false; this.faceUrl = ''; this.faceBase64 = ''
					this.operationSucceeded = true; this.operationMessage = '人脸已成功录入门禁'
				} else {
					if (!this.hasUploadedFace) this.profile = profile || this.profile
					this.operationSucceeded = false
					this.operationMessage = (profile && profile.syncErrmsg) || '本次录入尚未得到设备确认，请稍后重试或联系门店'
				}
				uni.$u.toast(this.operationMessage)
			},
			async startDoorCapture() {
				if (this.cameraStarting || this.cameraBusy || this.uploading) return
				this.operationMessage = ''
				this.cameraStarting = true
				try {
				if (!await this.ensureFaceConsent()) return
				await this.cancelDoorCapture()
				if (!this.cameraActive) return
				this.faceUrl = ''; this.faceBase64 = ''
				const generation = this.cameraGeneration
				this.cameraBusy = true; this.cameraStatus = 'WAITING'
				this.cameraMessage = '请本人站到门禁摄像头前，保持正脸，正在请求拍照…'
				this.cameraStartedAt = Date.now()
				try {
					const res = await accessCameraStart({}, { custom: { auth: true, catch: true } })
					const session = res.data || {}
					if (generation !== this.cameraGeneration || !this.cameraActive) {
						if (session.sessionId) accessCameraCancel(session.sessionId, { custom: { auth: true, catch: true } }).catch(() => {})
						return
					}
					if (!/^[a-f0-9]{32}$/.test(session.sessionId || '')) throw new Error('门禁未返回有效录脸会话')
					this.cameraSessionId = session.sessionId
					this.cameraExpiresAt = Number(session.expiresAt) || this.cameraStartedAt + 120000
					this.pollDoorCapture(generation)
				} catch (e) {
					if (generation !== this.cameraGeneration) return
					this.cameraBusy = false; this.cameraStatus = 'FAILED'
					this.cameraMessage = (e && (e.msg || e.message)) || '门禁拍照请求失败，请稍后重试'
				}
				} finally { this.cameraStarting = false }
			},
			async pollDoorCapture(generation) {
				const sessionId = this.cameraSessionId
				if (!sessionId || !this.cameraActive || generation !== this.cameraGeneration) return
				try {
					const res = await accessCameraStatus(sessionId, { custom: { auth: true, catch: true } })
					if (generation !== this.cameraGeneration || sessionId !== this.cameraSessionId || !this.cameraActive) return
					const data = res.data || {}
					this.cameraStatus = data.status || 'WAITING'
					if (data.status === 'READY') {
						this.cameraStatus = 'PROCESSING'
						if (!data.imageBase64 || data.imageBase64.length > 300000) throw new Error('照片无效，请重新拍摄')
						const path = await this.writeCameraPreview(data.imageBase64, sessionId)
						if (generation !== this.cameraGeneration || !this.cameraActive) { this.removeCameraFile(path); return }
						this.cameraPreviewFile = path; this.faceUrl = path
						const remaining = (Number(data.expiresAt) || this.cameraExpiresAt || this.cameraStartedAt + 120000) - Date.now()
						if (remaining <= 0) throw new Error('预览已超时，请重新拍摄')
						this.cameraStatus = 'READY'
						this.cameraBusy = false
						this.cameraMessage = '请核对下方照片是你本人，再点击“确认照片是本人，完成录入”'
						this.cameraTimer = setTimeout(() => {
							if (generation !== this.cameraGeneration) return
							this.cancelDoorCapture(); this.cameraMessage = '照片预览已超时，请重新拍摄'
						}, remaining)
						return
					}
					if (!['WAITING', 'PROCESSING'].includes(data.status)) throw new Error(data.message || '本次拍照已结束，请重试')
					if (Date.now() - this.cameraStartedAt > 125000) throw new Error('门禁拍照超时，请重新发起')
					this.cameraMessage = data.status === 'PROCESSING' ? '照片已回传，正在处理…' : '正在等待门禁拍照，请正对摄像头'
					this.cameraTimer = setTimeout(() => this.pollDoorCapture(generation), 900)
				} catch (e) {
					if (generation !== this.cameraGeneration) return
					this.cancelDoorCapture()
					this.cameraMessage = (e && (e.msg || e.message)) || '照片未回传，请重新尝试'
				}
			},
			writeCameraPreview(base64, sessionId) {
				return new Promise((resolve, reject) => {
					if (typeof wx === 'undefined' || !wx.env || !uni.getFileSystemManager) { resolve('data:image/jpeg;base64,' + base64); return }
					const file = cameraPreviewPath(wx.env.USER_DATA_PATH, sessionId)
					uni.getFileSystemManager().writeFile({ filePath: file, data: base64, encoding: 'base64', success: () => resolve(file), fail: () => reject(new Error('预览照片保存失败，请重试')) })
				})
			},
			removeCameraFile(path) {
				if (typeof wx !== 'undefined' && wx.env && uni.getFileSystemManager && isCameraPreviewFile(wx.env.USER_DATA_PATH, path)) {
					uni.getFileSystemManager().unlink({ filePath: path, fail: () => {} })
				}
			},
			cancelDoorCapture() {
				clearTimeout(this.cameraTimer); this.cameraTimer = null; this.cameraGeneration++
				const sessionId = this.cameraSessionId
				this.cameraSessionId = ''; this.cameraBusy = false; this.cameraStatus = ''; this.cameraMessage = ''; this.cameraExpiresAt = 0
				if (this.cameraPreviewFile) {
					if (this.faceUrl === this.cameraPreviewFile) this.faceUrl = ''
					this.removeCameraFile(this.cameraPreviewFile); this.cameraPreviewFile = ''
				}
				if (sessionId) return accessCameraCancel(sessionId, { custom: { auth: true, catch: true } }).catch(() => {})
				return Promise.resolve()
			},
			async confirmDoorCapture() {
				if (this.uploading || this.cameraStatus !== 'READY') return
				this.uploading = true
				try {
					const res = await accessCameraConfirm(this.cameraSessionId, { custom: { auth: true, catch: true } })
					this.cancelDoorCapture()
					this.applyEnrollmentResult(res.data || null)
				} catch (e) {
					this.cancelDoorCapture()
					this.operationSucceeded = false; this.operationMessage = (e && (e.msg || e.message)) || '本次录入失败，请重新拍摄'
					uni.$u.toast(this.operationMessage)
				} finally { this.uploading = false }
			},
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
				uni.setStorageSync(FACE_CONSENT_KEY, '1')
				var r = this.privacyResolve
				this.privacyResolve = null
				if (r) r(true)
			},
			refusePrivacy() {
				this.privacyShow = false
				var r = this.privacyResolve
				this.privacyResolve = null
				if (r) r(false)
				uni.$u.toast('不同意将无法使用人脸录入，可联系门店使用其他进门方式')
			},
			async chooseImage() {
				if (this.uploading) return
				this.operationMessage = ''
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
				this.cancelDoorCapture()
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['camera', 'album'],
					success: (res) => {
						var path = res.tempFilePaths[0]
						that.faceUrl = path; that.faceBase64 = ''
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
				if (this.cameraSessionId) return this.confirmDoorCapture()
				if (this.uploading) return
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
					this.applyEnrollmentResult(profile)
				} catch (e) {
					this.operationSucceeded = false; this.operationMessage = (e && (e.msg || e.message)) || '本次上传失败，请稍后再试'
					uni.$u.toast(this.operationMessage)
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
				const generation = ++this.profileGeneration
				this.profileLoading = true
				try {
					const { data: profile } = await accessProfile({}, { custom: { auth: true, catch: true } })
					if (generation === this.profileGeneration && this.cameraActive) this.profile = profile || null
				} catch (e) {
					// Keep a known successful upload when the status request temporarily fails.
				} finally {
					if (generation === this.profileGeneration) this.profileLoading = false
				}
			}
		},
		onLoad() {
			// 进入本页确认采集方式及短期处理说明。
			// 同意后再走微信《隐私保护指引》授权(相机/相册, 官方弹窗, 未同意不阻塞浏览)
			this.ensureFaceConsent().then((ok) => {
				if (ok) {
					ensurePrivacyAuth()
				}
			})
		},
		onShow() {
			this.cameraActive = true
			this.operationMessage = ''; this.editingFace = false
			this.loadProfile()
			accessCameraCapabilities({ custom: { auth: true, catch: true } }).then(res => { this.cameraEnabled = !!(res.data && res.data.enabled) }).catch(() => { this.cameraEnabled = false })
		},
		onHide() { this.cameraActive = false; this.profileGeneration++; this.cancelDoorCapture(); this.faceUrl = ''; this.faceBase64 = '' },
		onUnload() { this.cameraActive = false; this.profileGeneration++; this.cancelDoorCapture(); this.faceUrl = ''; this.faceBase64 = '' }
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
	.door-camera-card { margin-bottom: 24rpx; padding: 24rpx; background: #f0f7ff; border-radius: 16rpx; }
	.door-camera-tip { margin-top: 16rpx; color: #666; font-size: 24rpx; line-height: 1.7; }
	.door-camera-message { margin-top: 16rpx; color: #2876b5; font-size: 26rpx; line-height: 1.7; }
	.door-camera-cancel { margin-top: 18rpx; color: #888; font-size: 24rpx; text-align: center; }

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

	.enrollment-card { margin-bottom: 28rpx; padding: 28rpx; background: #f6faff; border-radius: 20rpx; }
	.enrollment-heading { display: flex; align-items: center; }
	.enrollment-title { margin-left: 14rpx; color: #25354a; font-size: 32rpx; font-weight: 600; }
	.enrollment-description { margin-top: 18rpx; color: #718096; font-size: 25rpx; line-height: 1.8; }
	.edit-face { display: inline-block; margin-top: 24rpx; padding: 14rpx 28rpx; border: 1rpx solid #35a5ed; border-radius: 40rpx; color: #278dc9; font-size: 26rpx; }
	.operation-message { margin-top: 24rpx; padding: 22rpx 24rpx; border-radius: 14rpx; background: #fff8ec; color: #966623; font-size: 25rpx; line-height: 1.7; }
	.operation-success { background: #effaf4; color: #288454; }

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
