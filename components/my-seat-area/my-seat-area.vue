<template>
	<view>
		<u-text :bold="true" size="28" color="#35a5ed" :text="areaLabel" align="center" />
	</view>
</template>

<script>
	export default {
		name: "my-seat-area",
		props: {
			areaNum: {
				type: Number
			},
			cardType: {
				type: Number,
				default: null
			}
		},
		computed: {
			areaLabel() {
				// 与预约接口使用同一字段 cardType: 0 是有效的「两区通用」，不能用 || 回退。
				// 文案与后台卡券管理的下拉选项保持一致(仅经济区 / 仅沉浸区 / 两区通用)。
				if (this.cardType != null) {
					if (this.cardType === 0) return '两区通用'
					if (this.cardType === 1) return '仅沉浸区'
					if (this.cardType === 2) return '仅经济区'
					return '请查看卡券说明'
				}
				// 旧数据没有 cardType 时退回旧字段 usable(1=舒适/沉浸区, 0=经济区)
				return this.areaNum === 1 ? '仅沉浸区' : '仅经济区'
			}
		}
	}
</script>

<style>

</style>
