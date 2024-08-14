/*
* 内蒙obu连接蓝牙激活
 */
import {isOpenBluetooth} from '../../../../utils/utils';

const util = require('../../../../utils/util.js');
const bleUtil = require('../../libs/neimeng_artc_sdk/artcBleUtil.js');
const dataUtil = require('../../libs/neimeng_artc_sdk/artcDataUtil.js');
const dataHandler = require('../../libs/neimeng_artc_sdk/artcDataHandler.js');
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
							this.setData({activateStep: 3, msg: 'OBU连接成功'});
						});
					} else {
						this.setData({activateStep: 9, errMsg: 'OBU连接失败'});
					}
				});
			},
			fail: (res) => {
				this.setData({activateStep: 7});
				this.isOver('设备搜索失败');
			}
		});
	},
	// 点击按钮
	go () {
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
		if (errMsg && errMsg.includes('访问高速方返回为空')) {
			errMsg = '激活页与当前设备不匹配，请检查';
		}
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
				this.setData({activateStep: 5});
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
				this.setData({activateStep: 5});
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
				if (app.globalData.newEmptyObuNo) {
					if (app.globalData.newEmptyObuNo !== contractNumber) {
						this.isOver(`当前设备卡号与下单设备卡号不一致`);
						return;
					}
				}
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
				this.get4BitRandomByPICCFor0015();
			} else {
				this.setData({activateStep: 5});
				this.isOver('获取卡片信息失败');
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
				this.requestTo0015OrObu(random, 2);
			} else {
				this.setData({activateStep: 5});
				this.isOver('获取随机数失败');
			}
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
	writeDataToCardFor0015 (res) {
		let tlv = dataHandler.makeTLV([res.data.FileData + res.data.Mac]);
		bleUtil.sendDataToDevice(dataUtil.makeA3SendData('00', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let result = dataHandler.resolveTLV(retlv)[0];
				if (result === '9000') {
					// 下一步：更新obu车辆信息
					this.get4BitRandomByESAMForWriteCarInfo();
				} else {
					this.setData({activateStep: 5});
					this.isOver('写入0015数据失败，请重试!');
				}
			} else {
				this.setData({activateStep: 5});
				this.isOver('写入0015数据失败，请重试!');
			}
		});
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
				this.requestTo0015OrObu(random, 3);
			} else {
				this.setData({activateStep: 5});
				this.isOver('获取随机数失败');
			}
		});
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
					this.setData({activateStep: 5});
					this.isOver('写入车辆信息失败，请重试!');
				}
			} else {
				this.setData({activateStep: 5});
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
				this.setData({activateStep: 5});
				this.isOver('获取随机数失败');
			}
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
	onHide () {
		wx.closeBluetoothAdapter();
	}
});
