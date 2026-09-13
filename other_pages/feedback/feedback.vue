<template>
	<view>
		<my-navbar leftText="意见反馈" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<view class="container">
			<!-- 客服微信二维码 -->
			<view class="qr-card">
				<u-text :bold="true" size="30" color="#333" text="联系客服微信" />
				<u-text size="24" color="#888" text="长按下方二维码识别，或保存图片后用微信扫一扫，可咨询/退款/反馈问题" style="margin-top: 8rpx;" />
				<view class="qr-box">
					<image src="https://api.dayousuoan.top/upload/appstatic/other_pages/static/WechatScanMe.jpg" mode="aspectFit" class="qr-img" show-menu-by-longpress="true" />
				</view>
				<view style="margin-top: 20rpx;">
					<u-button color="#35a5ed" plain size="small" shape="circle" @click="saveQr" text="保存二维码到相册" />
				</view>
			</view>

			<!-- 反馈表单 -->
			<view class="form-card">
				<u-text :bold="true" size="30" color="#333" text="在线提交反馈" />
				<view style="height: 20rpx;"></view>
				<textarea v-model="content" class="feedback-input" placeholder="请输入你的问题或建议（退款、预约问题、功能建议等）"
					:maxlength="500" />
				<view style="height: 20rpx;"></view>
				<u-input v-model="contact" placeholder="联系电话/微信号（选填）" :border="true" />
				<view style="margin-top: 30rpx;">
					<u-button color="#35a5ed" size="large" shape="circle" :loading="submitting" @click="submit"
						text="提交反馈" />
				</view>
			</view>

			<!-- 我的反馈记录 -->
			<view v-if="feedbackList.length > 0" class="history-card">
				<u-text :bold="true" size="30" color="#333" text="我的反馈记录" />
				<view v-for="item in feedbackList" :key="item.id" class="feedback-item">
					<view style="display:flex;justify-content:space-between;align-items:center;">
						<u-tag :type="item.status === 1 ? 'success' : 'warning'" size="mini"
							:text="item.status === 1 ? '已处理' : '待处理'" />
						<u-text size="22" color="#999" :text="formatTime(item.createTime)" />
					</view>
					<u-text size="26" color="#333" :text="item.content" style="margin-top: 10rpx;" />
					<view v-if="item.reply" style="margin-top: 10rpx;background:#f0f7ff;border-radius:10rpx;padding:12rpx 16rpx;">
						<u-text size="24" color="#35a5ed" :text="'客服回复：' + item.reply" />
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { submitFeedback, myFeedback } from '@/config/api.js'
	export default {
		data() {
			return {
				content: '',
				contact: '',
				submitting: false,
				feedbackList: []
			}
		},
		methods: {
			formatTime(t) {
				if (!t) return ''
				return String(t).replace('T', ' ').substring(0, 16)
			},
			saveQr() {
				uni.getImageInfo({
					src: 'https://api.dayousuoan.top/upload/appstatic/other_pages/static/WechatScanMe.jpg',
					success: (info) => {
						uni.saveImageToPhotosAlbum({
							filePath: info.path,
							success: () => {
								uni.$u.toast('已保存，打开微信扫一扫即可添加客服')
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
			async submit() {
				if (!this.content || !this.content.trim()) {
					uni.$u.toast('请填写反馈内容')
					return
				}
				this.submitting = true
				try {
					await submitFeedback({ content: this.content.trim(), contact: this.contact.trim() }, {
						custom: { auth: true, catch: true }
					})
					uni.$u.toast('提交成功，我们会尽快处理')
					this.content = ''
					this.contact = ''
					this.loadList()
				} catch (e) {
					uni.$u.toast((e && e.msg) || '提交失败，请稍后再试')
				} finally {
					this.submitting = false
				}
			},
			async loadList() {
				try {
					const { data: list } = await myFeedback({}, { custom: { auth: true, catch: true } })
					this.feedbackList = list || []
				} catch (e) {
					this.feedbackList = []
				}
			}
		},
		onShow() {
			this.loadList()
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		padding: 30rpx;
	}

	.qr-card {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 24rpx;
		margin-bottom: 30rpx;
		border: 2rpx solid #e5e5e5;
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
		width: 380rpx;
		height: 380rpx;
	}

	.form-card {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 24rpx;
		margin-bottom: 30rpx;
		border: 2rpx solid #e5e5e5;
	}

	.feedback-input {
		width: 100%;
		height: 200rpx;
		background: #f7f7f7;
		border-radius: 12rpx;
		padding: 20rpx;
		box-sizing: border-box;
		font-size: 26rpx;
	}

	.history-card {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 24rpx;
		border: 2rpx solid #e5e5e5;
	}

	.feedback-item {
		margin-top: 20rpx;
		border-top: 2rpx solid #f0f0f0;
		padding-top: 20rpx;
	}
</style>
