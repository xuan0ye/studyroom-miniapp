<template>
	<view>
		<!-- 占位, 防止固定底部栏遮挡页面内容 -->
		<view class="tabbar-placeholder"></view>
		<view class="tabbar-class">
			<view class="tabbar-inner">
				<view v-for="(item, i) in tabbar" :key="i" class="tabbar-item" @click="click(i)">
					<u-icon :name="item.iconPath" size="52"
						:color="i === currentIndex ? '#35a5ed' : '#9a9a9a'"></u-icon>
					<text class="tabbar-text" :style="{ color: i === currentIndex ? '#35a5ed' : '#9a9a9a' }">{{item.text}}</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script>
	import {
		mapState,
		mapMutations
	} from 'vuex'
	export default {
		data() {
			return {

			}
		},
		computed: {
			...mapState(['tabbar', 'index']),
			currentIndex() {
				return this.index
			}
		},
		methods: {
			...mapMutations(['setIndex']),
			click(i) {
				// 以当前页面实际路径判断, 不依赖 vuex index(可能与实际页面失同步导致点击无反应)
				const pages = getCurrentPages()
				const current = pages.length ? pages[pages.length - 1].route : ''
				const target = String(this.tabbar[i].pagePath).replace(/^\//, '')
				if (current === target) return
				this.setIndex(i)
				uni.switchTab({
					url: this.tabbar[i].pagePath
				})
			}
		}
	}
</script>

<style scoped>
	.tabbar-placeholder {
		height: calc(110rpx + env(safe-area-inset-bottom));
	}

	.tabbar-class {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 999;
		background-color: #ffffff;
		border-top: 1rpx solid #f0f0f0;
		box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.04);
		padding-bottom: env(safe-area-inset-bottom);
	}

	.tabbar-inner {
		display: flex;
		flex-direction: row;
		height: 110rpx;
	}

	.tabbar-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.tabbar-text {
		font-size: 22rpx;
		margin-top: 2rpx;
	}
</style>
