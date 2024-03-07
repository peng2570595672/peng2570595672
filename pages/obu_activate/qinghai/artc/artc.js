/*
* 青海埃特斯
 */
const util = require('../../../../utils/util.js');
const encodeToGb2312 = require('../../libs/encodeToGb2312.js').encodeToGb2312;
const bleUtil = require('../../libs/qinghai_artc_sdk/artcBleUtil.js');
const dataUtil = require('../../libs/qinghai_artc_sdk/artcDataUtil.js');
const dataHandler = require('../../libs/qinghai_artc_sdk/artcDataHandler.js');
const app = getApp();
let timer;
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
			activated: false,// 是否已经激活
			returnMiniProgram: 'returnMiniProgram',
			clickHandle: 'retry'
		},
		cardVersion: undefined, // 卡版本
		faceCardNumber: undefined, // 卡号
		host: '',
		info: undefined,
		sysInfo: undefined,
		serialNumber: undefined,// 合同号
		version: undefined, // 合同版本
		qtLimit: [],
		serverId: ''
	},
	onLoad (options) {
		this.mySetData({
			qtLimit: options.qtLimit && options.qtLimit !== 'undefined' ? JSON.parse(options.qtLimit) : [],
			serverId: options.serverId || ''
		});
		this.mySetData({
			// host: app.globalData.host + 'consumer-etc/etc/'
			urlPrefix: 'consumer/etc/qhzy/common'
		});
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
			'activated'
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
						this.mySetData({
							deviceName: name,
							showLoading: false,
							getListFailed: false
						});
						console.log(device);
						bleUtil.connectBleDevice(device.deviceId, (code) => {
							// 0 表示连接成功
							this.mySetData({
								connectState: code === 0 ? 1 : 2,
								getListFailed: false
							});
						});
					} else {
						this.mySetData({
							getListFailed: true
						});
					}
				});
			},
			fail: (res) => {
				this.mySetData({
					getListFailed: true,
					showLoading: false
				});
			}
		});
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
				showLoading: false,
				errMsg: '',
				msg: ''
			});
			this.cardSurfaceNumber();
		} else {
			this.mySetData({
				showLoading: true,
				getListFailed: false,
				connectState: -1
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
	// 重置
	isOver () {
		this.mySetData({
			isActivating: false
		});
	},
	// 获取0015指令
	get0015CMD (info, tempFile15) {
		let file15 = [];
		// 以byte为单位，转成array
		[...new Array(tempFile15.length).keys()].map((i) => {
			if (i % 2) return;
			file15.push(tempFile15.substr(i, 2));
		});
		// 拼接指令
		let cmd = '04D695141B';

		// 银行卡类型（22. 储蓄卡；23. 记账卡）
		file15[8] = (23).toString(16);

		// 启用时间
		let enableTime = info.cardEnableTime.replace(/\ .*$/, '').replace(/-/g, '');
		file15[20] = enableTime.substr(0, 2);
		file15[21] = enableTime.substr(2, 2);
		file15[22] = enableTime.substr(4, 2);
		file15[23] = enableTime.substr(6, 2);

		// 到期时间
		let expireTime = info.cardExpireTime.replace(/\ .*$/, '').replace(/-/g, '');
		file15[24] = expireTime.substr(0, 2);
		file15[25] = expireTime.substr(2, 2);
		file15[26] = expireTime.substr(4, 2);
		file15[27] = expireTime.substr(6, 2);

		// 车牌号
		let plateNumTemp = encodeToGb2312(info.plateNo).toUpperCase();
		let plateNumTempLen = plateNumTemp.length / 2;
		[...new Array(12).keys()].map((i) => {
			if (i < plateNumTempLen) {
				file15[28 + i] = plateNumTemp.substr(i * 2, 2);
			} else {
				file15[28 + i] = '00';
			}
		});

		// 车辆类型	写死0：普通车（高速的李季旸这样说的
		file15[40] = '00';

		// 车牌颜色
		let plateColor = (+info.plateColor).toString(16);
		plateColor = plateColor.length - 1 ? plateColor : '0' + plateColor;
		file15[41] = plateColor;

		// 车型
		let carType = (+info.carType).toString(16);
		carType = carType.length - 1 ? carType : '0' + carType;
		file15[42] = carType;

		console.log('file15: ', file15);
		// 转string
		file15 = file15.join('');

		// 拼接指令
		cmd += file15.substring(40, file15.length);
		console.log('0015指令：' + cmd);
		return cmd;
	},
	// 获取0016指令
	get0016CMD (info) {
		// 拼接指令
		// 身份标识：00  证件标识：00
		let cmd = '0000';

		// 处理数据
		console.log('卡信息：', info);
		// 持卡人姓名 GB2312 16进制（20字节长度，不足20字节的结尾处以 0x00 标识结束；以 0xff 填充其余字节）
		let nameTemp = encodeToGb2312(info.userName).toUpperCase();
		let nameTempLen = nameTemp.length;
		let name = '';
		[...new Array(20 * 2).keys()].map((i) => {
			if (i % 2) return;
			if (i < nameTempLen) {
				name += nameTemp.substr(i, 2);
			} else if (i === nameTempLen) {
				name += '00';
			} else {
				name += 'FF';
			}
		});
		console.log('持卡人姓名：', info.userName);
		console.log('转后：', nameTemp);
		console.log('处理后：', name);
		cmd += name;

		// 持卡人证件号
		let IDTemp = info.userIdNum.toUpperCase();
		let IDTempLen = IDTemp.length;
		let ID = '';
		[...new Array(32).keys()].map((i) => {
			if (i < IDTempLen) {
				ID += `${IDTemp.charCodeAt(i)}`;
			} else if (i === IDTempLen) {
				ID += '00';
			} else {
				ID += 'FF';
			}
		});
		console.log('持卡人证件号：', info.userIdNum);
		console.log('处理后：', ID);
		cmd += ID;

		// 持卡人证件类型
		let IDType = info.userIdType + '';
		if (+IDType < 10) IDType = '0' + IDType;
		console.log('持卡人证件类型：', IDType);
		cmd += IDType;

		// 计算当前长度 16进制（包括'04D69600'的长度
		// let cmdLen = cmd.length + 8;
		let cmdLen = cmd.length / 2 + 4;
		cmdLen = `${cmdLen < 10 ? '0' : ''}${cmdLen.toString(16)}`.toUpperCase();
		cmd = `04D69600${cmdLen}${cmd}`;
		console.log('0016指令：', cmd);
		return cmd;
	},
	// 获取系统信息指令
	getSysInfoCMD (info, tempSysInfo) {
		let sysInfo = [];
		// 以byte为单位，转成array
		[...new Array(tempSysInfo.length).keys()].map((i) => {
			if (i % 2) return;
			sysInfo.push(tempSysInfo.substr(i, 2));
		});
		// 拼接指令
		let cmd = '04D681120D';

		/*
		// 协议类型
		// sysInfo[8] = (info.xxx).toString(16).toUpperCase();

		// 合同版本
		// sysInfo[9] = (info.xxx).toString(16).toUpperCase();
		*/

		// 签署日期
		let enableTime = info.enableTime.replace(/\ .*$/, '').replace(/-/g, '');
		sysInfo[18] = enableTime.substr(0, 2);
		sysInfo[19] = enableTime.substr(2, 2);
		sysInfo[20] = enableTime.substr(4, 2);
		sysInfo[21] = enableTime.substr(6, 2);

		// 过期日期
		let expireTime = info.expireTime.replace(/\ .*$/, '').replace(/-/g, '');
		sysInfo[22] = expireTime.substr(0, 2);
		sysInfo[23] = expireTime.substr(2, 2);
		sysInfo[24] = expireTime.substr(4, 2);
		sysInfo[25] = expireTime.substr(6, 2);

		// 拆卸状态
		// sysInfo[26] = (info.obustate).toString(16).toUpperCase();
		// let obustate = (+info.type).toString(16).toUpperCase();
		// obustate = obustate.length - 1 ? obustate : '0' + obustate;
		// sysInfo[26] = '01'; 设为激活状态
		sysInfo[26] = '00';

		// 转string
		sysInfo = sysInfo.join('');

		// 拼接指令
		cmd += sysInfo.substring(36);
		console.log('系统信息指令：', cmd);
		return cmd;
	},
	getAppInfoCMD (info) {
		let cmd = '04D681003F';
		let carInfo = [];

		// 车牌号
		let plateNumTemp = encodeToGb2312(info.plateNo).toUpperCase();
		let plateNumTempLen = plateNumTemp.length / 2;
		[...new Array(12).keys()].map((i) => {
			if (i < plateNumTempLen) {
				carInfo[i] = plateNumTemp.substr(i * 2, 2);
			} else {
				carInfo[i] = '00';
			}
		});

		// 车牌颜色
		let plateColor = (+info.plateColor).toString(16).toUpperCase();
		plateColor = plateColor.length - 1 ? plateColor : '0' + plateColor;
		carInfo[12] = '00';
		carInfo[13] = plateColor;

		// 车型
		let carType = (+info.type).toString(16).toUpperCase();
		carType = carType.length - 1 ? carType : '0' + carType;
		carInfo[14] = carType;

		// 车辆用户类型（0普通车
		carInfo[15] = '00';

		// 车辆尺寸
		// 4519X1831X1694  2+1+1
		// eslint-disable-next-line one-var
		let dims = [], dimTemp;
		info.outsideDimensions.match(/\d{4}/ig).map((item, i) => {
			dimTemp = Math.floor(item / 100).toString(16).toUpperCase();
			if (i) {
				// 宽 或 高
				dimTemp = dimTemp.length - 1 ? dimTemp : '0' + dimTemp;
				carInfo[16 + 2 + i - 1] = dimTemp;
			} else {
				// 长
				[...new Array(2 * 2 - dimTemp.length).keys()].map(() => {
					dimTemp = '0' + dimTemp;
				});
				carInfo[16] = dimTemp.substr(0, 2);
				carInfo[17] = dimTemp.substr(2, 2);
			}
		});

		// 车轮数
		console.log(info.wheelCount ? 1 : 0);
		let wheelCount = (info.wheelCount ? 1 : 0).toString(16).toUpperCase();
		wheelCount = wheelCount.length - 1 ? wheelCount : '0' + wheelCount;
		carInfo[20] = wheelCount;

		// 车轴数
		let axleCount = (info.axleCount ? 1 : 0).toString(16).toUpperCase();
		axleCount = axleCount.length - 1 ? axleCount : '0' + axleCount;
		carInfo[21] = axleCount;

		// 轴距
		let axleDistance = Math.floor((info.axleDistance ? 1 : 0) / 100).toString(16).toUpperCase();
		[...new Array(2 * 2 - axleDistance.length).keys()].map(() => {
			axleDistance = '0' + axleDistance;
		});
		carInfo[22] = axleDistance.substr(0, 2);
		carInfo[23] = axleDistance.substr(2, 2);

		// 车辆载重/座位数（这里指座位数
		let approvedCount = (info.approvedCount ? 1 : 0).toString(16).toUpperCase();
		[...new Array(3 * 2 - approvedCount.length).keys()].map(() => {
			approvedCount = '0' + approvedCount;
		});
		carInfo[24] = approvedCount.substr(0, 2);
		carInfo[25] = approvedCount.substr(2, 2);
		carInfo[26] = approvedCount.substr(4, 2);

		// 车辆特征描述
		[...new Array(16).keys()].map((i) => {
			carInfo[27 + i] = '00';
		});

		// 车辆发动机编号
		let engineNum = encodeToGb2312(info.engineNum).toUpperCase();
		[...new Array(16 * 2 - engineNum.length).keys()].map(() => {
			engineNum += '0';
		});
		carInfo[43] = engineNum.substr(0, 2);
		carInfo[44] = engineNum.substr(2, 2);
		carInfo[45] = engineNum.substr(4, 2);
		carInfo[46] = engineNum.substr(6, 2);
		carInfo[47] = engineNum.substr(8, 2);
		carInfo[48] = engineNum.substr(10, 2);
		carInfo[49] = engineNum.substr(12, 2);
		carInfo[50] = engineNum.substr(14, 2);
		carInfo[51] = engineNum.substr(16, 2);
		carInfo[52] = engineNum.substr(18, 2);
		carInfo[53] = engineNum.substr(20, 2);
		carInfo[54] = engineNum.substr(22, 2);
		carInfo[55] = engineNum.substr(24, 2);
		carInfo[56] = engineNum.substr(26, 2);
		carInfo[57] = engineNum.substr(28, 2);
		carInfo[58] = engineNum.substr(30, 2);
		carInfo = carInfo.join('');
		cmd += carInfo;
		console.log('应用信息指令：' + cmd);
		return cmd;
	},
	// 读取卡片表面号
	cardSurfaceNumber () {
		this.mySetData({
			msg: '读取中...'
		});
		let tlv = dataHandler.makeTLV(['00A40000023F00', '00A40000021001', '00B095002b']);
		bleUtil.sendDataToDevice(dataUtil.make82SendData('10', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let reapdu = dataHandler.resolveTLV(retlv);
				let info = reapdu[2]; // 卡中的车辆信息
				console.log(info);
				let cardVersion = info.substring(18, 20);
				console.log('卡片版本：' + cardVersion);
				let faceCardNumber = info.substring(20, 40);
				console.log('卡片表面号：' + faceCardNumber);
				// 青海农信 增加卡号匹配
				// qtLimit: ["63011901220111000001,63011901220111050000", "63011901230111000001,63011901230111050000"]
				// serverId: "607886715545190400"
				if (this.data.qtLimit.length > 0 && this.data.serverId.toString().trim() === '607886715545190400') {
					let ok = false;
					for (let i = 0; i < this.data.qtLimit.length; i++) {
						let arr = this.data.qtLimit[i].split(',');
						for (let j = 0; j < arr.length; j += 2) {
							if (faceCardNumber.toString() >= arr[j].toString() && faceCardNumber.toString() <= arr[j + 1].toString()) {
								ok = true;
								break;
							}
						}
						if (ok) {
							break;
						}
					}
					if (!ok) {
						this.isOver();
						this.mySetData({
							errMsg: '当前设备不属于该服务商，请检查！'
						});
						return;
					}
				}
				this.mySetData({
					cardVersion,
					faceCardNumber
				});
				this.getSerialNumberAndVersion();
			} else {
				this.isOver();
				this.mySetData({
					errMsg: '获取卡片信息失败'
				});
				// 发送失败信息
				let cosArr = ['00A40000023F00', '00A40000021001', '00B095002b'];
				util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
			}
		});
	},
	// 从obu中读取信息
	getSerialNumberAndVersion () {
		console.log('读取obu信息');
		let tlv = dataHandler.makeTLV(['00A40000023F00', '00B081001B']);
		bleUtil.sendDataToDevice(dataUtil.make82SendData('20', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let reapdu = dataHandler.resolveTLV(retlv);
				let tempSysInfo = reapdu[1].slice(0, -4).toUpperCase();
				console.log(tempSysInfo);
				// 合同版本
				let version = reapdu[1].slice(18, 20);
				console.log('合同版本:' + version);
				// 截取合同号
				let serialNumber = reapdu[1].slice(20, 36);
				console.log('合同序列号：' + serialNumber);
				this.mySetData({
					sysInfo: tempSysInfo,
					version: version,
					serialNumber: serialNumber
				});
				// this.checkActive();
				this.getOrderInfo();
			} else {
				this.isOver();
				this.mySetData({
					errMsg: '获取随机数失败'
				});
				// 发送失败信息
				let cosArr = ['00A40000023F00', '00B081001B'];
				util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
			}
		});
	},
	// 检查obu是否已经激活
	checkActive () {
		let params = {
			currentUserId: app.globalData.memberId,
			orderId: app.globalData.orderInfo.orderId
		};
		util.getDataFromServer(this.data.urlPrefix + '/seekOBUStatus', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: '获取二发状态失败'
			});
		}, (res) => {
			// 已经进行了二发
			if (res.code === 0) {
				util.alert({
					content: '已开卡，请勿重复操作'
				});
			} else {
				this.getOrderInfo();
			}
		});
	},
	// 获取订单信息
	getOrderInfo () {
		let params = {
			currentUserId: app.globalData.memberId,
			orderId: app.globalData.orderInfo.orderId
		};
		// this.getDataFromServer(this.data.host + 'qhzy/seekBaseData', params, () => {
		util.getDataFromServer(this.data.urlPrefix + '/seekBaseData', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: '获取订单信息失败！'
			});
		}, (res) => {
			if (res.code === 0) {
				res = res.data;
				let info = {
					plateNo: res.memberCar.number,
					plateColor: res.memberCar.numberColor,
					carType: res.memberCar.carVehicleType,
					userName: res.memberInfo.trueName,
					userIdNum: res.memberInfo.idNumber,
					userIdType: '0',
					type: res.memberCar.carVehicleType,
					outsideDimensions: res.memberCar.size,
					engineNum: res.memberCar.engineNo,
					approvedCount: res.memberCar.personsCapacity
				};
				// 计算卡片有效期
				info = util.calculationValidityPeriod(info);
				let isOk = util.validateOnlineDistribution(encodeToGb2312, info, this);
				// 校验通过
				if (isOk) {
					this.mySetData({
						info: info
					});
					this.sendExpInfo();
				}
			} else {
				this.isOver();
				this.mySetData({
					errMsg: res.message
				});
			}
		});
	},
	// 发送邮寄信息到服务器
	sendExpInfo () {
		let params = {
			orderId: app.globalData.orderInfo.orderId
		};
		// this.getDataFromServer(this.data.host + 'qhzy/mailSend', params, () => {
		util.getDataFromServer(this.data.urlPrefix + '/mailSend', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: '邮寄信息提交失败'
			});
		}, (res) => {
			if (res.code === 0) {
				this.sendObuInfoToServer();
			} else {
				this.isOver();
				this.mySetData({
					errMsg: res.message
				});
			}
		});
	},
	// 发送obu信息到后台
	sendObuInfoToServer () {
		this.mySetData({
			msg: '提交中...'
		});
		let params = {
			orderId: app.globalData.orderInfo.orderId,
			obuId: this.data.serialNumber,
			status: 1
		};
		// this.getDataFromServer(this.data.host + 'qhzy/ObuSendBack', params, () => {
		util.getDataFromServer(this.data.urlPrefix + '/ObuSendBack', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: '提交OBU信息失败'
			});
		}, (res) => {
			if (res.code === 0) {
				console.log('提交Obu信息成功');
				this.get4BitRandomByESAMForWriteSysInfo();
			} else {
				this.isOver();
				this.mySetData({
					errMsg: res.message
				});
			}
		});
	},
	// 通过esam通道获取8位随机数 -- 系统信息
	get4BitRandomByESAMForWriteSysInfo () {
		this.mySetData({
			msg: '数据写入中...'
		});
		console.log('写入系统数据开始');
		let tlv = dataHandler.makeTLV(['00A40000023F00', '0084000004']);
		bleUtil.sendDataToDevice(dataUtil.make82SendData('20', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let reapdu = dataHandler.resolveTLV(retlv);
				let info = reapdu[1];
				let random = info.substring(0, 8);
				this.mySetData({
					random: random.toUpperCase()
				});
				console.log('8位随机数：' + random.toUpperCase());
				this.requestToWriteSysInfo();
			} else {
				this.isOver();
				this.mySetData({
					errMsg: '获取随机数失败'
				});
				// 发送失败信息
				let cosArr = ['00A40000023F00', '0084000004'];
				util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
			}
		});
	},
	// 获取写入系统信息数据
	requestToWriteSysInfo () {
		let cmd = this.getSysInfoCMD(this.data.info, this.data.sysInfo);
		let params = {
			version: parseInt(this.data.version, 16) + '',
			appID: this.data.serialNumber,
			rand: this.data.random,
			apdu: cmd,
			fileType: '01'
		};
		// this.getDataFromServer(this.data.host + 'qhzy/OBUPersonalize', params, () => {
		util.getDataFromServer(this.data.urlPrefix + '/OBUPersonalize', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: '获取写入系统信息数据失败'
			});
		}, (res) => {
			if (res.code === 0) {
				this.writeDataToObuForSysInfo(res);
			} else {
				this.isOver();
				this.mySetData({
					errMsg: res.message
				});
			}
		});
	},
	// 写入系统信息
	writeDataToObuForSysInfo (res) {
		console.log(res.data.apdu + res.data.mac);
		let tlv = dataHandler.makeTLV([res.data.apdu + res.data.mac]);
		bleUtil.sendDataToDevice(dataUtil.make82SendData('20', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let result = dataHandler.resolveTLV(retlv)[0];
				if (result === '9000') {
					console.log('写系统数据正常结束');
					this.confirmSysInfo(res.data.apdu, '00', res.data.proListNo);
				} else {
					this.confirmSysInfo(res.data.apdu, '01', res.data.proListNo);
					// 发送失败信息
					let cosArr = [res.data.apdu + res.data.mac];
					util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
				}
			} else {
				this.confirmSysInfo(res.data.apdu, '01', res.data.proListNo);
				// 发送失败信息
				let cosArr = [res.data.apdu + res.data.mac];
				util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
			}
		});
	},
	// 发送数据到后台确定写入是否成功
	confirmSysInfo (apdu, result, preListNo) {
		let params = {
			version: parseInt(this.data.version, 16) + '',
			appID: this.data.serialNumber,
			proListNo: preListNo,
			apdu: apdu,
			result: result
		};
		// this.getDataFromServer(this.data.host + 'qhzy/OBUPersonalizeConfirm', params, () => {
		util.getDataFromServer(this.data.urlPrefix + '/OBUPersonalizeConfirm', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: '确认系统信息是否写入成功失败！'
			});
		}, (res) => {
			if (res.code === 0) {
				// 系统写入成功确认
				if (result === '00') {
					console.log('写入系统信息确认成功');
					this.get4BitRandomByESAMForWriteAppInfo();
				} else {
					this.isOver();
					this.mySetData({
						errMsg: '写入系统数据失败，请重试!'
					});
				}
			} else {
				this.isOver();
				this.mySetData({
					errMsg: res.message
				});
			}
		});
	},
	// 通过esam通道获取8位随机数 -- 车辆信息
	get4BitRandomByESAMForWriteAppInfo () {
		console.log('写入应用数据开始');
		let tlv = dataHandler.makeTLV(['00A4000002DF01', '0084000004']);
		bleUtil.sendDataToDevice(dataUtil.make82SendData('20', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let reapdu = dataHandler.resolveTLV(retlv);
				let info = reapdu[1];
				let random = info.substring(0, 8);
				this.mySetData({
					random: random.toUpperCase()
				});
				console.log('8位随机数：' + random.toUpperCase());
				this.requestToWriteAppInfo();
			} else {
				this.isOver();
				this.mySetData({
					errMsg: '获取随机数失败'
				});
				// 发送失败信息
				let cosArr = ['00A4000002DF01', '0084000004'];
				util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
			}
		});
	},
	// 获取写入车辆信息数据
	requestToWriteAppInfo () {
		let cmd = this.getAppInfoCMD(this.data.info);
		let params = {
			version: parseInt(this.data.version, 16) + '',
			appID: this.data.serialNumber,
			rand: this.data.random,
			apdu: cmd,
			fileType: '02'
		};
		// this.getDataFromServer(this.data.host + 'qhzy/OBUPersonalize', params, () => {
		util.getDataFromServer(this.data.urlPrefix + '/OBUPersonalize', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: '获取写入车辆信息数据失败'
			});
		}, (res) => {
			if (res.code === 0) {
				this.writeDataToObuForAppInfo(res);
			} else {
				this.isOver();
				this.mySetData({
					errMsg: res.message
				});
			}
		});
	},
	// 写入车辆信息到obu
	writeDataToObuForAppInfo (res) {
		console.log(res.data.apdu + res.data.mac);
		let tlv = dataHandler.makeTLV([res.data.apdu + res.data.mac]);
		bleUtil.sendDataToDevice(dataUtil.make82SendData('20', tlv), (code, data, msg) => {
			console.log(data);
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let result = dataHandler.resolveTLV(retlv)[0];
				if (result === '9000') {
					console.log('写入车辆数据正常结束');
					this.confirmAppInfo(res.data.apdu, '00', res.data.proListNo);
				} else {
					this.confirmAppInfo(res.data.apdu, '01', res.data.proListNo);
					// 发送失败信息
					let cosArr = [res.data.apdu + res.data.mac];
					util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
				}
			} else {
				this.confirmAppInfo(res.data.apdu, '01', res.data.proListNo);
				// 发送失败信息
				let cosArr = [res.data.apdu + res.data.mac];
				util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
			}
		});
	},
	// 发送是否写入成功到后台
	confirmAppInfo (apdu, result, preListNo) {
		let params = {
			version: parseInt(this.data.version, 16) + '',
			appID: this.data.serialNumber,
			proListNo: preListNo,
			apdu: apdu,
			result: result
		};
		// this.getDataFromServer(this.data.host + 'qhzy/OBUPersonalizeConfirm', params, () => {
		util.getDataFromServer(this.data.urlPrefix + '/OBUPersonalizeConfirm', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: '确认车辆信息是否写入成功失败！'
			});
		}, (res) => {
			if (res.code === 0) {
				// 应用写入成功确认
				if (result === '00') {
					console.log('写入车辆信息确认成功');
					this.sendCardInfoToServer();
				} else {
					this.isOver();
					this.mySetData({
						errMsg: '写入车辆信息数据失败，请重试!'
					});
				}
			} else {
				this.isOver();
				this.mySetData({
					errMsg: res.message
				});
			}
		});
	},
	// 发送卡信息到后台
	sendCardInfoToServer () {
		this.mySetData({
			msg: '提交中...'
		});
		let params = {
			orderId: app.globalData.orderInfo.orderId,
			cardId: this.data.faceCardNumber,
			status: 1
		};
		// this.getDataFromServer(this.data.host + 'qhzy/cardSendBack', params, () => {
		util.getDataFromServer(this.data.urlPrefix + '/cardSendBack', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: '提交卡信息失败'
			});
		}, (res) => {
			if (res.code === 0) {
				console.log('提交卡信息成功');
				this.get4BitRandomByPICCFor0015();
			} else {
				this.isOver();
				this.mySetData({
					errMsg: res.message
				});
			}
		});
	},
	// 通过picc通道获取8位随机数 0015
	get4BitRandomByPICCFor0015 () {
		this.mySetData({
			msg: '数据写入中...'
		});
		console.log('写0015数据开始');
		let tlv = dataHandler.makeTLV(['00A40000021001', '00B095002B', '0084000004']);
		bleUtil.sendDataToDevice(dataUtil.make82SendData('10', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let reapdu = dataHandler.resolveTLV(retlv);
				let carInfo = reapdu[1].substring(0, reapdu[1].length - 4);
				console.log(carInfo);
				let info = reapdu[2];
				let random = info.substring(0, 8).toUpperCase();
				this.mySetData({
					random
				});
				let cmd = this.get0015CMD(this.data.info, carInfo);
				console.log(cmd);
				this.requestDataFor0015(cmd);
			} else {
				this.isOver();
				this.mySetData({
					errMsg: '获取随机数失败'
				});
				// 发送失败信息
				let cosArr = ['00A40000021001', '00B095002B', '0084000004'];
				util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
			}
		});
	},
	// 请求写0015数据
	requestDataFor0015 (cmd) {
		let params = {
			version: parseInt(this.data.cardVersion, 16) + '',
			appID: this.data.faceCardNumber.substring(4),
			rand: this.data.random,
			apdu: cmd,
			fileType: '02'
		};
		// this.getDataFromServer(this.data.host + 'qhzy/CardPersonalize', params, () => {
		util.getDataFromServer(this.data.urlPrefix + '/CardPersonalize', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: '获取0015写入数据失败'
			});
		}, (res) => {
			if (res.code === 0) {
				this.writeDataToCardFor0015(res);
			} else {
				this.isOver();
				this.mySetData({
					errMsg: res.message
				});
			}
		});
	},
	// 写入0015数据
	writeDataToCardFor0015 (res) {
		console.log(res.data.apdu + res.data.mac);
		let tlv = dataHandler.makeTLV([res.data.apdu + res.data.mac]);
		bleUtil.sendDataToDevice(dataUtil.make82SendData('10', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let result = dataHandler.resolveTLV(retlv)[0];
				if (result === '9000') {
					console.log('写入0015数据正常结束');
					this.confirm0015(res.data.apdu, '00', res.data.proListNo);
				} else {
					this.confirm0015(res.data.apdu, '01', res.data.proListNo);
					// 发送失败信息
					let cosArr = [res.data.apdu + res.data.mac];
					util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
				}
			} else {
				this.confirm0015(res.data.apdu, '01', res.data.proListNo);
				// 发送失败信息
				let cosArr = [res.data.apdu + res.data.mac];
				util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
			}
		});
	},
	// 发送是否写入0015成功到后台
	confirm0015 (apdu, result, preListNo) {
		let params = {
			version: parseInt(this.data.cardVersion, 16) + '',
			appID: this.data.faceCardNumber.substring(4),
			proListNo: preListNo,
			apdu: apdu,
			result: result
		};
		// this.getDataFromServer(this.data.host + 'qhzy/CardPersonalizeConfirm', params, () => {
		util.getDataFromServer(this.data.urlPrefix + '/CardPersonalizeConfirm', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: '确认0015是否写入成功失败！'
			});
		}, (res) => {
			if (res.code === 0) {
				// 0015写入成功确认
				if (result === '00') {
					this.get4BitRandomByPICCFor0016();
				} else {
					this.isOver();
					this.mySetData({
						errMsg: '写入0015数据失败，请重试!'
					});
				}
			} else {
				this.isOver();
				this.mySetData({
					errMsg: res.message
				});
			}
		});
	},
	// 通过picc通道获取8位随机数 -- 0016
	get4BitRandomByPICCFor0016 () {
		console.log('写入0016数据开始');
		let tlv = dataHandler.makeTLV(['00A40000023F00', '0084000004']);
		bleUtil.sendDataToDevice(dataUtil.make82SendData('10', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let reapdu = dataHandler.resolveTLV(retlv);
				let info = reapdu[1];
				let random = info.substring(0, 8).toUpperCase();
				this.mySetData({
					random
				});
				console.log('0016-8位随机数：' + random);
				this.requestDataFor0016();
			} else {
				this.isOver();
				this.mySetData({
					errMsg: '获取随机数失败'
				});
				// 发送失败信息
				let cosArr = ['00A40000023F00', '0084000004'];
				util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
			}
		});
	},
	// 请求写0016数据
	requestDataFor0016 () {
		let cmd = this.get0016CMD(this.data.info);
		let params = {
			version: parseInt(this.data.cardVersion, 16) + '',
			appID: this.data.faceCardNumber.substring(4),
			rand: this.data.random,
			apdu: cmd,
			fileType: '01'
		};
		// this.getDataFromServer(this.data.host + 'qhzy/CardPersonalize', params, () => {
		util.getDataFromServer(this.data.urlPrefix + '/CardPersonalize', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: '获取0015写入数据失败'
			});
		}, (res) => {
			if (res.code === 0) {
				this.writeDataToCardFor0016(res);
			} else {
				this.isOver();
				this.mySetData({
					errMsg: res.message
				});
			}
		});
	},
	// 写入0016数据
	writeDataToCardFor0016 (res) {
		console.log(res.data.apdu + res.data.mac);
		let tlv = dataHandler.makeTLV([res.data.apdu + res.data.mac]);
		bleUtil.sendDataToDevice(dataUtil.make82SendData('10', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let result = dataHandler.resolveTLV(retlv)[0];
				if (result === '9000') {
					console.log('写入0016数据正常结束');
					this.confirm0016(res.data.apdu, '00', res.data.proListNo);
				} else {
					this.confirm0016(res.data.apdu, '01', res.data.proListNo);
					// 发送失败信息
					let cosArr = [res.data.apdu + res.data.mac];
					util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
				}
			} else {
				this.confirm0016(res.data.apdu, '01', res.data.proListNo);
				// 发送失败信息
				let cosArr = [res.data.apdu + res.data.mac];
				util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
			}
		});
	},
	// 发送是否写入0016成功到后台
	confirm0016 (apdu, result, preListNo) {
		let params = {
			version: parseInt(this.data.cardVersion, 16) + '',
			appID: this.data.faceCardNumber.substring(4),
			proListNo: preListNo,
			apdu: apdu,
			result: result
		};
		// this.getDataFromServer(this.data.host + 'qhzy/CardPersonalizeConfirm', params, () => {
		util.getDataFromServer(this.data.urlPrefix + '/CardPersonalizeConfirm', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: '确认0016是否写入成功失败！'
			});
		}, (res) => {
			if (res.code === 0) {
				// 0015写入成功确认
				if (result === '00') {
					this.get4BitRandomByESAMForActive(apdu);
				} else {
					this.isOver();
					this.mySetData({
						errMsg: '写入0016数据失败，请重试!'
					});
				}
			} else {
				this.isOver();
				this.mySetData({
					errMsg: res.message
				});
			}
		});
	},
	// 通过esam通道获取8位随机数 写入激活信息
	get4BitRandomByESAMForActive (apdu) {
		this.mySetData({
			msg: '数据写入中...'
		});
		console.log('激活开始');
		let tlv = dataHandler.makeTLV(['00A40000023F00', '0084000004']);
		bleUtil.sendDataToDevice(dataUtil.make82SendData('20', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let reapdu = dataHandler.resolveTLV(retlv);
				let info = reapdu[1];
				let random = info.substring(0, 8);
				this.mySetData({
					random: random.toUpperCase()
				});
				console.log('8位随机数：' + random.toUpperCase());
				this.requestDataForActive(apdu);
			} else {
				this.isOver();
				this.mySetData({
					errMsg: '激活失败'
				});
				// 发送失败信息
				let cosArr = ['00A40000023F00', '0084000004'];
				util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
			}
		});
	},
	// 获取请求参数
	requestDataForActive (apdu) {
		let params = {
			apdu: apdu,
			cardID: this.data.faceCardNumber,
			version: parseInt(this.data.version, 16) + '',
			appID: this.data.serialNumber,
			rand: this.data.random
		};
		// this.getDataFromServer(this.data.host + 'qhzy/OBUActive', params, () => {
		util.getDataFromServer(this.data.urlPrefix + '/OBUActive', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: '获取OBU激活数据失败'
			});
		}, (res) => {
			if (res.code === 0) {
				console.log('提交Obu信息成功');
				this.writeDataToObuForActive(res);
			} else {
				this.isOver();
				this.mySetData({
					errMsg: res.message
				});
			}
		});
	},
	// 写入数据到obu
	writeDataToObuForActive (res) {
		let tlv = dataHandler.makeTLV([res.data.apdu + res.data.mac]);
		bleUtil.sendDataToDevice(dataUtil.make82SendData('20', tlv), (code, data, msg) => {
			if (code === 0 && data.slice(2, 4) === '00') {
				let retlv = data.slice(10);
				let result = dataHandler.resolveTLV(retlv)[0];
				if (result === '9000') {
					this.confirmObuActive('00', res.data.proListNo);
				} else {
					this.confirmObuActive('01', res.data.proListNo);
					// 发送失败信息
					let cosArr = [res.data.apdu + res.data.mac];
					util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
				}
			} else {
				this.confirmObuActive('01', res.data.proListNo);
				// 发送失败信息
				let cosArr = [res.data.apdu + res.data.mac];
				util.sendException2Server(`青海二发埃特斯：${JSON.stringify(this.data.info)}`, cosArr, code, data);
			}
		});
	},
	// 确认激活
	confirmObuActive (result, proListNo) {
		this.mySetData({
			msg: '激活确认中...'
		});
		let params = {
			activeType: '1',// 激活方式	1-自行激活 2-网点激活
			activeChannel: '2',// 激活渠道	1-APP,2-微信小程序,3-支付宝小程序 4- 线下网点渠道
			orderId: app.globalData.orderInfo.orderId,
			version: parseInt(this.data.version, 16) + '',
			appID: this.data.serialNumber,
			result: result,
			proListNo: proListNo
		};
		// this.getDataFromServer(this.data.host + 'qhzy/OBUActiveConfirm', params, () => {
		util.getDataFromServer(this.data.urlPrefix + '/OBUActiveConfirm', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: '激活确认失败'
			});
		}, (res) => {
			if (res.code === 0) {
				if (result === '00') {
					this.sendActiveInfo();
				} else {
					this.isOver();
					this.mySetData({
						errMsg: '激活失败'
					});
				}
			} else {
				this.isOver();
				this.mySetData({
					errMsg: res.message
				});
			}
		});
	},
	// 发送激活信息到服务
	sendActiveInfo () {
		let params = {
			obuId: this.data.serialNumber
		};
		// this.getDataFromServer(this.data.host + 'qhzy/ObuActiveSend', params, () => {
		util.getDataFromServer(this.data.urlPrefix + '/ObuActiveSend', params, () => {
			this.isOver();
			this.mySetData({
				errMsg: 'OBU激活信息提交失败'
			});
		}, (res) => {
			if (res.code === 0) {
				wx.uma.trackEvent('activate_the_success');
				this.mySetData({
					isActivating: true,
					activated: true
				});
			} else {
				this.isOver();
				const err = res.message.includes('保存OBU激活信息异常') ? `${res.message}，请等待几分钟后重试` : res.message;
				this.mySetData({
					errMsg: err
				});
			}
		});
	},
	onUnload () {
		// 断开连接 关闭蓝牙适配器
		wx.closeBLEConnection({
			success: (res) => {
				wx.closeBluetoothAdapter();
			},
			fail: (res) => {
				wx.closeBluetoothAdapter();
			}
		});
	}
});
