<template>
	<view style="background-color: #f5f6fa; min-height: 100vh;">
		<my-navbar :title="navTitle" :custom="false" :autoBack="true"></my-navbar>
		<view class="agreement-page">
			<view class="agreement-card">
				<view class="agreement-title">{{ docTitle }}</view>
				<view class="agreement-meta">更新日期：2026年9月6日　　生效日期：2026年9月6日</view>
				<view class="agreement-body">
					<view class="preamble" v-if="type === 'user'">
						欢迎您使用「答岸自习室」微信小程序（以下简称"本小程序"）。本协议是您与答岸自习室经营者（以下简称"我们"）之间就使用本小程序服务所订立的协议。您勾选"已阅读并同意"或实际使用本小程序服务，即表示您已阅读并同意本协议的全部内容。
					</view>
					<view class="preamble" v-else>
						「答岸自习室」微信小程序（以下简称"本小程序"）由答岸自习室经营者（以下简称"我们"）运营。我们深知个人信息对您的重要性，将按照法律法规要求，采取相应安全保护措施，尽力保护您的个人信息安全可控。
					</view>

					<template v-if="type === 'user'">
						<view class="sec-title">一、服务说明</view>
						<view class="p">1. 本小程序为您提供自习室座位预约、时长卡/优惠卡购买、余额充值、学习排行等线上服务，以及座位设备控制、门禁通行等到店服务。</view>
						<view class="p">2. 您应保证在注册及使用过程中提交的信息真实、准确，并妥善保管账号，不得出借、转让给他人使用。</view>
						<view class="p">3. 您通过本小程序预约的座位应在预约时段内使用；违约、超时未签到等情形按店内公示规则处理。</view>

						<view class="sec-title">二、账号与登录</view>
						<view class="p">1. 本小程序使用微信授权登录，您可选择授权手机号以完成注册。若您拒绝授权手机号，将无法使用预约、支付等核心功能，但可浏览部分公开信息。</view>
						<view class="p">2. 您可随时通过"我的-设置"或联系我们注销账号。注销后，我们将依法删除或匿名化处理您的个人信息。</view>

						<view class="sec-title">三、付费服务与退款</view>
						<view class="p">1. 时长卡、优惠卡等虚拟商品属于即时交付型商品，购买前请确认需求。已开启使用的卡项不支持退款；未开启使用的卡项可联系门店协商处理。</view>
						<view class="p">2. 余额充值仅限在本小程序内消费使用，不可提现；可退情形按店内公示规则执行。</view>
						<view class="p">3. 因本小程序原因导致服务无法正常提供的，我们将依法承担相应责任。</view>

						<view class="sec-title">四、用户行为规范</view>
						<view class="p">1. 您承诺不利用本小程序从事任何违反法律法规或公序良俗的活动，不发布、传播违法违规信息。</view>
						<view class="p">2. 您不得利用本小程序干扰门店正常经营秩序，不得恶意占座、恶意刷单或进行其他损害他人权益的行为。</view>

						<view class="sec-title">五、免责声明</view>
						<view class="p">1. 因不可抗力、网络故障、系统维护等原因导致服务中断的，我们将尽力恢复并及时通知，但不承担由此造成的间接损失。</view>
						<view class="p">2. 座位预约、门禁通行以门店现场实际安排为准；因个人原因未按时到店使用，相关规则按店内公示执行。</view>

						<view class="sec-title">六、协议的变更与终止</view>
						<view class="p">1. 我们可能根据业务调整对本协议进行修订，修订后的协议将在本页面公布。若您继续使用本小程序，视为接受修订后的协议。</view>
						<view class="p">2. 若您不同意修订内容，可停止使用本小程序并注销账号。</view>

						<view class="sec-title">七、联系我们</view>
						<view class="p">如您对本协议有任何疑问，可通过"我的-意见反馈"或门店客服与我们联系。</view>
					</template>

					<template v-else>
						<view class="sec-title">一、我们收集的信息</view>
						<view class="p">1. <text class="b">登录信息：</text>微信登录凭证（code）、微信昵称与头像（仅当您主动授权时）、手机号（仅当您主动授权一键登录时收集）。</view>
						<view class="p">2. <text class="b">预约与消费信息：</text>预约座位、到店签到、订单、卡项、余额与积分记录。</view>
						<view class="p">3. <text class="b">门禁人脸信息：</text>仅当您主动开通门禁人脸识别功能时，才会收集您上传的人脸照片，用于生成门禁通行凭证。<text class="b">该信息属于敏感个人信息，我们仅在您单独同意后收集</text>，您可随时在"门禁人脸"页面删除。</view>
						<view class="p">4. <text class="b">设备信息：</text>您绑定座位的智能设备开关状态与控制记录。</view>

						<view class="sec-title">二、我们如何使用信息</view>
						<view class="p">1. 用于完成登录、预约、支付、签到、门禁通行等核心业务流程。</view>
						<view class="p">2. 用于向您展示学习时长、排行、卡券与积分等个人数据。</view>
						<view class="p">3. 用于保障交易安全、排查故障、处理售后与客服咨询。</view>
						<view class="p">4. 我们不会将您的个人信息用于上述目的之外的用途；如需变更用途，将再次征得您的同意。</view>

						<view class="sec-title">三、信息的共享与委托</view>
						<view class="p">1. 支付服务由财付通支付科技有限公司（微信支付）提供，支付过程中产生的信息按其隐私政策处理。</view>
						<view class="p">2. 除上述情形及法律法规要求外，我们不会向任何第三方提供、共享您的个人信息。</view>

						<view class="sec-title">四、信息的存储与保护</view>
						<view class="p">1. 您的个人信息存储于中华人民共和国境内的服务器，数据传输采用 HTTPS 加密。</view>
						<view class="p">2. 我们采取访问控制、脱敏、日志审计等措施防止信息被未经授权访问、篡改或泄露。</view>
						<view class="p">3. 人脸照片等敏感信息加密存储，保存期限不超过实现目的所必需的最短时间。</view>

						<view class="sec-title">五、您的权利</view>
						<view class="p">1. 查询、更正：您可在小程序内随时查看并更正个人资料。</view>
						<view class="p">2. 删除：您可删除门禁人脸信息、对话记录等；注销账号时我们将依法删除或匿名化您的全部个人信息。</view>
						<view class="p">3. 撤回同意：您可通过微信设置关闭授权，或联系客服撤回授权。撤回不影响此前基于授权已进行的数据处理。</view>
						<view class="p">4. 注销账号：您可通过"我的-设置"或联系客服注销账号，我们将在 15 个工作日内完成处理。</view>

						<view class="sec-title">六、未成年人保护</view>
						<view class="p">本小程序面向成年人提供服务。若您未满 14 周岁，请在监护人陪同下使用，并由监护人代为阅读并同意本政策。</view>

						<view class="sec-title">七、政策更新</view>
						<view class="p">本政策可能适时修订，重大变更我们将以弹窗、公告等方式向您提示。请您定期查阅本页面。</view>

						<view class="sec-title">八、联系我们</view>
						<view class="p">如您对本政策或个人信息保护有任何疑问、意见，可通过"我的-意见反馈"或门店客服与我们联系，我们将在 15 个工作日内答复。</view>
					</template>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	export default {
		data() {
			return {
				type: 'user'
			}
		},
		computed: {
			navTitle() {
				return this.type === 'user' ? '用户服务协议' : '隐私政策'
			},
			docTitle() {
				return this.type === 'user' ? '答岸自习室用户服务协议' : '答岸自习室隐私政策'
			}
		},
		onLoad(options) {
			if (options && options.type === 'privacy') {
				this.type = 'privacy'
			}
		}
	}
</script>

<style lang="scss" scoped>
	.agreement-page {
		padding: 20rpx 30rpx 60rpx;
	}

	.agreement-card {
		background: #ffffff;
		border-radius: 24rpx;
		padding: 40rpx 36rpx;
	}

	.agreement-title {
		font-size: 34rpx;
		font-weight: 700;
		color: #1a1a1a;
		text-align: center;
	}

	.agreement-meta {
		margin-top: 12rpx;
		font-size: 22rpx;
		color: #999;
		text-align: center;
		padding-bottom: 24rpx;
		border-bottom: 2rpx solid #f0f0f0;
	}

	.agreement-body {
		padding-top: 24rpx;
	}

	.sec-title {
		margin: 28rpx 0 12rpx;
		font-size: 28rpx;
		font-weight: 700;
		color: #333;
	}

	.p {
		margin-bottom: 14rpx;
		font-size: 26rpx;
		line-height: 1.8;
		color: #666;
		text-align: justify;
	}

	.preamble {
		margin-bottom: 16rpx;
		font-size: 26rpx;
		line-height: 1.8;
		color: #666;
		text-align: justify;
	}

	.b {
		font-weight: 700;
		color: #333;
	}
</style>
