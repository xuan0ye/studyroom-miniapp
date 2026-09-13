<template>
	<view class="kb-page">
		<my-navbar title="AI 知识库" leftIcon="arrow-left" bgColor="#4f7cfe" :custom="false" :autoBack="true"
			titleStyle="color:#ffffff" leftIconColor="#ffffff" leftIconSize="40"></my-navbar>

		<view class="add-card">
			<view class="add-title">📝 录入知识（数据飞轮第一步）</view>
			<input class="kb-input" v-model="title" placeholder="标题，如：自习室使用规则" />
			<textarea class="kb-textarea" v-model="content" placeholder="正文内容，保存后会自动切分并向量化，AI 即可引用回答" />
			<view class="add-btn" :class="{ disabled: !title.trim() || !content.trim() || adding }" @click="addDoc">
				<u-text text="保存入库" size="28" color="#ffffff" bold></u-text>
			</view>
			<view class="add-tip">录入后点「检索测试」可以验证召回效果，这是 RAG 的「召回→排序→生成」链路。</view>
		</view>

		<view class="search-card">
			<view class="row">
				<input class="search-input" v-model="query" placeholder="输入问题测试检索效果" />
				<view class="search-btn" @click="doSearch">
					<u-text text="检索测试" size="26" color="#ffffff" bold></u-text>
				</view>
			</view>
			<view class="hit-list" v-if="hits.length">
				<view class="hit-item" v-for="(h, i) in hits" :key="i">
					<view class="hit-head">
						<text class="hit-doc">《{{ h.documentTitle }}》</text>
						<text class="hit-score">score {{ h.score.toFixed(3) }}</text>
					</view>
					<text class="hit-content">{{ h.content }}</text>
				</view>
			</view>
		</view>

		<view class="doc-list">
			<view class="doc-item" v-for="d in docs" :key="d.id">
				<view class="doc-info">
					<view class="doc-title">{{ d.title }}</view>
					<view class="doc-meta">分片 {{ d.chunkCount }} · {{ d.createTime ? d.createTime : '' }}</view>
				</view>
				<view class="doc-del" @click="delDoc(d)">
					<u-text text="删除" size="26" color="#ff6b6b"></u-text>
				</view>
			</view>
			<view class="doc-empty" v-if="!docs.length">知识库还是空的，先录入一份资料吧～</view>
		</view>
	</view>
</template>

<script>
	import {
		kbDocuments,
		kbAdd,
		kbDelete,
		kbSearch
	} from '@/config/api.js';

	export default {
		data() {
			return {
				title: '',
				content: '',
				adding: false,
				query: '',
				hits: [],
				docs: []
			}
		},
		onShow() {
			this.loadDocs()
		},
		methods: {
			async loadDocs() {
				try {
					const { data: docs } = await kbDocuments({}, {
						custom: {
							auth: true,
							catch: true
						}
					})
					this.docs = docs || []
				} catch (e) {
					uni.$u.toast('加载知识库失败')
				}
			},
			async addDoc() {
				if (!this.title.trim() || !this.content.trim() || this.adding) return
				this.adding = true
				try {
					const { data: r } = await kbAdd({
						title: this.title.trim(),
						content: this.content.trim()
					}, {
						custom: {
							auth: true,
							catch: true
						}
					})
					// 后端 addDocument 返回 {chunkCount: n}
					var cnt = r && r.chunkCount != null ? r.chunkCount : r
					uni.$u.toast('入库成功，共 ' + cnt + ' 个分片')
					this.title = ''
					this.content = ''
					this.loadDocs()
				} catch (e) {
					uni.$u.toast('入库失败：' + (e.msg || '请稍后重试'))
				} finally {
					this.adding = false
				}
			},
			async doSearch() {
				const q = this.query.trim()
				if (!q) return
				try {
					const { data: hits } = await kbSearch({
						query: q,
						topK: 4
					}, {
						custom: {
							auth: true,
							catch: true
						}
					})
					this.hits = hits || []
				} catch (e) {
					uni.$u.toast('检索失败')
				}
			},
			delDoc(d) {
				uni.showModal({
					title: '提示',
					content: '确认删除《' + d.title + '》及其所有分片？',
					success: async (res) => {
						if (!res.confirm) return
						try {
							await kbDelete(d.id, {}, {
								custom: {
									auth: true,
									catch: true
								}
							})
							uni.$u.toast('已删除')
							this.loadDocs()
						} catch (e) {
							uni.$u.toast('删除失败')
						}
					}
				})
			}
		}
	}
</script>

<style lang="scss" scoped>
	.kb-page {
		min-height: 100vh;
		background: #f5f6fa;
		padding-bottom: 60rpx;
	}

	.add-card,
	.search-card,
	.doc-list {
		margin: 24rpx;
		background: #ffffff;
		border-radius: 20rpx;
		padding: 28rpx;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
	}

	.add-title {
		font-size: 30rpx;
		font-weight: bold;
		color: #333333;
		margin-bottom: 20rpx;
	}

	.kb-input {
		height: 76rpx;
		background: #f5f6fa;
		border-radius: 14rpx;
		padding: 0 24rpx;
		font-size: 28rpx;
		margin-bottom: 16rpx;
	}

	.kb-textarea {
		width: 100%;
		height: 200rpx;
		background: #f5f6fa;
		border-radius: 14rpx;
		padding: 20rpx 24rpx;
		font-size: 26rpx;
		box-sizing: border-box;
	}

	.add-btn {
		margin-top: 20rpx;
		height: 76rpx;
		border-radius: 40rpx;
		background: linear-gradient(135deg, #4f7cfe, #7a5cfe);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.add-btn.disabled {
		opacity: 0.5;
	}

	.add-tip {
		margin-top: 14rpx;
		font-size: 22rpx;
		color: #999999;
		line-height: 1.6;
	}

	.row {
		display: flex;
		gap: 16rpx;
	}

	.search-input {
		flex: 1;
		height: 76rpx;
		background: #f5f6fa;
		border-radius: 40rpx;
		padding: 0 26rpx;
		font-size: 26rpx;
	}

	.search-btn {
		height: 76rpx;
		padding: 0 30rpx;
		border-radius: 40rpx;
		background: linear-gradient(135deg, #4f7cfe, #7a5cfe);
		display: flex;
		align-items: center;
	}

	.hit-list {
		margin-top: 20rpx;
	}

	.hit-item {
		padding: 16rpx;
		background: #f0f4ff;
		border-radius: 12rpx;
		margin-bottom: 12rpx;
	}

	.hit-head {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 8rpx;
	}

	.hit-doc {
		font-size: 24rpx;
		color: #4f7cfe;
		font-weight: bold;
	}

	.hit-score {
		font-size: 22rpx;
		color: #999999;
	}

	.hit-content {
		font-size: 24rpx;
		color: #666666;
		line-height: 1.5;
		word-break: break-all;
	}

	.doc-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20rpx 0;
		border-bottom: 1rpx solid #f0f0f0;
	}

	.doc-title {
		font-size: 28rpx;
		color: #333333;
		font-weight: bold;
	}

	.doc-meta {
		font-size: 22rpx;
		color: #999999;
		margin-top: 6rpx;
	}

	.doc-del {
		padding: 10rpx 24rpx;
	}

	.doc-empty {
		padding: 40rpx 0;
		text-align: center;
		font-size: 26rpx;
		color: #999999;
	}
</style>