const app = getApp();
const util = require('../../../../utils/util.js');
const bleUtil = require('../../../../libs/neimeng_mc_new_sdk/BleUtil.js');
let timer;
const SUCCESS_CODE = '0';
const FAILED_CODE = '1';
Page({

	data: {
		showLoading: 1,	// 是否显示搜索中
		getListFailed: 0,	// 获取obu设备
		deviceName: undefined,	// 设备名称
		connectState: -1,	// 是否已连接 默认连接中 1 已连接 2 连接失败
		isActivating: 0,	// 是否激活
		idInfo: undefined,	// 物理号
		cardType: undefined,	// 卡类型
		cardVersion: undefined,	// 卡版本
		faceCardNumber: undefined,	// 卡表面号
		IssuerMarking: undefined,	//  发行方标示
		protocolType: undefined,	// 协议类型
		contractVersion: undefined,	// 合同版本
		contractNumber: undefined,	// 合同序列号
		startTime: undefined,	// 合同开始时间
		endTime: undefined,	// 合同结束时间
		host: '',
		errMsg: '',
		msg: '',
		activated: 0,
		alertNum: 0,
		isUnload: 0,
		queryAntennacmd: 4,	// 查询天线状态指令 1：打开 5.8G 天线;2：关闭 5.8G 天线一段时间（最长 5 分钟）；3：关闭 5.8G 功能 ；4：获取 5.8G 天线的打开/关闭状态；
		antennaStatus: -1	// 天线状态 默认:-1 ;关闭: 0;开启: 1
	},

	onLoad (options) {
		wx.closeBluetoothAdapter();
		this.start();
	},

	onShow () {

	},

	handleRetry () {
		bleUtil.disConnect({
			success: res => {
				console.log(res);
				wx.closeBluetoothAdapter();
			},
			fail: res => {
				console.log(res);
				wx.closeBluetoothAdapter();
			}
		}, 15000);
		this.setData({
			alertNum: 0,
			showLoading: 1,	// 是否显示搜索中
			getListFailed: 0,	// 获取obu设备
			deviceName: undefined,	// 设备名称
			connectState: -1,	// 是否已连接 默认连接中 1 已连接 2 连接失败
			isActivating: 0,	// 是否激活
			idInfo: undefined,	// 物理号
			cardType: undefined,	// 卡类型
			cardVersion: undefined,	// 卡版本
			faceCardNumber: undefined,	// 卡表面号
			IssuerMarking: undefined,	//  发行方标示
			protocolType: undefined,	// 协议类型
			contractVersion: undefined,	// 合同版本
			contractNumber: undefined,	// 合同序列号
			startTime: undefined,	// 合同开始时间
			endTime: undefined,	// 合同结束时间
			host: '',
			errMsg: '',
			msg: '',
			activated: 0
		});
		this.start();
	},

	start () {
		this.openBluetooth();
		// 搜索倒计时
		timer = setTimeout(() => {
			this.setData({showLoading: 0, getListFailed: 1});
			this.isOver();
		}, 15000);
	},

	// 开启蓝牙
	openBluetooth () {
		this.setData({msg: '搜索过程中请勿关闭小程序'});
		// 所有操作失败的回调
		const failed = () => { this.setData({showLoading: 0, getListFailed: 1}); };
		// 打开蓝牙适配器
		const openBle = () => {
			this.openBle(code => {
				if (+code) { failed(); } else { scanBle(); }	// 搜索 OBU 设备
			});
		};
		// 搜索 OBU 设备
		const scanBle = () => {
			this.scanBle(device => {
				if (+device === 1) return failed();
				console.log('搜索到设备：', device);
				clearTimeout(timer);
				this.setData({
					deviceName: device.name,
					showLoading: 0,
					getListFailed: 0
				});
				connectBle(device);	// 连接 OBU 设备
			});
		};
		// 连接 OBU 设备
		const connectBle = device => {
			wx.stopBluetoothDevicesDiscovery({
				success: res => {
					console.log('停止搜索');
					bleUtil.connectAndInit(device, {
						success: res => {
							console.log('连接 & 部署设备成功');
							this.setData({
								connectState: 1,
								getListFailed: 0
							});
							this.setData({msg: 'OBU连接成功'});
							const that = this;
							this.switchAntenna(this.data.queryAntennacmd);
							wx.onBLEConnectionStateChange(function (res) {
								if (that.data.activated || that.data.isUnload || res.connected) {
									return;
								}
								that.setData({
									alertNum: that.data.alertNum + 1
								});
							});
						},
						fail: res => {
							console.warn('连接 & 部署设备失败: ', res);
							this.setData({
								connectState: 2,
								getListFailed: 0
							});
							this.setData({errMsg: 'OBU连接失败'});
						}
					}, 15000);
				}
			});
		};
		wx.openBluetoothAdapter({fail: failed, success: openBle});
	},

	openBle (callback) {
		wx.openBluetoothAdapter({
			success (res) {
				typeof callback === 'function' && callback(SUCCESS_CODE);
			},
			fail () {
				typeof callback === 'function' && callback(FAILED_CODE);
			}
		});
	},

	// 重置
	isOver (errMsg) {
		this.setData({isActivating: 0});
		errMsg && this.setData({errMsg});
	},

	scanBle (callback) {
		let list = [];
		wx.startBluetoothDevicesDiscovery({
			success (res) {
				wx.onBluetoothDeviceFound((res) => {
					for (let i = 0; i < res.devices.length; i++) {
						let isHave = false;
						for (let j = 0; j < list.length; j++) {
							if (res.devices[i].deviceId === list[j].deviceId) {
								isHave = true;
								break;
							}
						};
						if (!isHave) {
							console.log(res.devices[i].localName);
							if (/NM|HN/.test(res.devices[i].name)) {
								list.push(res.devices[i]);
								callback(res.devices[i]);
							}
						}
					}
				});
			},
			fail () {
				typeof callback === 'function' && callback(FAILED_CODE);
			}
		});
	},

	go () {
		if (this.data.connectState === 1) {
			if (this.data.isActivating) return;
			this.setData({
				isActivating: 1,
				errMsg: '',
				msg: '正在执行中...',
				queryAntennacmd: this.data.antennaStatus ? this.data.antennaStatus === -1 ? 4 : 3 : 1
			});
			this.switchAntenna(this.data.queryAntennacmd);
		} else {
			this.setData({showLoading: 1, getListFailed: 0, connectState: -1, errMsg: ''});
			this.start();
		}
	},

	// type 0: 卡；1: obu
	transCommand (type, arr, callback) {
		bleUtil.sendAndReceive(type, arr, {
			success: res => {
				console.log(arr, res);
				callback(0, res.data || []);
			},
			fail: res => {
				console.error(arr, res);
				callback(1, res.data || [], res.msg);
			}
		}, 15000);
	},

	sendA5Command () {
		try {
			bleUtil.sendA5Command('C5',{
				success: res => {
					console.log('物理卡号：', res);
					console.log('物理卡号：', JSON.stringify(res));
					this.setData({idInfo: res.data});
					// 读取合同信息
					// this.getContractInfo();
				},
				fail: res => {
					this.isOver('物理卡号获取失败');
					console.error('物理卡号获取失败：', res);
				}
			}, 15000);
		} catch (e) {
			this.isOver('设备版本过低，请联系工作人员');
		}
	},

	// 打开或关闭天线
	switchAntenna (status) {
		console.log('状态',status);
		bleUtil.openOrCloseAerial(status,300,{
			success: res => {
				console.log('天线状态：',res);
				if (res.code === 1000) {
					let antennaStatus = this.data.antennaStatus;
					antennaStatus = /c701/i.test(res.data) ? 1 : 0;
					this.setData({
						isActivating: 0,
						msg: '',
						antennaStatus
					});
				} else {
					this.setData({
						isActivating: 0,
						errMsg: res.msg
					});
				}
			},
			fail: res => {
				console.log('错误',res);
				if (res.code === 2002) {
					this.setData({errMsg: '系统繁忙，请稍后再试',isActivating: 0});
					return;
				}
				this.setData({errMsg: res.msg,isActivating: 0});
			}
		},15000);
	},

	onUnload () {

	}
});
