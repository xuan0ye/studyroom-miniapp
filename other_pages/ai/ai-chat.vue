<template>
	<view class="ai-chat-page">
		<my-navbar title="AI 学伴" leftIcon="arrow-left" bgColor="#4f7cfe" :custom="false" :autoBack="true"
			titleStyle="color:#ffffff" leftIconColor="#ffffff" leftIconSize="40">
		</my-navbar>

		<scroll-view class="msg-scroll" scroll-y="true" :scroll-into-view="scrollInto">
			<view class="msg-list">
				<view class="welcome" v-if="messages.length === 0">
					<view class="welcome-title">你好，我是「答岸自习室」的 AI 学伴</view>
					<view class="welcome-desc">我只负责答岸自习室相关的问题：查余额、查座位、看学习时长与排名、了解卡券和规则等。试试下面的问题：</view>
					<view class="suggestions">
						<view class="suggestion" v-for="(s, i) in suggestions" :key="i" @click="quickAsk(s)">{{ s }}</view>
					</view>
				</view>

				<view class="msg-item" v-for="(m, i) in messages" :key="m.key" :id="'msg-' + m.key">
					<view class="msg-row" :class="m.role === 'user' ? 'row-user' : 'row-ai'">
						<view class="msg-avatar" v-if="m.role !== 'user'">
							<u-icon name="account-fill" color="#ffffff" size="40"></u-icon>
						</view>
						<view class="msg-bubble" :class="m.role === 'user' ? 'bubble-user' : 'bubble-ai'">
							<text class="msg-content" :user-select="true">{{ m.content }}</text>

							<view class="msg-meta" v-if="m.role !== 'user' && m.model">
								<text class="meta-text">{{ m.model }} · {{ m.latencyMs ? (m.latencyMs / 1000).toFixed(1) + 's' : '' }} · {{ m.mock ? '演示模式' : '在线' }}</text>
							</view>

							<view class="tool-trace" v-if="m.toolCalls && m.toolCalls.length">
								<view class="trace-title">🔧 已调用工具 {{ m.toolCalls.length }} 次</view>
								<view class="trace-item" v-for="(t, ti) in m.toolCalls" :key="ti">
									<text class="trace-name">{{ t.name }}</text>
									<text class="trace-args">{{ t.arguments }}</text>
								</view>
							</view>

							<view class="kb-hits" v-if="m.kbHits && m.kbHits.length" @click="m.showKb = !m.showKb">
								<view class="kb-title">📚 知识库命中 {{ m.kbHits.length }} 条（点击展开）</view>
								<view v-if="m.showKb">
									<view class="kb-item" v-for="(h, hi) in m.kbHits" :key="hi">
										<text class="kb-doc">《{{ h.title }}》</text>
										<text class="kb-content">{{ h.content }}</text>
									</view>
								</view>
							</view>

							<view class="feedback" v-if="m.role !== 'user' && m.id && !m.rated">
								<view class="fb-btn" @click="rate(m, 1)">👍 有帮助</view>
								<view class="fb-btn" @click="rate(m, -1)">👎 不准确</view>
							</view>
							<view class="feedback" v-if="m.role !== 'user' && m.rated">
								<text class="fb-done">{{ m.rated === 1 ? '已反馈：有帮助' : '已反馈：不准确' }}</text>
							</view>
						</view>
						<view class="msg-avatar user-avatar" v-if="m.role === 'user'">
							<u-icon name="account" color="#ffffff" size="40"></u-icon>
						</view>
					</view>
				</view>

				<view class="msg-item" v-if="loading">
					<view class="msg-row row-ai">
						<view class="msg-avatar">
							<u-icon name="account-fill" color="#ffffff" size="40"></u-icon>
						</view>
						<view class="msg-bubble bubble-ai typing">
							<view class="dot"></view><view class="dot"></view><view class="dot"></view>
						</view>
					</view>
				</view>
				<view id="msg-bottom" style="height: 10rpx;"></view>
			</view>
		</scroll-view>

		<view class="input-bar">
			<view class="ai-disclaimer">内容由 AI 生成，仅供参考</view>
			<input class="chat-input" v-model="input" confirm-type="send" :disabled="loading" placeholder="问问小柚…"
				@confirm="send" />
			<view class="send-btn" :class="{ disabled: !input.trim() || loading }" @click="send">
				<u-text text="发送" size="28" color="#ffffff" bold></u-text>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		aiChat,
		aiMessages,
		aiFeedback
	} from '@/config/api.js';

	export default {
		data() {
			return {
				messages: [],
				input: '',
				loading: false,
				sessionId: null,
				scrollInto: '',
				suggestions: ['帮我查一下余额', '现在还有空座位吗', '我学了多久，排第几', '自习室在哪，电话多少']
			}
		},
		onLoad() {
			const sid = uni.getStorageSync('ai_session_id')
			if (sid) {
				this.sessionId = sid
				this.loadHistory(sid)
			}
		},
		methods: {
			async loadHistory(sid) {
				try {
					const res = await aiMessages(sid, {}, {
						custom: {
							auth: true,
							catch: true
						}
					})
					const list = res && res.data ? res.data : res
					this.messages = (list || []).map((m, i) => {
						let toolCalls = null
						if (m.toolCalls) {
							try {
								toolCalls = Array.isArray(m.toolCalls) ? m.toolCalls : [m.toolCalls]
							} catch (e) {}
						}
						return {
							key: 'h' + i,
							role: m.role,
							content: m.content || '',
							model: m.model,
							rating: m.rating,
							rated: m.rating === 1 || m.rating === -1,
							toolCalls,
							kbHits: m.kbHits || null,
							showKb: false,
							id: m.id,
							latencyMs: 0
						}
					})
					this.$nextTick(() => this.scrollBottom())
				} catch (e) {
					uni.$u.toast('加载历史失败')
				}
			},
			quickAsk(s) {
				this.input = s
				this.send()
			},
			async send() {
				const text = this.input.trim()
				if (!text || this.loading) return
				this.input = ''
				const userMsg = {
					key: 'u' + Date.now(),
					role: 'user',
					content: text
				}
				this.messages.push(userMsg)
				this.loading = true
				this.scrollBottom()
				try {
					const res = await aiChat({
						message: text,
						sessionId: this.sessionId
					}, {
						custom: {
							auth: true,
							catch: true
						}
					})
					// 拦截器返回 {code,msg,data}, 实际数据在 res.data
					const r = res && res.data ? res.data : res
					this.sessionId = r.sessionId
					uni.setStorageSync('ai_session_id', r.sessionId)
					let toolCalls = null
					if (r.toolTrace && r.toolTrace.length) {
						toolCalls = r.toolTrace.map(t => ({
							name: t.name,
							arguments: t.arguments || ''
						}))
					}
					this.messages.push({
						key: 'a' + Date.now(),
						role: 'assistant',
						content: r.reply,
						model: r.model,
						latencyMs: r.latencyMs,
						mock: r.mock,
						toolCalls,
						kbHits: r.kbHits || null,
						showKb: false,
						rated: false,
						id: null
					})
				} catch (e) {
					uni.$u.toast('AI 服务异常：' + (e.msg || '请稍后重试'))
					this.messages.push({
						key: 'e' + Date.now(),
						role: 'assistant',
						content: '抱歉，AI 服务暂时不可用，请稍后再试。',
						model: 'error',
						latencyMs: 0,
						mock: true,
						toolCalls: null,
						kbHits: null,
						showKb: false,
						rated: false,
						id: null
					})
				} finally {
					this.loading = false
					this.scrollBottom()
				}
			},
			async rate(m, rating) {
				if (!m.id) return
				try {
					await aiFeedback({
						messageId: m.id,
						rating,
						comment: ''
					}, {
						custom: {
							auth: true,
							catch: true
						}
					})
					m.rated = rating
					uni.$u.toast('感谢反馈，帮助小柚变更好')
				} catch (e) {
					uni.$u.toast('反馈失败')
				}
			},
			toKb() {
				// AI 知识库为管理员维护功能, 已对普通用户隐藏入口; 页面保留供内部使用
				uni.navigateTo({
					url: '/other_pages/ai/ai-kb'
				})
			},
			scrollBottom() {
				this.scrollInto = ''
				this.$nextTick(() => {
					this.scrollInto = 'msg-bottom'
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.ai-chat-page {
		height: 100vh;
		display: flex;
		flex-direction: column;
		background-color: #f5f6fa;
	}

	.navbar-right {
		margin-right: 30rpx;
		padding: 10rpx 20rpx;
		border: 1rpx solid rgba(255, 255, 255, 0.6);
		border-radius: 30rpx;
	}

	.msg-scroll {
		flex: 1;
		overflow: hidden;
	}

	.msg-list {
		padding: 24rpx 20rpx 120rpx;
	}

	.welcome {
		margin: 60rpx 30rpx;
		padding: 40rpx;
		background: linear-gradient(135deg, #4f7cfe 0%, #7a5cfe 100%);
		border-radius: 24rpx;
	}

	.welcome-title {
		font-size: 34rpx;
		font-weight: bold;
		color: #ffffff;
		margin-bottom: 16rpx;
	}

	.welcome-desc {
		font-size: 26rpx;
		color: rgba(255, 255, 255, 0.9);
		line-height: 1.6;
	}

	.suggestions {
		margin-top: 24rpx;
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
	}

	.suggestion {
		padding: 14rpx 26rpx;
		background: rgba(255, 255, 255, 0.18);
		border: 1rpx solid rgba(255, 255, 255, 0.5);
		border-radius: 40rpx;
		font-size: 24rpx;
		color: #ffffff;
	}

	.msg-row {
		display: flex;
		align-items: flex-start;
		margin-bottom: 30rpx;
	}

	.row-user {
		flex-direction: row-reverse;
	}

	.msg-avatar {
		width: 64rpx;
		height: 64rpx;
		border-radius: 50%;
		background: linear-gradient(135deg, #4f7cfe, #7a5cfe);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.user-avatar {
		background: linear-gradient(135deg, #34c77b, #17b978);
	}

	.msg-bubble {
		max-width: 72%;
		padding: 20rpx 24rpx;
		border-radius: 20rpx;
		font-size: 28rpx;
		line-height: 1.6;
		word-break: break-all;
	}

	.bubble-user {
		background: #4f7cfe;
		color: #ffffff;
		margin-right: 16rpx;
		border-top-right-radius: 6rpx;
	}

	.bubble-ai {
		background: #ffffff;
		color: #333333;
		margin-left: 16rpx;
		border-top-left-radius: 6rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
	}

	.msg-content {
		white-space: pre-wrap;
	}

	.msg-meta {
		margin-top: 12rpx;
	}

	.meta-text {
		font-size: 20rpx;
		color: #999999;
	}

	.tool-trace {
		margin-top: 14rpx;
		padding: 14rpx;
		background: #f0f4ff;
		border-radius: 12rpx;
	}

	.trace-title {
		font-size: 22rpx;
		color: #4f7cfe;
		margin-bottom: 8rpx;
	}

	.trace-item {
		font-size: 22rpx;
		color: #666666;
		word-break: break-all;
	}

	.trace-name {
		display: inline-block;
		padding: 2rpx 12rpx;
		background: #4f7cfe;
		color: #ffffff;
		border-radius: 8rpx;
		margin-right: 8rpx;
		font-size: 20rpx;
	}

	.kb-hits {
		margin-top: 14rpx;
		padding: 14rpx;
		background: #f6f0ff;
		border-radius: 12rpx;
	}

	.kb-title {
		font-size: 22rpx;
		color: #7a5cfe;
	}

	.kb-item {
		margin-top: 8rpx;
	}

	.kb-doc {
		font-size: 22rpx;
		color: #7a5cfe;
		font-weight: bold;
		margin-right: 8rpx;
	}

	.kb-content {
		font-size: 22rpx;
		color: #666666;
	}

	.feedback {
		margin-top: 14rpx;
		display: flex;
		gap: 16rpx;
	}

	.fb-btn {
		padding: 6rpx 20rpx;
		border: 1rpx solid #dddddd;
		border-radius: 30rpx;
		font-size: 22rpx;
		color: #888888;
	}

	.fb-done {
		font-size: 22rpx;
		color: #4f7cfe;
	}

	.typing {
		display: flex;
		gap: 12rpx;
		padding: 26rpx 30rpx;
	}

	.dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		background: #b0b8ff;
		animation: blink 1.2s infinite ease-in-out;
	}

	.dot:nth-child(2) {
		animation-delay: 0.2s;
	}

	.dot:nth-child(3) {
		animation-delay: 0.4s;
	}

	@keyframes blink {
		0%,
		80%,
		100% {
			opacity: 0.3;
			transform: translateY(0);
		}
		40% {
			opacity: 1;
			transform: translateY(-6rpx);
		}
	}

	.input-bar {
		position: fixed;
		left: 0;
		right: 0;
		bottom: 0;
		padding: 16rpx 24rpx calc(16rpx + env(safe-area-inset-bottom));
		background: #ffffff;
		display: flex;
		align-items: center;
		gap: 20rpx;
		box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.05);
		flex-wrap: wrap;
	}

	.ai-disclaimer {
		width: 100%;
		margin-bottom: -8rpx;
		text-align: center;
		font-size: 22rpx;
		color: #999999;
	}

	.chat-input {
		flex: 1;
		height: 72rpx;
		background: #f5f6fa;
		border-radius: 40rpx;
		padding: 0 30rpx;
		font-size: 28rpx;
	}

	.send-btn {
		height: 72rpx;
		padding: 0 36rpx;
		border-radius: 40rpx;
		background: linear-gradient(135deg, #4f7cfe, #7a5cfe);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.send-btn.disabled {
		opacity: 0.5;
	}
</style>