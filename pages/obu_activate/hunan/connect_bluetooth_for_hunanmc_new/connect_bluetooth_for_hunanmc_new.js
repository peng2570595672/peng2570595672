/*
* 湖南铭创
 */
const util = require('../../../../utils/util.js');
const bleUtil = require('../../libs/neimeng_mc_new_sdk/BleUtil.js');
const app = getApp();
let timer;
const SUCCESS_CODE = '0';
const FAILED_CODE = '1';
Page({
	data: {
		ui: {
			showLoading: true, // 是否显示搜索中
			getListFailed: false, // 获取obu设备
			deviceName: undefined, // 设备名称
			connectState: -1, // 是否已连接 默认连接中 1 已连接 2 连接失败
			isActivating: false, // 是否激活中
			errMsg: '',
			msg: '',
			activated: false, // 是否已经激活
			returnMiniProgram: 'returnMiniProgram',
			clickHandle: 'retry',
			cardNo: '',
			obuNo: '',
			isForce: false
		},
		idInfo: 'FFFFFFFF',
		host: '',
		device: undefined,
		cardNo: '', // 卡号
		obuNo: '',// obu号
		alertNum: 0,
		type: 0,
		isWriteObu: false,
		isUnload: 0
	},
	onLoad (options) {
		/*
			激活流程
			1-读取设备卡片信息 2-读取设备obu信息
			3-读取obu车辆随机数 4-获取obu高速接口指令 5-写obu
			6-读取0015随机数 7-获取0015高速接口指令 8-写0015
			9-读取0016随机数 10-获取0016高速接口指令 11-写0016  (0015&0016为卡片操作)   12-调用高速写卡成功接口
			13-读取obu系统随机数 14-获取obu系统高速接口指令 15-obu系统信息 16-调用高速写系统成功接口
		*/
		let reg = new RegExp(`^(1|2|3)$`);
		wx.canIUse('setBackgroundColor') && wx.setBackgroundColor({
			backgroundColor: '#ffffff',
			backgroundColorBottom: '#ffffff'
		});
		this.mySetData({
			urlPrefix: 'consumer/etc/hunan/v2/common'
		});
		this.start();
	},
	start () {
		this.openBluetooth();
		// 搜索倒计时
		timer = setTimeout(() => {
			wx.closeBluetoothAdapter();
			this.mySetData({
				showLoading: false,
				getListFailed: true
			});
		}, 15000);
	},
	returnMiniProgram () {
		util.returnMiniProgram();
	},
	// 封装自己的mySetData
	// 属性值不能为undefined
	mySetData (obj) {
		let uiArr = [
			'showLoading',
			'getListFailed',
			'deviceName',
			'connectState',
			'isActivating',
			'errMsg',
			'msg',
			'activated',
			'cardNo',
			'obuNo'
		];
		let tergetKeys = Object.keys(obj);
		let ui = this.data.ui;
		let tempObj = {};
		for (let key of tergetKeys) {
			if (uiArr.indexOf(key) !== -1) {
				ui[key] = obj[key];
			} else {
				tempObj[key] = obj[key];
			}
		}
		tempObj['ui'] = ui;
		this.setData(tempObj);
	},

	// 开启蓝牙
	openBluetooth () {
		this.setData({msg: '搜索过程中请勿关闭小程序'});
		// 所有操作失败的回调
		const failed = () => { this.mySetData({showLoading: 0, getListFailed: 1}); };
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
				this.mySetData({
					deviceName: device.name,
					showLoading: 0,
					getListFailed: 0
				});
				clearTimeout(timer);
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
							this.mySetData({
								connectState: 1,
								getListFailed: 0
							});
							this.setData({msg: 'OBU连接成功'});
							const that = this;
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
							this.mySetData({
								connectState: 2,
								getListFailed: 0
							});
							this.mySetData({errMsg: 'OBU连接失败'});
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
	scanBle (callback) {
		let list = [];
		wx.startBluetoothDevicesDiscovery({
			success (res) {
				wx.onBluetoothDeviceFound((res) => {
					console.log('找设备');
					console.log(res);
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
							if (new RegExp('^HN.*$').test(res.devices[i].name)) {
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
	handleRetry () {
		this.setData({
			ui: {
				showLoading: true, // 是否显示搜索中
				getListFailed: false, // 获取obu设备
				deviceName: undefined, // 设备名称
				connectState: -1, // 是否已连接 默认连接中 1 已连接 2 连接失败
				isActivating: false, // 是否激活中
				errMsg: '',
				msg: '',
				activated: false, // 是否已经激活
				returnMiniProgram: 'returnMiniProgram',
				clickHandle: 'retry',
				cardNo: '',
				obuNo: '',
				isForce: false
			},
			host: '',
			device: undefined,
			cardNo: '', // 卡号
			obuNo: '',// obu号
			type: 0,
			alertNum: 0,
			isUnload: 0
		});
		this.start();
	},
	// 点击按钮
	retry () {
		// 激活
		if (this.data.ui.connectState !== 1 && this.data.ui.getListFailed) {
			wx.uma.trackEvent('activation_failed_retry');
		}
		if (this.data.ui.connectState === 1) {
			if (this.data.ui.isActivating) {
				return;
			}
			this.mySetData({
				isActivating: true,
				errMsg: '',
				msg: ''
			});
			// 读取卡号
			this.readCardNoFromDevice();
		} else {
			this.mySetData({
				showLoading: true,
				getListFailed: false,
				connectState: -1,
				errMsg: '',
				msg: ''
			});
			this.openBluetooth();
			timer = setTimeout(() => {
				wx.closeBluetoothAdapter();
				this.mySetData({
					showLoading: false,
					getListFailed: true
				});
			}, 15000);
		}
	},
	// 从设备读取卡号
	readCardNoFromDevice () {
		// true
		this.mySetData({
			msg: '正在读取卡号...'
		});
		let cosArr = [];
		cosArr.push('00A40000021001');
		// cosArr.push('0020000003123456');	// 0020 0000 pin码位数 pin码
		cosArr.push('00B095002B');
		this.transCommand(0, cosArr, async (code, res, err) => {
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
				// console.log('卡品牌：', cBrand, cardBrand);
				this.mySetData({
					cardNo: faceCardNumber
				});
				this.setData({
					cardType: parseInt(cardType,16), // 16进制转有符号的10进制整数
					version: parseInt(cardVersion,16)
				});
				this.readObuNoFromDevice();
			} else {
				this.isOver(err + ',读取卡片信息失败');
			}
		});
	},
	readObuNoFromDevice () {
		this.mySetData({
			msg: '正在读取OBU号...'
		});
		let cosArr = [];
		cosArr.push('00A40000023F00');
		cosArr.push('00B081001B');
		this.transCommand(2, cosArr, (code, res, err) => {
			let info = res[1];
			console.log('正在读取OBU号');
			console.log(res);
			if (+code === 0) {
				// 发行方标识 只取中文部分，如：湖南
				let IssuerMarking = info.substring(0, 16);
				console.log('发行方标识：' + IssuerMarking);
				// 协议类型-合同类型
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
				this.mySetData({
					obuNo: contractNumber
				});
				this.setData({
					contractVersion: parseInt(contractVersion,16), // 16进制转有符号的10进制整数,
					serialNumber: contractNumber,
					contractType: protocolType
				});
				this.getRandomForActivate(2, 3);
			} else {
				this.isOver(err + ',读取系统信息失败');
			}
		});
	},
	// 获取设备随机数
	getRandomForActivate (type, fileType) {
		let cosArr = [];
		if (fileType === 1) {
			// 0016
			cosArr.push('00A40000023F00');
		} else if (fileType === 2) {
			// 0015
			cosArr.push('00A40000021001');
		} else if (fileType === 3) {
			cosArr.push('00A40000023F00');
			cosArr.push('00A4000002DF01');
		} else {
			cosArr.push('00A40000023F00');
		}
		cosArr.push('0084000004');
		// fileType 1-卡0015数据 2-卡0016数据 3-obu车辆数据 4-系统数据
		// type 0: 卡；1: obu  0：icc指令，1：esam指令（内蒙）；2：esam指令（湖南）
		this.transCommand(type, cosArr, (code, res) => {
			console.log(res);
			if (+code === 0) {
				// 获取随机数
				let random = '';
				if (fileType === 3) {
					// 获取随机数
					random = res[2].slice(0, -4).toUpperCase();
				} else {
					random = res[1].slice(0, -4).toUpperCase();
				}
				console.log('3F00-8位随机数：', random);
				this.setData({
					random
				});
				switch (fileType) {
					case 1: this.handleWriteEtc(fileType); break;
					case 2: this.handleWriteEtc(fileType); break;
					case 3: this.handleWriteObu(fileType); break;
					case 4: this.handleWriteObu(fileType); break;
				}
			} else {
				const list = ['0015', '0016', 'obu', '系统信息'];
				const tips = list[fileType - 1];
				this.isOver(`读取${tips}失败` + res);
			}
		});
	},
	// type 0: 卡；1: obu     0：icc指令，1：esam指令（内蒙）；2：esam指令（湖南）
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
	// 写卡
	async handleWriteEtc (fileType) {
		this.mySetData({
			msg: fileType === 1 ? '获取卡片0015信息中...' : '获取卡片0016信息中...'
		});
		let params = {
			orderId: app.globalData.newOrderId || app.globalData.orderInfo.orderId,
			faceCardNum: this.data.ui.cardNo.substring(4),
			cardType: this.data.cardType,
			version: this.data.version,
			random: this.data.random,
			fileType// 1-0016文件 2-0015文件
		};
		// util.ajax(`${this.data.urlPrefix}/writeEtc`, params,() => {
		// 	this.isOver(fileType === 1 ? '获取卡片0015信息失败' : '获取卡片0016信息失败');
		// }, (res) => {
		// 	if (res.code === 0) {
		// 		console.log(res);
		// 		this.writeDataToCardAndObu(res);
		// 	} else if (res.code === 105) {
		// 		// 写卡成功-去写签
		// 		this.getRandomForActivate(2, 4);
		// 	} else {
		// 		this.isOver(res.message);
		// 	}
		// });
		let res = await util.getDataFromServersV2(`${this.data.urlPrefix}/writeEtc`,params);
		if (!res) {
			this.isOver(fileType === 1 ? '获取卡片0015信息失败' : '获取卡片0016信息失败');
			return;
		}
		if (res.code === 0) {
			console.log(res);
			this.writeDataToCardAndObu(res);
		} else if (res.code === 105) {
			// 写卡成功-去写签
			this.getRandomForActivate(2, 4);
		} else {
			this.isOver(res.message);
		}
	},
	writeDataToCardAndObu (res) {
		let cmd = res.data.fileData + res.data.mac;
		const fileType = +res.data.fileType;
		let cosArr = [];
		cosArr.push(cmd);
		// fileType 1-卡0015数据 2-卡0016数据 3-obu车辆数据 4-系统数据
		// type 0: 卡；1: obu     0：icc指令，1：esam指令（内蒙）；2：esam指令（湖南）
		this.transCommand(fileType > 2 ? 2 : 0, cosArr, (code, res) => {
			// 写卡
			console.log(res);
			if (!/9000$/.test(res[0])) {
				const list = ['写卡（卡发行信息）失败', '写卡（持卡人信息）失败', '写obu（车辆信息）失败', '写obu（系统信息）失败'];
				this.isOver(list[fileType - 1]);
				return;
			}
			switch (fileType) {
				// 下一步：写卡成功 (0015成功) - 写0016
				case 1: this.getRandomForActivate(0, 2); break;
				// 下一步：写卡成功(0016成功) - 写卡成功
				case 2: this.handleWriteEtcSuccess(); break;
				// 下一步：写obu成功-写0015
				case 3: this.getRandomForActivate(0, 1); break;
				// 下一步：写系统成功
				case 4: this.handleWriteObuSuccess(); break;
			}
		});
	},
	// 写卡成功
	async handleWriteEtcSuccess () {
		this.mySetData({
			msg: '写卡中...'
		});
		let params = {
			orderId: app.globalData.newOrderId || app.globalData.orderInfo.orderId,
			faceCardNum: this.data.ui.cardNo.substring(4)
		};
		// util.ajax(`${this.data.urlPrefix}/writeEtcSuccess`, params, () => {
		// 	this.isOver('写卡失败！');
		// }, (res) => {
		// 	if (res.code === 0) {
		// 		// 0015&0016结束
		// 		console.log(res);
		// 		this.getRandomForActivate(2, 4);
		// 	} else {
		// 		this.isOver(res.message);
		// 	}
		// });
		let res = await util.getDataFromServersV2(`${this.data.urlPrefix}/writeEtcSuccess`,params);
		if (!res) {
			this.isOver('写卡失败！');
			return;
		}
		if (res.code === 0) {
			// 0015&0016结束
			console.log(res);
			this.getRandomForActivate(2, 4);
		} else {
			this.isOver(res.message);
		}
	},
	// 写签
	async handleWriteObu (fileType) {
		this.mySetData({
			msg: fileType === 3 ? '获取车辆信息中...' : '获取系统信息中...'
		});
		let params = {
			orderId: app.globalData.newOrderId || app.globalData.orderInfo.orderId,
			contractVersion: this.data.contractVersion,
			serialNumber: this.data.serialNumber,
			contractType: this.data.contractType,
			random: this.data.random,
			fileType// 3-车辆信息 4-系统信息
		};
		// util.ajax(`${this.data.urlPrefix}/writeObu`, params, () => {
		// 	this.isOver(fileType === 3 ? '获取车辆信息失败！' : '获取系统信息失败！');
		// }, (res) => {
		// 	if (res.code === 0) {
		// 		console.log(res);
		// 		this.setData({isWriteObu: fileType === 3});
		// 		this.writeDataToCardAndObu(res);
		// 	} else {
		// 		this.isOver(res.message);
		// 	}
		// });
		let res = await util.getDataFromServersV2(`${this.data.urlPrefix}/writeObu`,params);
		if (!res) {
			this.isOver(fileType === 3 ? '获取车辆信息失败！' : '获取系统信息失败！');
			return;
		}
		if (res.code === 0) {
			console.log(res);
			this.setData({isWriteObu: fileType === 3});
			this.writeDataToCardAndObu(res);
		} else {
			this.isOver(res.message);
		}
	},
	// 写签成功
	async handleWriteObuSuccess () {
		this.mySetData({
			msg: '激活中...'
		});
		let params = {
			orderId: app.globalData.newOrderId || app.globalData.orderInfo.orderId,
			faceCardNum: this.data.ui.cardNo.substring(4),
			serialNumber: this.data.serialNumber
		};
		// util.ajax(`${this.data.urlPrefix}/writeObuSuccess`, params, () => {
		// 	this.isOver('激活失败！');
		// }, (res) => {
		// 	if (res.code === 0) {
		// 		this.mySetData({
		// 			activated: true,
		// 			msg: '',
		// 			errMsg: ''
		// 		});
		// 	} else {
		// 		this.isOver(res.message);
		// 	}
		// });
		let res = await util.getDataFromServersV2(`${this.data.urlPrefix}/writeObuSuccess`,params);
		if (!res) {
			this.isOver('激活失败！');
			return;
		}
		if (res.code === 0) {
			this.mySetData({
				activated: true,
				msg: '',
				errMsg: ''
			});
		} else {
			this.isOver(res.message);
		}
	},
	// 重置
	isOver (msg) {
		// this.disonnectDevice();
		this.mySetData({
			device: 0,
			isActivating: false,
			getListFailed: true,
			errMsg: msg
		});
	},
	// 断开设备连接
	disonnectDevice () {
		obuSdk.disConnect({
			success: (res) => {
				wx.closeBluetoothAdapter();
			},
			fail: (res) => {
				wx.closeBluetoothAdapter();
			}
		});
	},
	// 停止扫描蓝牙设备
	stopScanDevice () {
		wx.stopBluetoothDevicesDiscovery({
			success: () => {
			},
			fail: () => {
			}
		});
	},
	// 是否强制发行
	forceHandle () {
		let ui = this.data.ui;
		ui.isForce = !ui.isForce;
		this.setData({
			ui
		});
	},
	onUnload () {
		this.setData({isUnload: 1});
		// this.disonnectDevice();
	}
});
