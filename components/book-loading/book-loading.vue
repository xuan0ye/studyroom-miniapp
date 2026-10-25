<template>
	<view v-if="visible" class="book-loading" :class="{ 'book-loading--fullscreen': fullscreen }" role="status" :aria-label="text" @touchmove.stop.prevent="blockTouch" @tap.stop="blockTouch">
		<text v-if="fullscreen" class="book-loading__brand">答岸</text>
		<view class="book-loading__book" aria-hidden="true">
			<view class="book-loading__shadow"></view>
			<view class="book-loading__cover book-loading__cover--left"></view>
			<view class="book-loading__cover book-loading__cover--right"></view>
			<view class="book-loading__paper book-loading__paper--left"></view>
			<view class="book-loading__paper book-loading__paper--right"></view>
			<view class="book-loading__leaf book-loading__leaf--a"></view>
			<view class="book-loading__leaf book-loading__leaf--b"></view>
			<view class="book-loading__leaf book-loading__leaf--c"></view>
			<view class="book-loading__spine"></view>
		</view>
		<text class="book-loading__text">{{ text }}</text>
		<text v-if="fullscreen" class="book-loading__footer">让专注，慢慢发生</text>
	</view>
</template>

<script>
	export default {
		name: 'book-loading',
		props: {
			loading: { type: Boolean, default: false },
			text: { type: String, default: '正在翻开好时光…' },
			delay: { type: Number, default: 220 },
			fullscreen: { type: Boolean, default: false },
			minDuration: { type: Number, default: 0 }
		},
		data() { return { visible: false } },
		watch: {
			loading: { immediate: true, handler() { this.syncVisibility() } },
			delay() { this.syncVisibility() }
		},
		onPageShow() { this._pageHidden = false; this.syncVisibility() },
		onPageHide() { this._pageHidden = true; this.stopDelay(); this.visible = false },
		beforeDestroy() { this._pageHidden = true; this.stopDelay() },
		methods: {
			blockTouch() {},
			stopDelay() {
				if (this._delayTimer) clearTimeout(this._delayTimer)
				if (this._closeTimer) clearTimeout(this._closeTimer)
				this._delayTimer = null
				this._closeTimer = null
			},
			show() {
				if (!this.visible) this._shownAt = Date.now()
				this.visible = true
			},
			syncVisibility() {
				this.stopDelay()
				if (this._pageHidden) { this.visible = false; return }
				if (!this.loading) {
					const remaining = Math.max(0, this.minDuration - (Date.now() - (this._shownAt || 0)))
					if (this.visible && remaining) this._closeTimer = setTimeout(() => { this.visible = false; this._closeTimer = null }, remaining)
					else this.visible = false
					return
				}
				if (this.visible) return
				const delay = Math.max(0, Number(this.delay) || 0)
				if (!delay) { this.show(); return }
				this._delayTimer = setTimeout(() => {
					this._delayTimer = null
					if (this.loading && !this._pageHidden) this.show()
				}, delay)
			}
		}
	}
</script>

<style scoped>
	.book-loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 64rpx 0; }
	.book-loading--fullscreen { position: fixed; top: 0; right: 0; bottom: 0; left: 0; z-index: 30000; box-sizing: border-box; padding: 0 40rpx 80rpx; background: #f7fbff; background: radial-gradient(ellipse at 50% 42%, #eaf6ff 0%, #f7fbff 64%); }
	.book-loading__brand { margin-bottom: 76rpx; color: #28547a; font-size: 48rpx; line-height: 70rpx; font-weight: 600; letter-spacing: 12rpx; }
	.book-loading--fullscreen .book-loading__book { transform: scale(1.25) rotate(-5deg); }
	.book-loading--fullscreen .book-loading__text { margin-top: 76rpx; }
	.book-loading__footer { position: absolute; right: 40rpx; bottom: calc(56rpx + env(safe-area-inset-bottom)); left: 40rpx; color: #94a9bb; font-size: 24rpx; line-height: 36rpx; letter-spacing: 4rpx; text-align: center; }
	.book-loading__book { position: relative; width: 216rpx; height: 144rpx; perspective: 920rpx; transform: rotate(-5deg); }
	.book-loading__shadow { position: absolute; width: 200rpx; height: 20rpx; left: 8rpx; bottom: -24rpx; border-radius: 50%; background: rgba(25,69,104,.1); filter: blur(10rpx); }
	.book-loading__cover { position: absolute; top: 14rpx; width: 108rpx; height: 132rpx; background: #39a5e9; }
	.book-loading__cover--left { left: 0; border-radius: 16rpx 4rpx 4rpx 16rpx; transform: skewY(6deg); }
	.book-loading__cover--right { right: 0; border-radius: 4rpx 16rpx 16rpx 4rpx; transform: skewY(-6deg); }
	.book-loading__paper { position: absolute; top: 12rpx; width: 94rpx; height: 116rpx; background: #fffdf5; box-shadow: 0 4rpx #d8e6ee, 0 8rpx #fffdf5; overflow: hidden; }
	.book-loading__paper--left { left: 10rpx; border-radius: 12rpx 0 0 12rpx; transform: skewY(6deg); }
	.book-loading__paper--right { right: 10rpx; border-radius: 0 12rpx 12rpx 0; transform: skewY(-6deg); }
	.book-loading__paper::after, .book-loading__leaf::after { content: ''; position: absolute; top: 30rpx; right: 18rpx; bottom: 26rpx; left: 18rpx; background: repeating-linear-gradient(to bottom,#d8e6ee 0 4rpx,transparent 4rpx 18rpx); opacity: .7; }
	.book-loading__leaf { position: absolute; width: 94rpx; height: 114rpx; top: 12rpx; left: 108rpx; transform-origin: left center; transform-style: preserve-3d; background: #fffdf5; border-radius: 0 12rpx 12rpx 0; animation: daan-page-turn 1.65s ease-in-out infinite; box-shadow: 2rpx 2rpx 4rpx rgba(25,69,104,.1); }
	.book-loading__leaf--a { animation-delay: -1.1s; }
	.book-loading__leaf--b { animation-delay: -.55s; }
	.book-loading__spine { position: absolute; left: 104rpx; top: 18rpx; width: 6rpx; height: 114rpx; border-radius: 50%; background: #d8e6ee; opacity: .7; }
	.book-loading__text { margin-top: 52rpx; font-size: 26rpx; line-height: 40rpx; letter-spacing: 2rpx; color: #738293; text-align: center; }
	@keyframes daan-page-turn {
		0% { transform: rotateY(0deg) skewY(-6deg); opacity: 0; }
		8% { opacity: 1; }
		60% { transform: rotateY(-178deg) skewY(-6deg); opacity: 1; }
		80%, 100% { transform: rotateY(-180deg) skewY(-6deg); opacity: 0; }
	}
	@media (prefers-reduced-motion: reduce) { .book-loading__leaf { animation: none; display: none; } }
</style>
