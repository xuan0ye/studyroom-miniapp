<template>

	<view class="u-page__item">
		<u-navbar :leftText="leftText" :show="show" :title="title" :autoBack="autoBack" :custom="custom"
			:bgColor="bgColor" placeholder="true" @leftClick="showMenu" v-if="custom">
			<view class="u-nav-slot my-text" slot="left">
				<view style="width: 260rpx;">
					<u-text :lines="1" :bold="true" size="36" :selectable="false" :text="store.roomName" />
				</view>

			</view>
			<view class="u-nav-slot" slot="center" @click="showMenu">
				<u-text :bold="true" size="28" color="#35a5ed" :selectable="false" text="切换" />
				<u-icon name="arrow-right" color="#35a5ed" size="32"></u-icon>
			</view>
		</u-navbar>
		<!--
			2026-10-15 修复「点左上角的返回没有任何反应，卡在页面里出不去」：
			uView 的 autoBack 内部只做一句 uni.navigateBack()，没有任何兜底，
			而小程序在「页面栈只有 1 层」时该调用会静默失败。触发场景是真实存在的：
			别人分享的卡片/小程序码/扫码直接打开内页、从服务通知或客服消息点进内页、
			开发者工具「自定义编译模式」指定启动页、以及任何 reLaunch 之后的落地页。
			本项目 pages.json 里 globalStyle.navigationStyle = "custom"，所有页面都没有微信原生
			导航栏，返回完全依赖这个自绘 navbar，所以一旦失败用户就彻底出不去。
			这里改为由 handleBack 走 utils/nav.js 的安全返回：能返回就返回，不能回就回 tabBar 页。
		-->
		<u-navbar :leftIcon="leftIcon" :leftText="leftText" :title="title" :autoBack="false" :custom="custom"
			:bgColor="bgColor" placeholder="true" :titleStyle="titleStyle" :leftIconSize="leftIconSize"
			:leftIconColor="leftIconColor" @leftClick="handleBack" v-else="custom">

		</u-navbar>


	</view>
</template>

<script>
	import {
		mapState,
	} from 'vuex'
	import { goBack } from '@/utils/nav.js'
	export default {
		name: "my-navbar",
		props: {
			leftText: {
				default: ' ',
				type: String
			},
			title: {
				default: " ",
				type: String
			},
			custom: {
				default: false,
				type: Boolean
			},
			autoBack: {
				default: true,
				type: Boolean
			},
			bgColor: {
				default: "#f8f8f8",
				type: String
			},
			leftIcon: {
				default: "",
				type: String
			},
			show: {
				default: false,
				type: Boolean
			},
			titleStyle: {
				type: [String, Object],
				default: uni.$u.props.navbar.titleStyle
			},
			// 左侧返回图标的大小
			leftIconSize: {
				type: [String, Number],
				default: uni.$u.props.navbar.leftIconSize
			},
			// 左侧返回图标的颜色
			leftIconColor: {
				type: String,
				default: uni.$u.props.navbar.leftIconColor
			},
			storeName: {
				type: String,
				default: '请选择门店'
			}
		},
		data() {
			return {};
		},
		computed: {
			...mapState(['store'])
		},
		methods: {
			showMenu() {
				// this.show = true
				console.log("navbar showMenu " + this.show)

				this.$emit('changeShow')

			},
			leftClick() {
				console.log("navbar")
				this.$emit('leftClick')
			},
			// 统一的安全返回（原因见本文件模板顶部注释与 utils/nav.js）
			handleBack() {
				// autoBack=false 的页面（三个 tabBar 页）不接管左侧点击
				if (!this.autoBack) return
				goBack()
			}
		},
		mounted() {
			console.log("mounted")
		}
	}
</script>

<style lang="scss">
	/* 组件 wxss 不允许使用 page 标签选择器（微信小程序会报 Some selectors are not allowed in component wxss），
	   页面背景色由各页面自己控制 */
	.u-page {
		padding: 0;
		flex: 1;
		background-color: $u-bg-color;

		&__item {

			&__title {
				color: $u-tips-color;
				background-color: $u-bg-color;
				padding: 15px;
				font-size: 15px;

				&__slot-title {
					color: $u-primary;
					font-size: 14px;
				}
			}
		}
	}

	.u-nav-slot {
		@include flex;

		align-items: center;
		justify-content: space-between;
		border-width: 0.5px;
		border-radius: 100px;
		border-color: $u-border-color;
		padding: 3px 7px;
		opacity: 0.8;
	}

	.my-text {
		color: #000000 !important;
		opacity: 1 !important;
	}
</style>
