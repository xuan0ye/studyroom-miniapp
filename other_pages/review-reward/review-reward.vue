<template>
	<view class="reward-page">
		<my-navbar leftText="好评领三日卡" leftIcon="arrow-left" :custom="false" :autoBack="true" />
		<view class="reward-content">
			<view class="reward-card">
				<text class="reward-title">五星好评领三日卡</text>
				<text class="reward-subtitle">两区通用，可预约任意空闲座位</text>
				<text class="reward-rule">美团、抖音、大众点评，每个平台各限领一次。上传本店的五星好评截图，审核通过后自动放入卡包。</text>
				<text class="reward-rule">首次预约日期起连续使用3天，预约时锁定连续3天的座位。</text>
			</view>

			<view class="form-card">
				<text class="section-title">选择评价平台</text>
				<view class="platforms">
					<view v-for="item in platforms" :key="item.value" class="platform"
						:class="{ selected: platform === item.value }" @click="selectPlatform(item.value)">
						<text>{{ item.label }}</text>
						<text class="platform-status">{{ platformStatus(item.value) }}</text>
					</view>
				</view>
				<view v-if="listLoading" class="status-box">正在查询领取记录…</view>
				<view v-else-if="loadError" class="status-box">
					<text>领取记录加载失败</text>
					<u-button plain size="small" text="重新加载" @click="loadList" />
				</view>
				<view v-else-if="current && current.status === 'APPROVED'" class="status-box success">
					<text class="section-title">三日卡已发放</text>
					<text>这个平台的好评奖励已领取，可前往卡包查看。</text>
					<u-button color="#35a5ed" text="查看卡包" @click="openCards" />
				</view>
				<view v-else-if="current && current.status === 'PENDING'" class="status-box">
					<text class="section-title">已提交，等待审核</text>
					<text>审核通过后会自动发放三日卡，审核结果在这里查看。</text>
				</view>
				<view v-else>
					<view v-if="current && current.status === 'REJECTED'" class="rejection">
						<text class="section-title">请补充后重新提交</text>
						<text>{{ current.reviewReason }}</text>
					</view>
					<text class="section-title upload-title">上传好评截图</text>
					<text class="hint">请保留店铺名称、五星评分和评价内容。支持JPG、PNG，最多3张，每张不超过2MB。</text>
					<view class="image-grid">
						<view v-for="(file, index) in files" :key="file.path" class="image-item">
							<image :src="file.path" mode="aspectFill" @click="previewFiles(index)" />
							<view class="remove-image" @click.stop="removeFile(index)">×</view>
						</view>
						<view v-if="files.length < 3" class="add-image" @click="chooseImages">
							<text class="add-symbol">+</text>
							<text>添加截图</text>
						</view>
					</view>
					<textarea v-model="note" class="note" :disabled="submitting" :maxlength="500"
						placeholder="补充说明（选填）" />
					<u-button color="#35a5ed" :loading="submitting" :disabled="submitting || !files.length"
						text="提交审核" @click="submit" />
				</view>
			</view>

			<view v-if="current" class="history-card">
				<view class="history-heading">
					<text class="section-title">本平台申请记录</text>
					<text class="hint">{{ formatTime(current.submittedAt) }}</text>
				</view>
				<view class="image-grid">
					<image v-for="(url, index) in current.screenshots" :key="url" class="history-image"
						:src="imageUrl(url)" mode="aspectFill" @click="previewSubmitted(index)" />
				</view>
				<text v-if="current.note" class="record-text">{{ current.note }}</text>
				<text v-if="current.reviewedAt" class="hint">审核时间 {{ formatTime(current.reviewedAt) }}</text>
				<text v-if="current.reviewReason" class="record-text">审核备注 {{ current.reviewReason }}</text>
			</view>
		</view>
	</view>
</template>

<script>
	import { myReviewRewards, submitReviewReward } from '@/config/api.js'
	import appConfig from '@/config/config.js'

	export default {
		data() {
			return {
				platforms: [
					{ value: 'MEITUAN', label: '美团' },
					{ value: 'DOUYIN', label: '抖音' },
					{ value: 'DIANPING', label: '大众点评' }
				],
				platform: 'MEITUAN',
				records: [],
				files: [],
				note: '',
				listLoading: false,
				loadError: false,
				submitting: false
			}
		},
		computed: {
			current() {
				return this.records.find(item => item.platform === this.platform)
			}
		},
		onShow() {
			this.loadList()
		},
		methods: {
			platformStatus(platform) {
				if (this.listLoading || this.loadError) return ''
				const record = this.records.find(item => item.platform === platform)
				if (!record) return '可申请'
				return { PENDING: '待审核', APPROVED: '已领取', REJECTED: '待补充' }[record.status] || ''
			},
			selectPlatform(platform) {
				if (this.submitting || platform === this.platform) return
				this.platform = platform
				this.files = []
				this.note = ''
			},
			async loadList() {
				if (this.listLoading) return
				this.listLoading = true
				this.loadError = false
				try {
					const { data } = await myReviewRewards({}, { custom: { auth: true, catch: true } })
					this.records = data || []
				} catch (error) {
					this.loadError = true
				} finally {
					this.listLoading = false
				}
			},
			chooseImages() {
				if (this.submitting) return
				uni.chooseImage({
					count: 3 - this.files.length,
					sizeType: ['compressed'],
					sourceType: ['album', 'camera'],
					success: result => {
						const selected = result.tempFilePaths.map((path, index) => ({
							path,
							size: result.tempFiles && result.tempFiles[index] && result.tempFiles[index].size
						}))
						if (selected.some(file => file.size > 2 * 1024 * 1024)) {
							uni.$u.toast('每张截图不能超过2MB，请裁剪后重试')
							return
						}
						this.files = this.files.concat(selected).slice(0, 3)
					},
					fail: error => {
						if (!error.errMsg || error.errMsg.indexOf('cancel') < 0) uni.$u.toast('选择图片失败，请重试')
					}
				})
			},
			removeFile(index) {
				if (!this.submitting) this.files.splice(index, 1)
			},
			previewFiles(index) {
				uni.previewImage({ current: index, urls: this.files.map(file => file.path) })
			},
			previewSubmitted(index) {
				uni.previewImage({ current: index, urls: this.current.screenshots.map(this.imageUrl) })
			},
			imageUrl(url) {
				return url.indexOf('/') === 0 ? appConfig.currentHost() + url : url
			},
			readImage(file) {
				return new Promise((resolve, reject) => {
					uni.getFileSystemManager().readFile({
						filePath: file.path,
						encoding: 'base64',
						success: result => {
							if (result.data.length > 2796300) reject({ msg: '每张截图不能超过2MB，请裁剪后重试' })
							else resolve(result.data)
						},
						fail: () => reject({ msg: '读取截图失败，请重新选择图片' })
					})
				})
			},
			async submit() {
				if (this.submitting || this.listLoading || this.loadError || !this.files.length) return
				if (this.current && this.current.status !== 'REJECTED') return
				this.submitting = true
				try {
					const screenshots = await Promise.all(this.files.map(this.readImage))
					const { data } = await submitReviewReward({
						platform: this.platform, screenshots, note: this.note.trim()
					}, { timeout: 60000, custom: { auth: true, catch: true } })
					this.records = this.records.filter(item => item.platform !== data.platform).concat([data])
					this.files = []
					this.note = ''
					uni.$u.toast('已提交，请等待审核')
				} catch (error) {
					uni.$u.toast((error && (error.msg || error.message)) || '提交失败，请稍后重试')
					this.loadList()
				} finally {
					this.submitting = false
				}
			},
			openCards() {
				uni.navigateTo({ url: '/other_pages_mine/card_package/card_package' })
			},
			formatTime(value) {
				return String(value || '').replace('T', ' ').slice(0, 16)
			}
		}
	}
</script>

<style lang="scss" scoped>
	.reward-page { min-height: 100vh; background: #f5f7fa; }
	.reward-content { padding: 28rpx; }
	.reward-card, .form-card, .history-card { padding: 30rpx; border-radius: 20rpx; margin-bottom: 24rpx; background: #fff; }
	.reward-card { background: #fff6e9; }
	.reward-title { display: block; font-size: 38rpx; font-weight: 700; color: #683f20; }
	.reward-subtitle { display: block; margin: 16rpx 0 20rpx; color: #996329; font-size: 28rpx; }
	.reward-rule { display: block; margin-top: 10rpx; font-size: 25rpx; line-height: 1.7; color: #765a40; }
	.section-title { display: block; color: #333; font-weight: 600; font-size: 29rpx; }
	.platforms { display: flex; gap: 16rpx; margin: 24rpx 0; }
	.platform { flex: 1; text-align: center; border: 2rpx solid #e5e9ee; border-radius: 12rpx; padding: 20rpx 4rpx; font-size: 28rpx; color: #4d5662; }
	.platform.selected { color: #1686cc; border-color: #35a5ed; background: #eff9ff; }
	.platform-status { display: block; font-size: 22rpx; margin-top: 8rpx; min-height: 30rpx; }
	.status-box { display: flex; flex-direction: column; gap: 22rpx; padding: 24rpx 0; font-size: 27rpx; line-height: 1.7; color: #626b75; }
	.success .section-title { color: #26875b; }
	.rejection { display: flex; flex-direction: column; gap: 12rpx; padding: 24rpx; margin-bottom: 28rpx; border-radius: 12rpx; background: #fff2ed; font-size: 26rpx; line-height: 1.6; color: #a24b35; }
	.upload-title { margin-bottom: 12rpx; }
	.hint { display: block; color: #858c96; font-size: 23rpx; line-height: 1.6; }
	.image-grid { display: flex; flex-wrap: wrap; gap: 16rpx; margin: 24rpx 0; }
	.image-item, .add-image, .history-image { width: 180rpx; height: 180rpx; border-radius: 12rpx; }
	.image-item { position: relative; }
	.image-item image { width: 100%; height: 100%; border-radius: 12rpx; }
	.remove-image { position: absolute; right: -8rpx; top: -8rpx; width: 44rpx; height: 44rpx; border-radius: 50%; text-align: center; line-height: 40rpx; font-size: 36rpx; background: #56616c; color: #fff; }
	.add-image { display: flex; flex-direction: column; justify-content: center; align-items: center; background: #f4f7fa; border: 2rpx dashed #cad2db; box-sizing: border-box; font-size: 24rpx; color: #75808b; }
	.add-symbol { font-size: 50rpx; line-height: 1.2; margin-bottom: 8rpx; }
	.note { box-sizing: border-box; width: 100%; height: 150rpx; padding: 20rpx; background: #f6f8fa; border-radius: 12rpx; font-size: 26rpx; margin: 24rpx 0; }
	.history-heading { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12rpx; }
	.record-text { display: block; font-size: 25rpx; line-height: 1.7; color: #59636e; margin: 12rpx 0; white-space: pre-wrap; overflow-wrap: anywhere; }
</style>
