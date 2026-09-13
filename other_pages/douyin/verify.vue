<template>
	<view>
		<my-navbar leftText="团购核销" leftIcon="arrow-left" :custom="false" bgColor="#ffffff" :autoBack="true"
			leftIconSize="40" />
		<view class="container">
			<!-- 步骤条: 1输码 → 2确认 → 3结果 -->
			<view class="steps-wrap">
				<u-steps :current="stepIndex" activeColor="#35a5ed">
					<u-steps-item title="输入券码" />
					<u-steps-item title="确认核销" />
					<u-steps-item title="核销完成" />
				</u-steps>
			</view>

			<!-- ============ 步骤1: 输码 ============ -->
			<view v-if="step === 1">
				<view class="tip-card">
					<u-text size="26" color="#666"
						text="到店后在下方输入抖音团购券码，或粘贴抖音订单里的分享链接，核销后自动发放使用卡" />
				</view>

				<view class="form-card">
					<u-text :bold="true" size="28" color="#333" text="抖音团购券码" />
					<view style="margin-top: 16rpx;">
						<u-textarea v-model="code" height="150" :count="false" :maxlength="-1" border="surround"
							placeholder="请输入券码(如 1234 5678 9012)" @input="onCodeInput" />
					</view>

					<view style="margin-top: 30rpx;">
						<u-text :bold="true" size="28" color="#333" text="或粘贴抖音团购链接" />
					</view>
					<view style="margin-top: 16rpx;">
						<u-input v-model="shortLink" border="surround" clearable
							placeholder="https://v.douyin.com/xxxxxx/" />
					</view>
					<view style="margin-top: 12rpx;">
						<u-text size="22" color="#999" text="券码与链接二选一即可，同时填写时优先使用券码" />
					</view>
				</view>

				<view style="margin-top: 40rpx;">
					<u-button color="#35a5ed" size="large" shape="circle" :loading="preparing" text="验证券码"
						@click="doPrepare" />
				</view>
			</view>

			<!-- ============ 步骤2: 确认券信息 ============ -->
			<view v-if="step === 2">
				<view class="cert-card">
					<view class="cert-title-row">
						<u-text :bold="true" size="32" color="#333" :text="session.productTitle || '抖音团购券'" />
						<u-tag v-if="session.status != null && session.status !== ''" :text="'状态 ' + session.status"
							type="primary" size="mini" />
					</view>

					<view class="cert-row">
						<u-text size="26" color="#999" text="券ID：" />
						<u-text size="26" color="#333" :text="certificateIdShort" />
					</view>

					<view class="cert-row" v-if="validRange">
						<u-text size="26" color="#999" text="有效期：" />
						<u-text size="26" color="#333" :text="validRange" />
					</view>

					<view class="cert-warn">
						<u-text size="24" color="#e69306" text="请核对套餐信息，确认后即完成核销，不可撤销。" />
					</view>
				</view>

				<view style="margin-top: 40rpx;">
					<u-button color="#35a5ed" size="large" shape="circle" :loading="verifying" text="确认核销"
						@click="doVerify" />
				</view>
				<view style="margin-top: 24rpx;">
					<u-button plain color="#909399" size="large" shape="circle" text="重新输入" @click="backToInput" />
				</view>
			</view>

			<!-- ============ 步骤3: 核销结果 ============ -->
			<view v-if="step === 3">
				<view class="result-card">
					<!-- 成功 -->
					<view v-if="result && result.success" style="text-align:center;">
						<u-icon name="checkmark-circle-fill" color="#0ec61b" size="150" />
						<view style="margin-top: 24rpx;">
							<u-text :bold="true" size="36" color="#333" :text="result.msg || '核销成功'" />
						</view>
						<view class="result-info">
							<!-- 充值余额类(代金券) -->
							<view class="cert-row" v-if="result.balanceAmount">
								<u-text size="26" color="#999" text="已充值余额：" />
								<u-text size="26" color="#333" :text="'¥' + result.balanceAmount" />
							</view>
							<!-- 发卡类(周期卡) -->
							<view class="cert-row" v-if="result.cardTitle">
								<u-text size="26" color="#999" text="发放卡券：" />
								<u-text size="26" color="#333" :text="result.cardTitle" />
							</view>
							<view class="cert-row" v-if="result.expiryTime">
								<u-text size="26" color="#999" text="有效期至：" />
								<u-text size="26" color="#333" :text="formatDate(result.expiryTime)" />
							</view>
						</view>
					</view>

					<!-- 失败 -->
					<view v-else style="text-align:center;">
						<u-icon name="close-circle-fill" color="#e64340" size="150" />
						<view style="margin-top: 24rpx;">
							<u-text :bold="true" size="34" color="#333" text="核销失败" />
						</view>
						<view style="margin-top: 16rpx;">
							<u-text size="26" color="#e64340" :text="(result && result.msg) || '核销失败，请稍后重试'" />
						</view>
					</view>
				</view>

				<view v-if="result && result.success" style="margin-top: 40rpx;">
					<u-button color="#35a5ed" size="large" shape="circle"
						:text="result.grantType === 'balance' ? '去预约选座（可用余额抵扣）' : '去预约选座'"
						@click="goSeat" />
				</view>
				<view v-if="result && result.success" style="margin-top: 24rpx;">
					<u-button plain color="#35a5ed" size="large" shape="circle" text="查看核销记录"
						@click="goRecords" />
				</view>

				<view v-if="!result || !result.success" style="margin-top: 40rpx;">
					<u-button v-if="session && session.sessionId" color="#35a5ed" size="large" shape="circle"
						:loading="verifying" text="重试" @click="submitVerify" />
					<u-button v-else color="#35a5ed" size="large" shape="circle" text="重试" @click="backToInput" />
				</view>
				<view v-if="!result || !result.success" style="margin-top: 24rpx;">
					<u-button v-if="session && session.sessionId" plain color="#909399" size="large" shape="circle"
						text="重新输入券码" @click="backToInput" />
				</view>
			</view>

			<!-- 底部说明 + 记录入口 -->
			<view class="footer-wrap">
				<u-text size="22" color="#999"
					text="团购券核销后自动发放使用卡，过期不补；退款请通过抖音申请，由门店审核" />
				<view class="footer-link" @click="goRecords">
					<u-text size="26" color="#35a5ed" text="我的核销记录" />
					<u-icon name="arrow-right" color="#35a5ed" size="26" style="margin-left: 6rpx;" />
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import { douyinPrepare, douyinVerify } from '@/config/api.js'
	export default {
		data() {
			return {
				// 1-输码 2-确认 3-结果
				step: 1,
				code: '',
				shortLink: '',
				preparing: false,
				verifying: false,
				// prepare 返回的券信息(含 sessionId)
				session: null,
				// 核销结果 { success, msg, cardTitle, expiryTime, cardId }
				result: null
			}
		},
		computed: {
			stepIndex() {
				return this.step - 1
			},
			// 券ID过长时截断展示, 避免撑破卡片
			certificateIdShort() {
				var id = this.session && this.session.certificateId ? String(this.session.certificateId) : ''
				if (!id) return '-'
				if (id.length > 24) return id.substring(0, 12) + '...' + id.substring(id.length - 6)
				return id
			},
			// 有效期: 两端都为空则不展示这一行
			validRange() {
				var s = this.session || {}
				var a = this.formatDate(s.validStart)
				var b = this.formatDate(s.validEnd)
				if (!a && !b) return ''
				return (a || '-') + ' ~ ' + (b || '-')
			}
		},
		methods: {
			/** 时间展示: 兼容时间戳与字符串 */
			formatDate(t) {
				if (!t) return ''
				var str = String(t)
				if (/^\d{10,13}$/.test(str)) {
					var n = Number(str)
					if (str.length <= 10) n = n * 1000
					return uni.$u.date(n, 'yyyy-mm-dd hh:MM')
				}
				return str.replace('T', ' ').substring(0, 16)
			},
			/** 券码输入: 识别粘贴进来的抖音短链, 自动挪到链接输入框 */
			onCodeInput(val) {
				var v = String(val == null ? '' : val).trim()
				if (!v) return
				// 简单识别: http 开头 或 含 v.douyin.com, 视为粘贴了分享链接
				if (v.indexOf('http') === 0 || v.indexOf('v.douyin.com') > -1) {
					this.shortLink = v
					this.code = ''
					uni.$u.toast('已识别为抖音链接，已自动填入链接框')
				}
			},
			/** 步骤1 → 步骤2: 验券(校验券码/短链是否可用) */
			async doPrepare() {
				var code = String(this.code || '').trim()
				var link = String(this.shortLink || '').trim()
				if (!code && !link) return uni.$u.toast('请输入券码或粘贴抖音团购链接')
				if (this.preparing) return
				this.preparing = true
				try {
					// code 优先, 二者都空已在上方拦截
					var params = code ? { code: code } : { shortLink: link }
					const { data: res } = await douyinPrepare(params, { custom: { auth: true, catch: true } })
					if (!res || !res.sessionId) return uni.$u.toast('券信息解析失败，请核对后重试')
					this.session = res
					this.result = null
					this.step = 2
				} catch (e) {
					// 后端失败原因(如"抖音门店POI未配置"、"该团购券已核销")直接用 msg 提示
					uni.$u.toast((e && e.msg) || '验券失败，请稍后重试')
				} finally {
					this.preparing = false
				}
			},
			/** 步骤2 → 步骤3: 二次确认后核销 */
			doVerify() {
				if (this.verifying) return
				if (!this.session || !this.session.sessionId) return this.backToInput()
				uni.showModal({
					title: '确认核销',
					content: '确认核销这张团购券吗？核销后不可撤销（如误操作请立即联系门店）',
					confirmText: '确认核销',
					confirmColor: '#35a5ed',
					success: (r) => {
						if (r.confirm) this.submitVerify()
					}
				})
			},
			/** 真正发起核销: 本期不传 seatId, 核销后引导去选座 */
			async submitVerify() {
				if (this.verifying) return
				if (!this.session || !this.session.sessionId) return this.backToInput()
				this.verifying = true
				try {
					const { data: res } = await douyinVerify({
						sessionId: this.session.sessionId
					}, { custom: { auth: true, catch: true } })
					if (res && res.success === false) {
						this.result = { success: false, msg: (res && res.message) || '核销失败，请稍后重试' }
					} else {
						this.result = {
							success: true,
							msg: (res && res.message) || '核销成功',
							cardTitle: (res && res.cardTitle) || '',
							expiryTime: (res && res.expiryTime) || '',
							cardId: (res && res.cardId) || '',
							// 代金券类核销 => 充值余额, 无卡信息
							grantType: (res && res.grantType) || 'card',
							balanceAmount: (res && res.balanceAmount) || 0
						}
					}
				} catch (e) {
					this.result = { success: false, msg: (e && e.msg) || '核销失败，请稍后重试' }
				} finally {
					this.verifying = false
					this.step = 3
				}
			},
			/** 返回步骤1重新输码, 保留已输入内容方便修改 */
			backToInput() {
				this.session = null
				this.result = null
				this.step = 1
			},
			/** 核销成功后去选座(日卡/全天模式, 默认今天) */
			goSeat() {
				var weekArr = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
				var pad = function(n) { return n < 10 ? '0' + n : '' + n }
				var today = new Date()
				today.setHours(0, 0, 0, 0)
				var end = new Date(today.getTime() + 86400000)
				var dateStr = today.getFullYear() + '-' + pad(today.getMonth() + 1) + '-' + pad(today.getDate())
				var dateLabel = '今天 ' + (today.getMonth() + 1) + '月' + today.getDate() + '日 ' + weekArr[today.getDay()]
				uni.$u.route('/other_pages/check-seat/check-seat', {
					mode: 'daily',
					startTimestamp: today.getTime(),
					endTimestamp: end.getTime(),
					dateLabel: dateLabel,
					dateStr: dateStr
				})
			},
			goRecords() {
				uni.navigateTo({
					url: '/other_pages/douyin/records'
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.container {
		padding: 30rpx;
	}

	.steps-wrap {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 30rpx 20rpx;
		border: 2rpx solid #f0f0f0;
	}

	.tip-card {
		background: #f0f7ff;
		border-radius: 16rpx;
		padding: 20rpx 24rpx;
		margin-top: 30rpx;
	}

	.form-card {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 30rpx 24rpx;
		margin-top: 30rpx;
		border: 2rpx solid #e5e5e5;
	}

	.cert-card {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 30rpx 24rpx;
		margin-top: 30rpx;
		border: 2rpx solid #e5e5e5;
	}

	.cert-title-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24rpx;
	}

	.cert-row {
		display: flex;
		align-items: center;
		margin-bottom: 14rpx;
	}

	.cert-warn {
		margin-top: 20rpx;
		background: #fff7e6;
		border-radius: 12rpx;
		padding: 16rpx 20rpx;
	}

	.result-card {
		background: #ffffff;
		border-radius: 20rpx;
		padding: 60rpx 30rpx;
		margin-top: 30rpx;
		border: 2rpx solid #e5e5e5;
	}

	.result-info {
		margin-top: 30rpx;
		border-top: 2rpx solid #f5f5f5;
		padding-top: 24rpx;
		text-align: left;
	}

	.footer-wrap {
		margin-top: 60rpx;
	}

	.footer-link {
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 24rpx;
		padding: 16rpx 0;
	}
</style>
