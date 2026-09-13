<template>
	<view>
		<my-navbar title="座位设备控制" :custom="false" :autoBack="true"></my-navbar>
		<view class="container">
			<!-- 头部卡片 -->
			<view class="header-card">
				<view class="header-top">
					<u-row align="center">
						<u-col span="8">
							<u-text :bold="true" size="34" color="#1a1a1a" :text="'座位 ' + seatNum" />
							<view style="height: 12rpx;"></view>
							<u-text size="24" color="#999" text="预约成功后可使用下方开关控制座位设备" />
						</u-col>
						<u-col span="4" textAlign="right">
							<view class="status-dot" :class="onlineStatus">
								<view class="dot-inner"></view>
							</view>
							<u-text size="22" color="#52c41a" text="在线" v-if="onlineStatus === 'online'" />
							<u-text size="22" color="#999" text="离线" v-else />
						</u-col>
					</u-row>
				</view>
				<view class="header-stats">
					<u-row>
						<u-col span="6">
							<view class="stat-item">
								<u-text :bold="true" size="36" color="#35a5ed" :text="devices.length + ''" />
								<u-text size="22" color="#888" text="设备总数" />
							</view>
						</u-col>
						<u-col span="6">
							<view class="stat-item">
								<u-text :bold="true" size="36" color="#52c41a" :text="onlineCount + ''" />
								<u-text size="22" color="#888" text="已开启" />
							</view>
						</u-col>
					</u-row>
				</view>
			</view>

			<!-- 自动控制指示器 -->
			<view class="auto-section" :class="{ 'auto-active': autoControl }">
				<view class="auto-row">
					<view class="auto-left">
						<view class="auto-icon">
							<u-icon :name="autoControl ? 'checkmark-circle' : 'clock'" 
								:color="autoControl ? '#35a5ed' : '#ccc'" size="40" />
						</view>
						<view class="auto-info">
							<u-text :bold="true" size="28" color="#333" text="自动控制" />
							<view style="height: 4rpx;"></view>
							<u-text size="22" :color="autoControl ? '#35a5ed' : '#bbb'" 
								:text="autoControl ? '已开启 - 签到自动开, 签退自动关' : '已关闭'" />
						</view>
					</view>
					<u-switch v-model="autoControl" @change="toggleAuto" activeColor="#35a5ed" />
				</view>
			</view>

			<!-- 设备列表 -->
			<view class="device-section">
				<view class="section-title-bar">
					<u-text :bold="true" size="30" color="#333" text="设备列表" />
					<u-text size="22" color="#ccc" :text="'共 ' + devices.length + ' 个设备'" />
				</view>

				<view v-if="devices.length === 0" class="empty-state">
					<u-empty text="未绑定设备" mode="list" />
					<view style="height: 16rpx;"></view>
					<u-text size="24" color="#aaa" text="请联系管理员为座位配置IoT设备" align="center" />
				</view>

				<view class="device-item" v-for="device in devices" :key="device.deviceId"
					:class="{ 'device-on': device.status === 2 }">
					<u-row align="center">
						<u-col span="2">
							<view class="device-icon-wrap">
								<u-icon :name="getDeviceIcon(device.deviceType)" size="44"
									:color="device.status === 2 ? '#35a5ed' : '#ccc'" />
							</view>
						</u-col>
						<u-col span="6">
							<u-text :bold="true" size="28" color="#333" :text="device.deviceName" />
							<view style="height: 6rpx;"></view>
							<view class="device-status">
								<view class="status-indicator" 
									:class="{ 'green': device.status === 2, 'gray': device.status !== 2 }">
								</view>
								<u-text size="22" :color="statusColor(device.status)" :text="statusText(device.status)" />
							</view>
						</u-col>
						<u-col span="4" textAlign="right">
							<u-switch :modelValue="device.status === 2" 
								@change="(val) => toggleDevice(device, val)"
								activeColor="#35a5ed"
								:loading="loadingId === device.deviceId"
								:disabled="loadingId === device.deviceId" />
						</u-col>
					</u-row>
				</view>
			</view>

			<!-- 快速操作 -->
			<view class="quick-actions">
				<u-button type="primary" @click="turnOnAll" :loading="loadingAll" 
					text="一键开启全部" color="#35a5ed" shape="circle" />
				<view style="height: 20rpx;"></view>
				<u-button type="default" @click="turnOffAll" :loading="loadingAll" 
					text="一键关闭全部" shape="circle" />
			</view>
		</view>
	</view>
</template>

<script>
	import { getSeatDevices, controlDevice, seatPowerOn, seatPowerOff } from '@/config/api.js';
	export default {
		data() {
			return {
				seatId: '',
				seatNum: '',
				devices: [],
				autoControl: true,
				loadingId: null,
				loadingAll: false
			}
		},
		computed: {
			onlineStatus() {
				const online = this.devices.some(d => d.status === 1 || d.status === 2)
				return online ? 'online' : 'offline'
			},
			onlineCount() {
				return this.devices.filter(d => d.status === 2).length
			}
		},
		methods: {
			getDeviceIcon(type) {
				// 使用 uview 内置字体图标, 避免本地图片缺失导致 404
				const icons = {
					'LIGHT': 'star',
					'PLUG': 'grid',
					'AC': 'play-circle'
				};
				return icons[type] || 'grid';
			},
			statusColor(status) {
				const colors = { 0: '#999', 1: '#52c41a', 2: '#35a5ed', 3: '#888' };
				return colors[status] || '#999';
			},
			statusText(status) {
				const texts = { 0: '离线', 1: '在线', 2: '运行中', 3: '已关闭' };
				return texts[status] || '未知';
			},
			async loadDevices() {
				try {
					const res = await getSeatDevices({ seatId: this.seatId }, {
						custom: { auth: true, catch: true }
					});
					if (res && res.data) {
						this.devices = res.data;
					}
				} catch (e) {
					console.error('加载设备失败', e);
				}
			},
			async toggleDevice(device, turnOn) {
				this.loadingId = device.deviceId;
				try {
					const res = await controlDevice({
						deviceId: device.deviceId,
						turnOn: turnOn
					}, { custom: { auth: true, catch: true } });
					if (res && res.code === 200) {
						device.status = turnOn ? 2 : 3;
						uni.$u.toast(turnOn ? '已开启' : '已关闭');
					} else {
						uni.$u.toast('操作失败');
					}
				} catch (e) {
					uni.$u.toast('设备控制失败');
				} finally {
					this.loadingId = null;
				}
			},
			async toggleAuto(val) {
				this.autoControl = val;
				uni.setStorageSync('deviceAutoControl', val);
				uni.$u.toast(val ? '自动控制已开启' : '自动控制已关闭');
			},
			async turnOnAll() {
				this.loadingAll = true;
				try {
					await seatPowerOn({ seatId: this.seatId }, { custom: { auth: true, catch: true } });
					this.devices.forEach(d => { d.status = 2; });
					uni.$u.toast('全部已开启');
				} catch (e) {
					uni.$u.toast('操作失败');
				} finally {
					this.loadingAll = false;
				}
			},
			async turnOffAll() {
				this.loadingAll = true;
				try {
					await seatPowerOff({ seatId: this.seatId }, { custom: { auth: true, catch: true } });
					this.devices.forEach(d => { d.status = 3; });
					uni.$u.toast('全部已关闭');
				} catch (e) {
					uni.$u.toast('操作失败');
				} finally {
					this.loadingAll = false;
				}
			}
		},
		onLoad(options) {
			this.seatId = options.seatId || '';
			this.seatNum = options.seatNum || '';
			const saved = uni.getStorageSync('deviceAutoControl');
			if (saved != null && saved !== '') {
				this.autoControl = saved;
			}
			if (this.seatId) {
				this.loadDevices();
			}
		}
	}
</script>

<style lang="scss">
	.container {
		margin: 20rpx 30rpx;
		padding-bottom: 40rpx;
	}

	// 头部卡片
	.header-card {
		background: #fff;
		border-radius: 24rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
	}

	.status-dot {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 6rpx;

		.dot-inner {
			width: 16rpx;
			height: 16rpx;
			border-radius: 50%;
			background: #ccc;
		}

		&.online .dot-inner {
			background: #52c41a;
			box-shadow: 0 0 8rpx rgba(82, 196, 26, 0.4);
		}
	}

	.header-stats {
		margin-top: 24rpx;
		padding-top: 20rpx;
		border-top: 2rpx solid #f5f5f5;

		.stat-item {
			text-align: center;
		}
	}

	// 自动控制
	.auto-section {
		background: #fff;
		border-radius: 24rpx;
		padding: 28rpx 30rpx;
		margin-bottom: 20rpx;
		border: 2rpx solid #f0f0f0;
		transition: all 0.3s;

		&.auto-active {
			border-color: #d0ebff;
			background: linear-gradient(135deg, #f0f9ff, #fff);
		}

		.auto-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
		}

		.auto-left {
			display: flex;
			align-items: center;
		}

		.auto-icon {
			margin-right: 16rpx;
		}

		.auto-info {
			flex: 1;
		}
	}

	// 设备列表
	.device-section {
		background: #fff;
		border-radius: 24rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);

		.section-title-bar {
			display: flex;
			justify-content: space-between;
			align-items: center;
			margin-bottom: 20rpx;
			padding-bottom: 16rpx;
			border-bottom: 2rpx solid #f5f5f5;
		}

		.device-item {
			padding: 24rpx 0;
			border-bottom: 2rpx solid #f8f8f8;
			transition: background 0.2s;
			border-radius: 12rpx;

			&:last-child {
				border-bottom: none;
			}

			&.device-on {
				background: #f8fbff;
				margin: 4rpx -12rpx;
				padding: 24rpx 12rpx;
			}
		}

		.device-icon-wrap {
			background: #f5f5f5;
			width: 72rpx;
			height: 72rpx;
			border-radius: 16rpx;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.device-status {
			display: flex;
			align-items: center;

			.status-indicator {
				width: 10rpx;
				height: 10rpx;
				border-radius: 50%;
				margin-right: 8rpx;

				&.green { background: #35a5ed; }
				&.gray { background: #ccc; }
			}
		}
	}

	.empty-state {
		padding: 40rpx 0;
	}

	// 快速操作
	.quick-actions {
		margin-top: 20rpx;
	}
</style>
