/*
* 内蒙obu连接蓝牙激活
 */
import {isOpenBluetooth} from '../../../../utils/utils';

const util = require('../../../../utils/util.js');
const bleUtil = require('../../libs/neimeng_mc_sdk/BleUtil.js');

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
		activated: 0,
		activateStep: 1 // 激活步骤 1 搜索设备中 2 搜索设备失败 3 搜索设备连接成功 4 设备更新中 5 设备更新失败 6 设备已更新 7设备连接失败 8蓝牙中断
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
		this.setData({activateStep: 1});
		this.openBluetooth();
		// 搜索倒计时
		timer = setTimeout(() => {
			wx.closeBluetoothAdapter();
			this.setData({
				mask: true,
				wrapper: true,
				activateStep: 2
			});
			this.isOver();
		}, 15000);
	},
	// 开启蓝牙
	openBluetooth () {
		this.setData({msg: '正在连接OBU设备...'});
		// 所有操作失败的回调
		const failed = () => {
			this.setData({activateStep: 7});
			this.isOver('设备搜索失败');
		};
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
							this.setData({activateStep: 3, msg: 'OBU连接成功'});
						},
						fail: res => {
							console.warn('连接 & 部署设备失败: ', res);
							this.setData({
								connectState: 2,
								getListFailed: 0
							});
							this.setData({activateStep: 9, errMsg: 'OBU连接失败'});
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
		if (this.data.activateStep === 3) {
			this.setData({activateStep: 4});
			this.getPhyCardNum();
		} else if (this.data.activateStep === 6) {
			util.go(`/pages/default/terminationAndReSigning/terminationAndReSigning?id=${app.globalData.obuActiveUpDateInfo.id}`);
		} else {
			this.start();
		}
	},
	// 重置
	async isOver (errMsg) {
		if (errMsg) {
			this.setData({activateStep: 5});
		}
		if (!await isOpenBluetooth() || errMsg?.includes('2002')) {
			this.setData({
				mask: true,
				wrapper: true,
				activateStep: 8
			});
		}
		this.setData({isActivating: 0});
		if (errMsg && errMsg.includes('访问高速方返回为空')) {
			errMsg = '激活页与当前设备不匹配，请检查';
		}
		errMsg && this.setData({errMsg});
	},
	// 读取物理卡号（内蒙特有
	getPhyCardNum () {
		console.log('开始获取物理卡号');
		try {
			bleUtil.getPhyCardNum({
				success: res => {
					console.log('物理卡号：', res);
					this.setData({idInfo: res.data});
					// 读取合同信息
					this.getContractInfo();
				},
				fail: res => {
					this.setData({activateStep: 5});
					this.isOver('物理卡号获取失败');
					console.error('物理卡号获取失败：', res);
				}
			}, 15000);
		} catch (e) {
			this.setData({activateStep: 5});
			this.isOver('设备版本过低，请联系工作人员');
		}
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
				this.setData({activateStep: 5});
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
				this.get4BitRandomByPICCFor0015();
			} else {
				this.setData({activateStep: 5});
				this.isOver('读取卡片信息失败');
			}
		});
	},
	// 通过picc通道获取8位随机数 0015（卡发行信息）
	get4BitRandomByPICCFor0015 () {
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
			this.requestTo0015OrObu(random, 2);
		});
	},
	// 上传数据到高速（卡发行信息）
	async requestTo0015OrObu (random, FileName) {
		let params = {
			FaceCardNum: this.data.cardId,
			SerialNumber: this.data.contractNumber,
			Version: this.data.cardVersion,
			PhyCardNum: this.data.idInfo,
			Random: random,
			FileName: FileName,// 2-0015文件 3-车辆信息文件
			id: app.globalData.obuActiveUpDateInfo.id
		};
		let res = await util.getDataFromServersV2('consumer/order/order-veh-plates-change/nmgRewriteApply',params);
		if (res.code === 0) {
			if (res.data.FileData && res.data.Mac) {
				if (FileName === 2) {
					this.writeDataToCardFor0015(res);
				} else if (FileName === 3) {
					this.writeDataToObuForCarInfo(res);
				}
			} else {
				this.setData({activateStep: 5});
				this.isOver(res.data.description);
			}
		} else {
			this.setData({activateStep: 5});
			this.isOver(res.message);
		}
	},
	// 写卡（卡发行信息）
	writeDataToCardFor0015 (res) {
		// 写入数据到卡
		let cmd = res.data.FileData + res.data.Mac;
		let cosArr = [];
		cosArr.push(cmd);
		console.log('写卡（卡发行信息）指令：', cmd);
		this.transCommand(0, cosArr, (code, res) => {
			console.log('写卡（卡发行信息）返回：', res);
			// 写卡
			if (!/9000$/.test(res[0])) {
				this.setData({activateStep: 5});
				this.isOver('写卡（卡发行信息）失败');
				return;
			}
			this.get4BitRandomByESAMForWriteCarInfo();
		});
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
			this.requestTo0015OrObu(random, 3);
		});
	},
	// 写obu（obu车辆信息）
	writeDataToObuForCarInfo (res) {
		// 写入数据到obu
		let cmd = res.data.FileData + res.data.Mac;
		let cosArr = [];
		cosArr.push(cmd);
		this.transCommand(1, cosArr, (code, res) => {
			console.log('写obu（车辆信息）返回：', res);
			// 写obu
			if (!/9000$/.test(res[0])) {
				this.setData({activateStep: 5});
				this.isOver('写obu（车辆信息）失败');
				return;
			}
			// 下一步：更新obu系统信息
			this.get4BitRandomByESAMForWriteSysInfo();
		});
	},

	// 通过esam通道获取8位随机数（obu系统信息）
	get4BitRandomByESAMForWriteSysInfo () {
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
			this.requestToWriteSysInfo(random);
		});
	},
	// 上传数据到高速（obu系统信息）
	async requestToWriteSysInfo () {
		let params = {
			id: app.globalData.obuActiveUpDateInfo.id
		};
		let res = await util.getDataFromServersV2('consumer/order/order-veh-plates-change/nmgRewriteConfirm',params);
		if (res.code === 0) {
			this.setData({msg: '', activated: 1, activateStep: 6});
		} else {
			this.setData({activateStep: 5});
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
	hide () {
		this.start();
		this.setData({
			wrapper: false
		});
		setTimeout(() => {
			this.setData({
				mask: false
			});
		}, 400);
	},
	onHide () {
		wx.closeBluetoothAdapter();
	}
});
