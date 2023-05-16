/*
* 内蒙obu连接蓝牙激活
 */
const util = require('../../../../utils/util.js');
const bleUtil = require('../../../../libs/neimeng_artc_sdk/artcBleUtil.js');
const dataUtil = require('../../../../libs/neimeng_artc_sdk/artcDataUtil.js');
const dataHandler = require('../../../../libs/neimeng_artc_sdk/artcDataHandler.js');
const app = getApp();
let timer;
Page({
	data: {
		showLoading: 1,	// 是否显示搜索中
		getListFailed: 0,	// 获取obu设备
		deviceName: undefined,	// 设备名称
		connectState: -1,	// 是否已连接 默认连接中 1 已连接 2 连接失败
		isActivating: 0,	// 是否激活
		rand: undefined,	// OBU 序列号
		version: undefined,	// 版本
		startTime: undefined,	// 合同开始日期
		endTime: undefined,	// 合同结束如期
		carInfoFromCard: undefined,	// 卡片中的车辆信息 明文
		carInfoFromOBU: undefined,	// 设备中的车辆信息 密文
		errMsg: '',
		msg: '',
		activated: 0
	},
	onLoad () {
		this.start();
	},
	returnMiniProgram () {
		util.returnMiniProgram();
	},
	start () {
		this.openBluetooth();
		// 搜索倒计时
		timer = setTimeout(() => {
			wx.closeBluetoothAdapter();
			this.setData({showLoading: 0, getListFailed: 1});
			this.isOver();
		}, 15000);
	},
	// 开启蓝牙
	openBluetooth () {
		wx.openBluetoothAdapter({
			success: () => {
				bleUtil.scanBleDevice((code, device, msg) => {
					let name = device.name;
					if (name.length === 0) {
						name = device.localName;
					} else {
						name = device.name;
					}
					console.log(name);
					if (name === 'GXETC_ARTC' || name === 'Artc_Wechat' || name.startsWith('GS') || name.startsWith('NM') || name.startsWith('AT')) {
						timer && clearTimeout(timer);
						this.setData({
							deviceName: name,
							showLoading: 0,
							getListFailed: 0
						});
						console.log(device);
						bleUtil.connectBleDevice(device.deviceId, (code) => {
							// 0 表示连接成功
							this.setData({
								connectState: code === 0 ? 1 : 2
							});
						});
					} else {
						this.setData({getListFailed: 1});
					}
				});
			},
			fail: (res) => {
				this.setData({getListFailed: 1, showLoading: 0});
			}
		});
	},
	// 点击按钮
	go () {
		// 激活
		if (this.data.connectState !== 1 && this.data.getListFailed) {
			wx.uma.trackEvent('activation_failed_retry');
		}
		if (this.data.connectState === 1) {
			if (this.data.isActivating) return;
			this.setData({isActivating: 1, errMsg: '', msg: '读取设备中...'});
			this.activating();
		} else {
			this.setData({showLoading: 1, getListFailed: 0, connectState: -1, errMsg: ''});
			this.start();
		}
	},
	// 重置
	isOver (errMsg) {
		this.setData({isActivating: 0});
		errMsg && this.setData({errMsg});
	},
	// 激活
	activating () {
		let obj = wx.getStorageSync('activate-info');
		if (!obj) {
			this.setData({isActivating: 0});
			this.isOver('车辆信息不存在');
			return;
		}
		// 读合同序列号
		this.getObuNo();
		// // 获取obuid
		// this.readOBUID();
	},
	// // 读取obu编号（疑似废弃
	// readOBUID () {
	// 	this.setData({msg: '获取OBUID中...'});
	// 	bleUtil.sendDataToDevice(dataUtil.makeA5SendData('c0'), (code, data, msg) => {
	// 		if (code === 0 && data.slice(2, 4) === '00') {
	// 			try {
	// 				let idInfo = data.slice(8);
	// 				let obuId = '';
	// 				for (let i = 0; i < parseInt(idInfo.length / 2); i++) {
	// 					let bit = parseInt(idInfo.slice(i * 2, (i + 1) * 2), 16);
	// 					let num = +(bit ^ 0x30);
	// 					obuId += num;
	// 				}
	// 				this.setData({
	// 					obuid: obuId
	// 				});
	// 				this.getObuNo();
	// 			} catch (e) {
	// 				this.isOver('激活失败，请重试');
	// 			}
	// 		} else {
	// 			this.isOver('获取obuid失败');
	// 		}
	// 	});
	// },
	// 读合同序列号
	getObuNo () {
		this.setData({msg: '获取序列号中...'});
		// 将apdu指令组成协议需求的TLV格式
		let tlv = dataHandler.makeTLV(['00a40000023f00', '00b081001b']);
		// 通过makeA8SendData接口组成发送数据，调用接口发送
		bleUtil.sendDataToDevice(dataUtil.makeA8SendData('00', tlv), (code, data, msg) => {
			// 判断code = 0是确认发送并返回过程成功，data.slice(2,4) = 00判断apdu指令是不是全部执行成功，固定格式判断就行，不用在意
			if (code === 0 && data.slice(2, 4) === '00') {
				try {
					// 指令全部执行成功，截取10到最后的TLV格式数据解析
					let retlv = data.slice(10);
					// 解析返回的tlv数据，获得对应发送apdu指令执行返回的数据
					let reapdu = dataHandler.resolveTLV(retlv);
					// 以上第一个指令是选目录，第二个是读系统文件数据，取第二数据解析
					let info = reapdu[1];
					// 版本
					let version = info.slice(18, 20);
					// 截取合同号
					let rand = info.slice(20, 36);
					// 合同开始日期
					let startTime = info.slice(36, 44);
					// 合同结束日期
					let endTime = info.slice(44, 52);
					// 设备序列号
					this.setData({
						version,
						rand,
						startTime,
						endTime
					});
					// 获取随机数
					this.getCarInfoFromCard();
				} catch (e) {
					this.isOver('激活失败，请重试');
				}
			} else {
				this.error(data, '获取设备序列号失败，错误码：');
			}
		});
	},
	// 从卡片中获取车辆信息 明文
	getCarInfoFromCard () {
		this.setData({msg: '获取车辆信息中...'});
		let tlv = dataHandler.makeTLV(['00A40000023F00', '00A40000021001', '00B095002b']);
		bleUtil.sendDataToDevice(dataUtil.makeA3SendData('00', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				try {
					let retlv = data.slice(10);
					let reapdu = dataHandler.resolveTLV(retlv);
					let info = reapdu[2]; // 卡中的车辆信息
					this.setData({
						carInfoFromCard: info
					});
					this.getRandomForReadCarInfoFromOBU();
				} catch (e) {
					this.isOver('激活失败，请重试');
				}
			} else {
				this.error(data, '获取卡片中的车辆信息失败，错误码：');
			}
		});
	},
	// 为读取OBU中车辆信息获取随机数
	getRandomForReadCarInfoFromOBU () {
		let tlv = dataHandler.makeTLV(['00A4000002DF01', '0084000004']);
		bleUtil.sendDataToDevice(dataUtil.makeA8SendData('00', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				try {
					let retlv = data.slice(10);
					let reapdu = dataHandler.resolveTLV(retlv);
					let info = reapdu[1];
					let random = info.substring(0, 8).toUpperCase();
					this.getCarInfoFromObu(random);
				} catch (e) {
					this.isOver('激活失败，请重试');
				}
			} else {
				this.error(data, '获取设备随机数错误，错误码：');
			}
		});
	},
	// 读取车牌信息
	getCarInfoFromObu (random) {
		this.setData({msg: '获取车牌信息中...'});
		let tlv = dataHandler.makeTLV([`00B400000A${random}000000004F00`]);
		bleUtil.sendDataToDevice(dataUtil.makeA8SendData('00', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				try {
					let retlv = data.slice(10);
					let reapdu = dataHandler.resolveTLV(retlv);
					let info = reapdu[0];
					info = info.substring(0, info.length - 4);
					this.setData({
						carInfoFromOBU: info
					});
					this.getRandomForActivate();
				} catch (e) {
					this.isOver('激活失败，请重试');
				}
			} else {
				this.error(data, '获取设备车辆中的车辆信息失败，错误码：');
			}
		});
	},
	// 获取激活obu随机数
	getRandomForActivate () {
		let tlv = dataHandler.makeTLV(['00A40000023F00', '0084000004']);
		bleUtil.sendDataToDevice(dataUtil.makeA8SendData('00', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				try {
					let retlv = data.slice(10);
					let reapdu = dataHandler.resolveTLV(retlv);
					let info = reapdu[1];
					let random = info.substring(0, 8).toUpperCase();
					this.requestServer(random);
				} catch (e) {
					this.isOver('激活失败，请重试');
				}
			} else {
				this.error(data, '获取卡片中的车辆信息失败，错误码：');
			}
		});
	},
	// 传递数据到服务器
	async requestServer (random) {
		this.setData({msg: '请求中...'});
		let obj = wx.getStorageSync('activate-info');
		obj = JSON.parse(obj);
		const params = {
			serialNumber: this.data.rand,
			obuContent: this.data.carInfoFromOBU,
			content: this.data.carInfoFromCard,
			random,
			obuId: this.data.rand,
			contractVersion: this.data.version,
			startTime: this.data.startTime,
			expireTime: this.data.endTime,
			vehPlate: obj.carNo
		};
		let res = await util.getDataFromServersV2('consumer/etc/nmg/common/cardonline/to-activate-obu',params);
		if (res.code === 0) {
			// 激活obu
			this.sendToActivate(res);
		} else {
			this.isOver(res.message);
		}
	},
	// 激活obu
	sendToActivate (res) {
		this.setData({msg: '激活中...'});
		let tlv = dataHandler.makeTLV([res.data.FileData + res.data.Mac]);
		bleUtil.sendDataToDevice(dataUtil.makeA8SendData('00', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				try {
					let retlv = data.slice(10);
					let result = dataHandler.resolveTLV(retlv)[0];
					if (result === '9000') {
						// 调用确认接口
						this.requestServerForComfirm();
					} else {
						this.isOver('激活失败，请重试');
					}
				} catch (e) {
					this.isOver('激活失败，请重试');
				}
			} else {
				this.error(data, '激活失败，错误码：');
			}
		});
	},
	// 确认
	async requestServerForComfirm () {
		this.setData({msg: '确认中...'});
		let obj = wx.getStorageSync('activate-info');
		obj = JSON.parse(obj);
		const params = {
			serialNumber: this.data.rand,
			obuId: this.data.rand,
			vehPlate: obj.carNo
		};
		let res = await util.getDataFromServersV2('consumer/etc/nmg/common/cardonline/to-confirm-obu',params);
		if (res.code === 0) {
			wx.uma.trackEvent('activate_the_success');
			this.setData({msg: '', activated: 1});
		} else {
			this.isOver(res.message);
		}
	},
	// 错误提示
	error (data, text) {
		// 截取返回的tlv
		let retlv = data.slice(10);
		// 解析返回tlv
		let reapdu = dataHandler.resolveTLV(retlv);
		// 取解析出来最后的apdu指令执行返回数据
		let lastItem = reapdu[reapdu.length - 1];
		// 获得最后一个指令的执行错误码
		let errCode = lastItem.slice(-4);
		this.isOver(`${text}${errCode}`);
	},
	onHide () {
		wx.closeBluetoothAdapter();
	}
});
