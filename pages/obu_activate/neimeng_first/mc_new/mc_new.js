/*
* 内蒙obu连接蓝牙激活
 */
const util = require('../../../../utils/util.js');
const bleUtil = require('../../../../libs/neimeng_mc_new_sdk/BleUtil.js');

const SUCCESS_CODE = '0';
const FAILED_CODE = '1';
const app = getApp();
let timer;
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
		activated: 0
	},
	onLoad () {
		// // TODO TEST CODE
		// app.globalData.orderInfo.orderId = '638787874229059584';
		this.start();
	},
	handleRetry () {
		bleUtil.disConnect({
			success: res => {
				console.log(res);
			},
			fail: res => {
				console.log(res);
			}
		}, 15000);
		this.setData({
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
	// 读取物理卡号（内蒙特有
	getPhyCardNum () {
		console.log('开始获取物理卡号');
		this.setData({idInfo: 'FFFFFFFF'});
		this.getContractInfo();
		// try {
		// 	bleUtil.sendA5Command('C5',{
		// 		success: res => {
		// 			console.log('物理卡号：', res);
		// 			console.log('物理卡号：', JSON.stringify(res));
		// 			this.setData({idInfo: res.data});
		// 			// 读取合同信息
		// 			this.getContractInfo();
		// 		},
		// 		fail: res => {
		// 			this.isOver('物理卡号获取失败');
		// 			console.error('物理卡号获取失败：', res);
		// 		}
		// 	}, 15000);
		// } catch (e) {
		// 	this.isOver('设备版本过低，请联系工作人员');
		// }
	},
	// 读取合同信息
	getContractInfo () {
		let cosArr = [];
		cosArr.push('00A40000023F00');
		cosArr.push('00B081001B');
		this.transCommand(1, cosArr, (code, res) => {
			let info = res[1];
			if (+code === 0) {
				// 发行方标识
				let IssuerMarking = info.substring(0, 16);
				console.log('发行方标识：' + IssuerMarking);
				// 协议类型
				let protocolType = info.substring(16, 18);
				console.log('协议类型：' + protocolType);
				// 合同版本
				let contractVersion = info.slice(18, 20);
				console.log('合同版本：' + contractVersion);
				// 合同序列号
				let contractNumber = info.slice(20, 36).toUpperCase();
				console.log('合同序列号：' + contractNumber);
				// 合同开始日期
				let startTime = info.slice(36, 44);
				console.log('合同开始日期：' + startTime);
				// 合同结束日期
				let endTime = info.slice(44, 52);
				console.log('合同结束日期：' + endTime);
				// 是否已激活
				// 暂时没用到这个数据
				let isActivating = info.slice(52, 54);
				console.log('OBU是否已激活：' + isActivating);
				// 设置数据
				this.setData({
					IssuerMarking,
					protocolType,
					contractVersion,
					contractNumber,
					startTime,
					endTime
				});
				// 读取卡片表面号
				this.cardSurfaceNumber();
			} else {
				this.isOver('读取系统信息失败');
			}
		});
	},
	// 读取卡片表面号
	cardSurfaceNumber () {
		let cosArr = [];
		cosArr.push('00A40000021001');
		// cosArr.push('0020000003123456');	// 0020 0000 pin码位数 pin码
		cosArr.push('00B095002B');
		this.transCommand(0, cosArr, (code, res) => {
			console.log('读取卡片信息：');
			console.log(code);
			console.log(res);
			// if (!/9000$/.test(res[1])) return console.error('pin验证失败');
			let info = res[1];
			if (+code === 0) {
				// 发卡方标识
				// info.substring(0, 16);
				// 卡片类型
				let cardType = info.substring(16, 18);
				console.log('卡片类型：' + cardType);
				// 卡片版本
				let cardVersion = info.substring(18, 20);
				console.log('卡片版本：' + cardVersion);
				// 卡片网络编号 4位
				// info.substring(20, 24);
				// 卡片内部编号 16位
				// info.substring(24, 40);
				// 卡片表面号 20位（即：卡片网络编号 + 卡片内部编号）
				let faceCardNumber = info.substring(20, 40);
				console.log('卡片表面号：' + faceCardNumber);
				let cardId = faceCardNumber.slice(4);
				console.log('cardId（16位）：' + cardId);
				// 启用时间
				let startTime = info.substring(40, 48);
				console.log('启用时间：' + startTime);
				// 到期时间
				let endTime = info.substring(48, 56);
				console.log('过期时间：' + endTime);
				// let cBrand = cardId.substr(6, 2);
				// let cardBrand = '';
				// switch (+cBrand) {
				// 	// 握奇
				// 	case 1: cardBrand = 2; break;
				// 	// 航天
				// 	case 2: cardBrand = 7; break;
				// 	// 捷德
				// 	case 3: cardBrand = 1; break;
				// 	// 天喻
				// 	case 4: cardBrand = 3; break;
				// }
				// console.log('卡品牌：', cBrand, cardBrand);
				this.setData({
					cardType,
					cardVersion,
					faceCardNumber,
					cardId,
					startTime,
					endTime
				// 	cardBrand
				});
				// 获取步骤信息
				this.getCurrentStep();
			} else {
				this.isOver('读取卡片信息失败');
			}
		});
	},

	// 通过picc通道获取8位随机数 0016（持卡人信息）
	get4BitRandomByPICCFor0016 () {
		this.setData({msg: '读取数据中...'});
		console.log('写0016数据开始');

		// 取随机数
		let cosArr = [];
		cosArr.push('00A40000023F00');
		cosArr.push('0084000004');
		this.transCommand(0, cosArr, (code, res) => {
			// 获取随机数
			let random = res[1].slice(0, -4).toUpperCase();
			console.log('0016-8位随机数：', random);
			this.requestTo0016(random);
		});
	},
	// 上传数据到高速（持卡人信息）
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
				this.isOver(res.data.description);
			}
		} else {
			this.isOver(res.message);
		}
	},
	// 写卡（持卡人信息）
	writeDataToCardFor0016 (info) {
		// 写入数据到卡
		let cmd = info.data.FileData + info.data.Mac;
		let cosArr = [];
		cosArr.push(cmd);
		console.log('写卡（持卡人信息）指令：', cmd);
		this.transCommand(0, cosArr, (code, res) => {
			console.log('写卡（持卡人信息）返回：', res);
			// 写卡
			if (!/9000$/.test(res[0])) {
				this.isOver('写卡（持卡人信息）失败');
				return;
			}
			// 下一步：更新卡发行信息
			this.get4BitRandomByPICCFor0015(info.data.DeviceListNo);
		});
	},

	// 通过picc通道获取8位随机数 0015（卡发行信息）
	get4BitRandomByPICCFor0015 (DeviceListNo) {
		this.setData({msg: '写入数据中...'});
		console.log('写0015数据开始');

		// 取随机数
		let cosArr = [];
		cosArr.push('00A40000021001');
		cosArr.push('0084000004');
		this.transCommand(0, cosArr, (code, res) => {
			// 获取随机数
			let random = res[1].slice(0, -4).toUpperCase();
			console.log('0015-8位随机数：', random);
			this.requestTo0015(random, DeviceListNo);
		});
	},
	// 上传数据到高速（卡发行信息）
	async requestTo0015 (random, DeviceListNo) {
		let params = {
			FaceCardNum: this.data.cardId,
			CardType: this.data.cardType,
			Version: this.data.cardVersion,
			PhyCardNum: this.data.idInfo,
			Random: random,
			DeviceListNo,
			nextInterface: 2,
			orderId: app.globalData.orderInfo.orderId
		};
		let res = await util.getDataFromServersV2('consumer/etc/nmg/common/cardonline/online-to-active',params);
		if (res.code === 0) {
			if (res.data.FileData && res.data.Mac) {
				this.writeDataToCardFor0015(res);
			} else {
				this.isOver(res.data.description);
			}
		} else {
			this.isOver(res.message);
		}
	},
	// 写卡（卡发行信息）
	writeDataToCardFor0015 (info) {
		// 写入数据到卡
		let cmd = info.data.FileData + info.data.Mac;
		let cosArr = [];
		cosArr.push(cmd);
		console.log('写卡（卡发行信息）指令：', cmd);
		this.transCommand(0, cosArr, (code, res) => {
			console.log('写卡（卡发行信息）返回：', res);
			// 写卡
			if (!/9000$/.test(res[0])) {
				this.isOver('写卡（卡发行信息）失败');
				return;
			}
			// 下一步：更新订单（卡发行）
			this.uploadOrderForCard(info.data.DeviceListNo);
		});
	},
	// 更新订单（卡发行）
	async uploadOrderForCard (DeviceListNo) {
		this.setData({msg: '更新订单中...'});
		let params = {
			DeviceListNo,
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

	// 通过esam通道获取8位随机数（obu车辆信息）
	get4BitRandomByESAMForWriteCarInfo () {
		this.setData({msg: '写入数据中...'});
		console.log('写车辆数据开始');

		let cosArr = [];
		cosArr.push('00A40000023F00');
		cosArr.push('00A4000002DF01');
		cosArr.push('0084000004');
		this.transCommand(1, cosArr, (code, res) => {
			console.log(res);

			// 获取随机数
			let random = res[2].slice(0, -4).toUpperCase();
			console.log('1001-8位随机数：', random);
			this.requestToWriteCarInfo(random);
		});
	},
	// 上传数据到高速（obu车辆信息）
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
		let res = await util.getDataFromServersV2('consumer/etc/nmg/common/cardonline/online-to-active',params);
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
	// 写obu（obu车辆信息）
	writeDataToObuForCarInfo (info) {
		// 写入数据到obu
		let cmd = info.data.FileData + info.data.Mac;
		let cosArr = [];
		cosArr.push(cmd);
		this.transCommand(1, cosArr, (code, res) => {
			console.log('写obu（车辆信息）返回：', res);
			// 写obu
			if (!/9000$/.test(res[0])) {
				this.isOver('写obu（车辆信息）失败');
				return;
			}
			// 下一步：更新obu系统信息
			this.get4BitRandomByESAMForWriteSysInfo(info.data.DeviceListNo);
		});
	},

	// 通过esam通道获取8位随机数（obu系统信息）
	get4BitRandomByESAMForWriteSysInfo (DeviceListNo) {
		this.setData({msg: '写入数据中...'});
		console.log('写系统数据开始');

		let cosArr = [];
		cosArr.push('00A40000023F00');
		cosArr.push('0084000004');
		this.transCommand(1, cosArr, (code, res) => {
			console.log(res);
			// 获取随机数
			let random = res[1].slice(0, -4).toUpperCase();
			console.log('3F00-8位随机数：', random);
			this.requestToWriteSysInfo(random, DeviceListNo);
		});
	},
	// 上传数据到高速（obu系统信息）
	async requestToWriteSysInfo (random, DeviceListNo) {
		let params = {
			DeviceListNo,
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
	// 写obu（obu系统信息）
	writeDataToObuForSysInfo (info) {
		// 写入数据到obu
		let cmd = info.data.FileData + info.data.Mac;
		let cosArr = [];
		cosArr.push(cmd);
		this.transCommand(1, cosArr, (code, res) => {
			console.log('写obu（系统信息）返回：', res);
			// 写obu
			if (!/9000$/.test(res[0])) {
				this.isOver('写obu（系统信息）失败');
				return;
			}
			// 下一步：更新订单（obu发行）
			this.uploadOrderForObu(info.data.DeviceListNo);
		});
	},
	// 更新订单（obu发行）
	async uploadOrderForObu (DeviceListNo) {
		this.setData({msg: '更新订单中...'});
		let params = {
			DeviceListNo,
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
				// case 2: this.get4BitRandomByPICCFor0015(); break;
				case 3: this.get4BitRandomByESAMForWriteCarInfo(); break;
				case 4: this.get4BitRandomByESAMForWriteCarInfo(); break;
				case 1:
				default:
					this.get4BitRandomByPICCFor0016(); break;
			}
		} else {
			this.isOver(res.message);
		}
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
							if (/NM/.test(res.devices[i].name)) {
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
	// type 0: 卡；1: obu
	transCommand (type, arr, callback) {
		bleUtil.sendAndReceive(type, arr, {
			success: res => {
				console.log(arr, res);
				callback(0, res.data || []);
			},
			fail: res => {
				console.error(arr, res);
				callback(1, res.data || []);
			}
		}, 15000);
	},

	onHide () {
		wx.closeBluetoothAdapter();
	}
});
