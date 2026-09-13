<template>
	<view>
		<my-navbar leftText="补签申请" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<view class="container">
			<!-- 补签说明 -->
			<view class="tip-card">
				<u-text :bold="true" size="28" color="#333" text="补签规则" />
				<view style="margin-top: 10rpx;">
					<u-text size="24" color="#666" text="· 断签后可申请补签，恢复连续签到" />
				</view>
				<view style="margin-top: 6rpx;">
					<u-text size="24" color="#666" text="· 需要到店好评（截图给客服微信），客服审核通过后补签生效" />
				</view>
				<view style="margin-top: 6rpx;">
					<u-text size="24" color="#666" text="· 补签通过后补发100积分并恢复连续天数" />
				</view>
			</view>

			<!-- 补签表单 -->
			<view class="form-card">
				<u-text :bold="true" size="30" color="#333" text="填写补签申请" />
				<view style="height: 20rpx;"></view>
				<view class="field">
					<u-text size="26" color="#666" text="漏签日期" />
					<picker mode="date" :value="missedDate" @change="onDateChange">
						<view class="picker-box">
							<u-text size="26" :color="missedDate ? '#333' : '#999'"
								:text="missedDate || '请选择漏签日期'" />
						</view>
					</picker>
				</view>
				<view style="height: 20rpx;"></view>
				<textarea v-model="reason" class="reason-input" placeholder="请输入好评内容（例如：环境很棒，服务贴心…）"
					:maxlength="500" />
				<view style="height: 20rpx;"></view>
				<u-input v-model="contact" placeholder="联系电话/微信号（选填）" :border="true" />
				<view style="margin-top: 30rpx;">
					<u-button color="#35a5ed" size="large" shape="circle" :loading="submitting" @click="submit"
						text="提交申请（等待客服审核）" />
				</view>
			</view>

			<!-- 我的申请记录 -->
			<view v-if="list.length > 0" class="history-card">
				<u-text :bold="true" size="30" color="#333" text="我的申请记录" />
				<view v-for="item in list" :key="item.id" class="rec-item">
					<view style="display:flex;justify-content:space-between;align-items:center;">
						<u-tag :type="item.status === 1 ? 'success' : item.status === 2 ? 'error' : 'warning'"
							size="mini" :text="item.status === 1 ? '已通过' : item.status === 2 ? '已拒绝' : '待审核'" />
						<u-text size="22" color="#999" :text="item.missedDate" />
					</view>
					<u-text size="26" color="#333" :text="item.reason" style="margin-top: 10rpx;" />
					<view v-if="item.remark" style="margin-top: 10rpx;background:#f0f7ff;border-radius:10rpx;padding:12rpx 16rpx;">
						<u-text size="24" color="#35a5ed" :text="'审核：' + item.remark" />
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				missedDate: '',
				reason: '',
				contact: '',
				submitting: false,
				list: []
			}
		},
		methods: {
			onDateChange(e) {
				this.missedDate = e.detail.value
			},
			async submit() {
				if (!this.missedDate) {
					uni.$u.toast('请选择漏签日期')
					return
				}
				if (!this.reason || !this.reason.trim()) {
					uni.$u.toast('请填写好评内容')
					return
				}
				this.submitting = true
				try {
					await uni.$u.http.post('/api/wx/points/recover/submit', {
						missedDate: this.missedDate,
						reason: this.reason.trim(),
						contact: this.contact.trim()
					}, { custom: { auth: true, catch: true } })
					uni.$u.toast('已提交，等待客服审核')
					this.reason = ''
					this.missedDate = ''
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
					// GET 只有 2 参: (url, config); 三参会丢 custom.auth → 不带token 401
					const { data: list } = await uni.$u.http.get('/api/wx/points/recover/list', {
						custom: { auth: true, catch: true }
					})
					this.list = (list && list.length) ? list : []
				} catch (e) {
					this.list = []
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

	.tip-card {
		background: #fff7e6;
		border-radius: 16rpx;
		padding: 20rpx 24rpx;
	}

	.form-card {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 24rpx;
		margin-top: 30rpx;
		border: 2rpx solid #e5e5e5;
	}

	.field {
		background: #f7f7f7;
		border-radius: 12rpx;
		padding: 20rpx;
	}

	.picker-box {
		margin-top: 8rpx;
	}

	.reason-input {
		width: 100%;
		height: 160rpx;
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
		margin-top: 30rpx;
		border: 2rpx solid #e5e5e5;
	}

	.rec-item {
		margin-top: 20rpx;
		border-top: 2rpx solid #f0f0f0;
		padding-top: 20rpx;
	}
</style>
