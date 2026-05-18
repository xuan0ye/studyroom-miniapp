<template>
	<view>
		<my-navbar title="座位设备控制" :custom="false" :autoBack="true"></my-navbar>
		<view class="container">
			<view class="header-card">
				<u--text :bold="true" size="32" :text="'座位: ' + seatNum" />
				<view style="height: 10rpx;"></view>
				<u--text size="26" color="#888" text="预约成功后可使用下方开关控制座位设备" />
			</view>

			<!-- 自动控制开关 -->
			<view class="auto-section">
				<view class="auto-row">
					<view>
						<u--text :bold="true" size="30" text="自动控制" />
						<view style="height: 6rpx;"></view>
						<u--text size="24" color="#888" text="预约开始自动开, 预约结束自动关" />
					</view>
					<u-switch v-model="autoControl" @change="toggleAuto" activeColor="#35a5ed" />
				</view>
			</view>

			<!-- 设备列表 -->
			<view class="device-section">
				<view class="section-title">
					<u--text :bold="true" size="28" text="设备列表" />
				</view>
				<view v-if="devices.length === 0" class="empty-state">
					<u-empty text="未绑定设备" mode="list" />
					<u--text size="24" color="#aaa" text="请联系管理员为座位配置IoT设备" align="center" />
				</view>
				<view class="device-item" v-for="device in devices" :key="device.deviceId">
					<u-row align="center">
						<u-col span="2">
							<u-icon :name="getDeviceIcon(device.deviceType)" size="50"
								:color="device.status === 2 ? '#ff9800' : '#ccc'" />
						</u-col>
						<u-col span="6">
							<u--text :bold="true" size="28" :text="device.deviceName" />
							<view style="height: 6rpx;"></view>
							<u--text size="22" :color="statusColor(device.status)" :text="statusText(device.status)" />
						</u-col>
						<u-col span="4" textAlign="right">
							<u-switch :modelValue="device.status === 2" @change="(val) => toggleDevice(device, val)"
								activeColor="#35a5ed"
								:loading="loadingId === device.deviceId"
								:disabled="loadingId === device.deviceId" />
						</u-col>
					</u-row>
				</view>
			</view>

			<!-- 快速操作 -->
			<view class="quick-actions">
				<u-button type="primary" @click="turnOnAll" :loading="loadingAll" text="一键开启全部" color="#35a5ed" />
				<view style="height: 20rpx;"></view>
				<u-button type="default" @click="turnOffAll" :loading="loadingAll" text="一键关闭全部" />
			</view>

			<!-- 设置说明 -->
			<view class="setup-guide">
				<u--text :bold="true" size="28" text="如何配置设备？" />
				<view style="margin-top: 20rpx; font-size: 22rpx; line-height: 40rpx; color: #888;">
					<p>1. 将智能插座/开关接入米家APP</p>
					<p>2. 安装Home Assistant并添加小米设备集成</p>
					<p>3. 在Home Assistant中获取设备entity_id</p>
					<p>4. 在后台系统中为座位配置对应的设备ID</p>
					<p>5. 推荐使用小米智能插座 + 台灯的组合</p>
				</view>
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
		methods: {
			getDeviceIcon(type) {
				const icons = {
					'LIGHT': 'https://cdn-icons-png.flaticon.com/128/702/702797.png',
					'PLUG': 'https://cdn-icons-png.flaticon.com/128/25/25694.png',
					'AC': 'https://cdn-icons-png.flaticon.com/128/3033/3033322.png'
				};
				return icons[type] || icons.PLUG;
			},
			statusColor(status) {
				const colors = { 0: '#999', 1: '#52c41a', 2: '#ff9800', 3: '#888' };
				return colors[status] || '#999';
			},
			statusText(status) {
				const texts = { 0: '离线', 1: '在线', 2: '已开启', 3: '已关闭' };
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
			},
			async turnOnAll() {
				this.loadingAll = true;
				try {
					await seatPowerOn({ seatId: this.seatId });
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
					await seatPowerOff({ seatId: this.seatId });
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
		margin: 20rpx;
	}
	.header-card {
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
	}
	.auto-section {
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		.auto-row {
			display: flex;
			justify-content: space-between;
			align-items: center;
		}
	}
	.device-section {
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-bottom: 20rpx;
		.section-title {
			margin-bottom: 20rpx;
		}
		.device-item {
			padding: 20rpx 0;
			border-bottom: 1rpx solid #f5f5f5;
			&:last-child {
				border-bottom: none;
			}
		}
	}
	.quick-actions {
		margin: 20rpx 0;
	}
	.setup-guide {
		background: #fff;
		border-radius: 20rpx;
		padding: 30rpx;
		margin-top: 30rpx;
		margin-bottom: 60rpx;
	}
</style>
