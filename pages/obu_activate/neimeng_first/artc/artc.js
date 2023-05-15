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
		showLoading: 1, // 是否显示搜索中
		getListFailed: 0, // 获取obu设备
		deviceName: undefined, // 设备名称
		connectState: -1, // 是否已连接 默认连接中 1 已连接 2 连接失败
		isActivating: 0, // 是否激活
		idInfo: undefined, // 物理号
		cardType: undefined, // 卡类型
		cardVersion: undefined, // 卡版本
		faceCardNumber: undefined, // 卡表面号
		IssuerMarking: undefined, //  发行方标示
		protocolType: undefined, // 协议类型
		contractVersion: undefined, // 合同版本
		contractNumber: undefined, // 合同序列号
		startTime: undefined,// 合同开始时间
		endTime: undefined, // 合同结束时间
		host: '',
		errMsg: '',
		msg: '',
		activated: 0
	},
	onLoad () {
		// // TODO TEST CODE
		// app.globalData.orderInfo.orderId = '638787874229059584';
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
						this.setData({deviceName: name, showLoading: 0, getListFailed: 0});
						console.log(device);
						bleUtil.connectBleDevice(device.deviceId, (code) => {
							// 0 表示连接成功
							this.setData({
								connectState: code === 0 ? 1 : 2,
								getListFailed: 0
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
			this.getPhyCardNum();
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
	// 读取物理卡号
	getPhyCardNum () {
		this.setData({msg: '读取信息中...'});
		bleUtil.sendDataToDevice(dataUtil.makeA5SendData('c5'), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				// 物理卡号
				let idInfo = data.slice(8);
				console.log('物理卡号：' + idInfo);
				this.cardSurfaceNumber(idInfo);
			} else {
				this.isOver('获取物理号失败');
			}
		});
	},
	// 读取卡片表面号
	cardSurfaceNumber (idInfo) {
		let tlv = dataHandler.makeTLV(['00A40000023F00', '00A40000021001', '00B095002b']);
		bleUtil.sendDataToDevice(dataUtil.makeA3SendData('00', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let reapdu = dataHandler.resolveTLV(retlv);
				let info = reapdu[2]; // 卡中的车辆信息
				console.log(info);
				let cardType = info.substring(16, 18);
				let cardVersion = info.substring(18, 20);
				let faceCardNumber = info.substring(20, 40);
				let cardId = faceCardNumber.slice(4);
				console.log('卡片类型：' + cardType);
				console.log('卡片版本：' + cardVersion);
				console.log('卡片表面号：' + faceCardNumber);
				// 物理卡号  卡片类型 卡片版本 卡片表面号
				this.getContractInfo(idInfo, cardType, cardVersion, faceCardNumber, cardId);
			} else {
				this.isOver('读取卡片信息失败');
			}
		});
	},
	// 获取合同信息 物理卡号  卡片类型 卡片版本
	getContractInfo (idInfo, cardType, cardVersion, faceCardNumber, cardId) {
		// 将apdu指令组成协议需求的TLV格式
		let tlv = dataHandler.makeTLV(['00a40000023f00', '00b081001b']);
		// 通过makeA8SendData接口组成发送数据，调用接口发送
		bleUtil.sendDataToDevice(dataUtil.makeA8SendData('00', tlv), (code, data, msg) => {
			// 判断code = 0是确认发送并返回过程成功，data.slice(2,4) = 00判断apdu指令是不是全部执行成功，固定格式判断就行，不用在意
			if (code === 0 && data.slice(2, 4) === '00') {
				// 指令全部执行成功，截取10到最后的TLV格式数据解析
				let retlv = data.slice(10);
				// 解析返回的tlv数据，获得对应发送apdu指令执行返回的数据
				let reapdu = dataHandler.resolveTLV(retlv);
				// 以上第一个指令是选目录，第二个是读系统文件数据，取第二数据解析
				let info = reapdu[1];

				let IssuerMarking = info.substring(0, 16);
				console.log('发行方标示：' + IssuerMarking);
				let protocolType = info.substring(16, 18);
				console.log('协议类型：' + protocolType);
				// 版本
				let contractVersion = info.slice(18, 20);
				console.log('合同版本：' + contractVersion);
				// 截取合同号
				let contractNumber = info.slice(20, 36);
				console.log('合同序列号：' + contractNumber);
				// 合同开始日期
				let startTime = info.slice(36, 44);
				console.log('合同开始日期：' + startTime);
				// 合同结束日期
				let endTime = info.slice(44, 52);
				console.log('合同结束日期：' + endTime);
				// 设置数据
				this.setData({
					idInfo: idInfo.toUpperCase(),
					cardType,
					cardVersion,
					faceCardNumber,
					cardId,
					IssuerMarking,
					protocolType,
					contractVersion,
					contractNumber,
					startTime,
					endTime
				});
				// 设备序列号
				this.getCurrentStep();
			} else {
				this.isOver('获取卡片信息失败');
			}
		});
	},

	// 通过picc通道获取8位随机数 0016
	get4BitRandomByPICCFor0016 () {
		console.log('写0016数据开始');
		this.setData({msg: '写入数据中...'});
		let tlv = dataHandler.makeTLV(['00A40000023F00', '0084000004']);
		bleUtil.sendDataToDevice(dataUtil.makeA3SendData('00', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let reapdu = dataHandler.resolveTLV(retlv);
				let info = reapdu[1];
				// 获取随机数
				let random = info.substring(0, 8).toUpperCase();
				console.log('0016-8位随机数：', random);
				this.requestTo0016(random);
			} else {
				this.isOver('获取随机数失败');
			}
		});
	},
	// 写入数据到卡
	async requestTo0016 (random) {
		let params = {
			FaceCardNum: this.data.cardId,
			CardType: this.data.cardType,
			Version: this.data.cardVersion,
			PhyCardNum: this.data.idInfo,
			Random: random,
			orderId: app.globalData.orderInfo.orderId
		};
		let res = await util.getDataFromServersV2('consumer/etc/nmg/common/cardonline/online-to-active',params);
		if (res.code === 0) {
			if (res.data.FileData && res.data.Mac) {
				this.writeDataToCardFor0016(res);
			} else {
				this.isOver();
				util.showToastNoIcon(res.data.description);
			}
		} else {
			this.isOver();
			util.showToastNoIcon(res.message);
		}
	},
	writeDataToCardFor0016 (res) {
		let tlv = dataHandler.makeTLV([res.data.FileData + res.data.Mac]);
		bleUtil.sendDataToDevice(dataUtil.makeA3SendData('00', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let result = dataHandler.resolveTLV(retlv)[0];
				if (result === '9000') {
					console.log('写0016数据正常结束');
					this.get4BitRandomByPICCFor0015();
				} else {
					this.isOver('写入0016数据失败，请重试!');
				}
			} else {
				this.isOver('写入0016数据失败，请重试!');
			}
		});
	},

	// 通过picc通道获取8位随机数 0015
	get4BitRandomByPICCFor0015 () {
		this.setData({msg: '写入数据中...'});
		console.log('写0015数据开始');
		let tlv = dataHandler.makeTLV(['00A40000021001', '0084000004']);
		bleUtil.sendDataToDevice(dataUtil.makeA3SendData('00', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let reapdu = dataHandler.resolveTLV(retlv);
				let info = reapdu[1];
				// 获取随机数
				let random = info.substring(0, 8).toUpperCase();
				console.log('0015-8位随机数：', random);
				this.requestTo0015(random);
			} else {
				this.isOver('获取随机数失败');
			}
		});
	},
	async requestTo0015 (random) {
		let params = {
			FaceCardNum: this.data.cardId,
			CardType: this.data.cardType,
			Version: this.data.cardVersion,
			PhyCardNum: this.data.idInfo,
			Random: random,
			nextInterface: 2,
			orderId: app.globalData.orderInfo.orderId
		};
		let res = await util.getDataFromServersV2('consumer/etc/nmg/common/cardonline/online-to-active',params);
		if (res.code === 0) {
			if (res.data.FileData && res.data.Mac) {
				this.writeDataToCardFor0015(res);
			} else {
				this.isOver();
				util.showToastNoIcon(res.data.description);
			}
		} else {
			this.isOver();
			util.showToastNoIcon(res.message);
		}
	},
	writeDataToCardFor0015 (res) {
		let tlv = dataHandler.makeTLV([res.data.FileData + res.data.Mac]);
		bleUtil.sendDataToDevice(dataUtil.makeA3SendData('00', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let result = dataHandler.resolveTLV(retlv)[0];
				if (result === '9000') {
					this.uploadOrderForCard();
				} else {
					this.isOver('写入0015数据失败，请重试!');
				}
			} else {
				this.isOver('写入0015数据失败，请重试!');
			}
		});
	},
	// 更新订单（卡发行）
	async uploadOrderForCard () {
		this.setData({msg: '更新订单中...'});
		let params = {
			FaceCardNum: this.data.cardId,
			CardType: this.data.cardType,
			orderId: app.globalData.orderInfo.orderId
		};
		let res = await util.getDataFromServersV2('consumer/etc/nmg/common/cardonline/card-writing-success',params);
		if (res.code === 0) {
			console.log('写0015数据正常结束');
			// 下一步：更新obu车辆信息
			this.get4BitRandomByESAMForWriteCarInfo();
		} else {
			this.isOver(res.message);
		}
	},

	// 通过esam通道获取8位随机数 写入车辆信息
	get4BitRandomByESAMForWriteCarInfo () {
		this.setData({msg: '写入数据中...'});
		console.log('写车辆数据开始');
		let tlv = dataHandler.makeTLV(['00A4000002DF01', '0084000004']);
		bleUtil.sendDataToDevice(dataUtil.makeA8SendData('00', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let reapdu = dataHandler.resolveTLV(retlv);
				let info = reapdu[1];

				// 获取随机数
				let random = info.substring(0, 8).toUpperCase();
				console.log('1001-8位随机数：', random);
				this.requestToWriteCarInfo(random);
			} else {
				this.isOver('获取随机数失败');
			}
		});
	},
	async requestToWriteCarInfo (random) {
		let params = {
			SerialNumber: this.data.contractNumber,
			ObuId: this.data.idInfo.toUpperCase(),
			Supplier: this.data.IssuerMarking,
			ContractType: this.data.protocolType,
			ContractVersion: this.data.contractVersion,
			Random: random,
			nextInterface: 3,
			orderId: app.globalData.orderInfo.orderId
		};
		let res = await util.getDataFromServersV2('consumer/etc/nmg/common/cardonline/card-writing-success',params);
		if (res.code === 0) {
			if (res.data.FileData && res.data.Mac) {
				this.writeDataToObuForCarInfo(res);
			} else {
				this.isOver(res.data.description);
			}
		} else {
			this.isOver(res.message);
		}
	},
	writeDataToObuForCarInfo (res) {
		let tlv = dataHandler.makeTLV([res.data.FileData + res.data.Mac]);
		bleUtil.sendDataToDevice(dataUtil.makeA8SendData('00', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let result = dataHandler.resolveTLV(retlv)[0];
				console.log(result);
				if (result === '9000') {
					console.log('写车辆数据正常结束');
					this.get4BitRandomByESAMForWriteSysInfo();
				} else {
					this.isOver('写入车辆信息失败，请重试!');
				}
			} else {
				this.isOver('写入车辆信息失败，请重试!');
			}
		});
	},

	// 通过esam通道获取8位随机数 写入车辆信息
	get4BitRandomByESAMForWriteSysInfo () {
		this.setData({msg: '写入数据中...'});
		console.log('写系统数据开始');
		let tlv = dataHandler.makeTLV(['00A40000023F00', '0084000004']);
		bleUtil.sendDataToDevice(dataUtil.makeA8SendData('00', tlv), (code, data, msg) => {
			console.log(data);
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let reapdu = dataHandler.resolveTLV(retlv);
				let info = reapdu[1];

				// 获取随机数
				let random = info.substring(0, 8).toUpperCase();
				console.log('3F00-8位随机数：', random);
				this.requestToWriteSysInfo(random);
			} else {
				this.isOver('获取随机数失败');
			}
		});
	},
	async requestToWriteSysInfo (random) {
		let params = {
			SerialNumber: this.data.contractNumber,
			ObuId: this.data.idInfo.toUpperCase(),
			Supplier: this.data.IssuerMarking,
			ContractType: this.data.protocolType,
			ContractVersion: this.data.contractVersion,
			Random: random,
			nextInterface: 4,
			orderId: app.globalData.orderInfo.orderId
		};
		let res = await util.getDataFromServersV2('consumer/etc/nmg/common/cardonline/online-to-active',params);
		if (res.code === 0) {
			if (res.data.FileData && res.data.Mac) {
				this.writeDataToObuForSysInfo(res);
			} else {
				this.isOver(res.data.description);
			}
		} else {
			this.isOver(res.message);
		}
	},
	writeDataToObuForSysInfo (res) {
		let tlv = dataHandler.makeTLV([res.data.FileData + res.data.Mac]);
		bleUtil.sendDataToDevice(dataUtil.makeA8SendData('00', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let result = dataHandler.resolveTLV(retlv)[0];
				console.log(result);
				if (result === '9000') {
					this.uploadOrderForObu();
				} else {
					this.isOver('写入系统信息失败，请重试!');
				}
			} else {
				this.isOver('写入系统信息失败，请重试!');
			}
		});
	},
	// 更新订单（obu发行）
	async uploadOrderForObu () {
		this.setData({msg: '更新订单中...'});
		let params = {
			SerialNumber: this.data.contractNumber,
			orderId: app.globalData.orderInfo.orderId
		};
		let res = await util.getDataFromServersV2('consumer/etc/nmg/common/cardonline/obu-writing-success',params);
		if (res.code === 0) {
			wx.uma.trackEvent('activate_the_success');
			this.setData({msg: '', activated: 1});
		} else {
			this.isOver(res.message);
		}
	},
	async getCurrentStep () {
		this.setData({msg: '加载中...'});
		let params = {
			orderId: app.globalData.orderInfo.orderId
		};
		let res = await util.getDataFromServersV2('consumer/etc/nmg/common/cardonline/current-step',params);
		if (res.code === 104) {
			this.get4BitRandomByPICCFor0016();
		} else if (res.code === 0) {
			switch (res.data.nextInterface) {
				case 0: this.setData({errMsg: '已开卡，请勿重复操作'}); return;
				case 2: this.get4BitRandomByPICCFor0015(); break;
				case 3: this.get4BitRandomByESAMForWriteCarInfo(); break;
				case 4: this.get4BitRandomByESAMForWriteSysInfo(); break;
				case 1:
				default:
					this.get4BitRandomByPICCFor0016(); break;
			}
		} else {
			this.isOver(res.message);
		}
	},
	onHide () {
		wx.closeBluetoothAdapter();
	}
});
