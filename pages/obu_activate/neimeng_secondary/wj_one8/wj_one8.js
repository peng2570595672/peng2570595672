/*
* 内蒙obu连接蓝牙激活
 */
const util = require('../../../../utils/util.js');
const bleUtil = require('../../../../libs/neimeng_wjone8_sdk/wjBleAPI.js');

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
		this.setData({msg: '正在连接OBU设备...'});
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
				connectBle({device_name: device.name, device_id: device.deviceId});	// 连接 OBU 设备
			});
		};
		// 连接 OBU 设备
		const connectBle = device => {
			wx.stopBluetoothDevicesDiscovery({
				success: res => {
					console.log('停止搜索');
					bleUtil.connectDevice2(device, (res) => {
						console.log('连接反馈：', res);
						if (res.serviceCode) {
							console.warn('连接 & 部署设备失败');
							this.setData({
								connectState: 2,
								getListFailed: 0
							});
							this.setData({errMsg: 'OBU连接失败'});
						} else {
							console.log('连接 & 部署设备成功');
							this.setData({
								connectState: 1,
								getListFailed: 0
							});
							this.setData({msg: 'OBU连接成功'});
						}
					});
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
		this.getContractInfo();
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
					// IssuerMarking,
					// protocolType,
					version: contractVersion,
					rand: contractNumber,
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
					carInfoFromCard: info.slice(0, -4).toUpperCase()
				});
				this.getRandomForReadCarInfoFromOBU();
			} else {
				this.isOver('读取卡片信息失败');
			}
		});
	},
	// 为读取OBU中车辆信息获取随机数
	getRandomForReadCarInfoFromOBU () {
		let cosArr = [];
		cosArr.push('00A4000002DF01');
		cosArr.push('0084000004');
		this.transCommand(1, cosArr, (code, res) => {
			console.log(res);
			// 获取随机数
			let random = res[1].slice(0, -4).toUpperCase();
			console.log('1001-8位随机数：', random);
			this.getCarInfoFromObu(random);
		});
	},
	// 读取车牌信息
	getCarInfoFromObu (random) {
		let cosArr = [];
		cosArr.push(`00B400000A${random}000000004F00`);
		this.transCommand(1, cosArr, (code, res) => {
			console.log(res);
			if (!/9000$/.test(res[0])) {
				this.isOver('获取车辆密文信息失败');
				return;
			}
			let info = res[0];
			this.setData({
				carInfoFromOBU: info.slice(0, -4).toUpperCase()
			});
			this.getRandomForActivate();
		});
	},
	// 获取激活obu随机数
	getRandomForActivate () {
		let cosArr = [];
		cosArr.push('00A40000023F00');
		cosArr.push('0084000004');
		this.transCommand(1, cosArr, (code, res) => {
			console.log(res);
			// 获取随机数
			let random = res[1].slice(0, -4).toUpperCase();
			console.log('3F00-8位随机数：', random);
			this.requestServer(random);
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
		let cmd = res.data.FileData + res.data.Mac;
		let cosArr = [];
		cosArr.push(cmd);
		console.log('激活obu指令：', cmd);
		this.transCommand(1, cosArr, (code, res) => {
			console.log('激活obu返回：', res);
			// 写卡
			if (!/9000$/.test(res[0])) {
				this.isOver('激活obu失败');
				return;
			}
			// 调用确认接口
			this.requestServerForComfirm();
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
							if (/WJ|WanJi|HN|NM/.test(res.devices[i].name)) {
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
	// process cmd-array to cmd-string
	processs21 (arr) {
		let count = 1;
		let len;
		let cmds = '';
		let format = (n) => {
			n = (+n).toString(16).toUpperCase();
			if (n.length < 2) return '0' + n;
			return n;
		};
		for (let cmd of arr) {
			len = cmd.length / 2;
			cmds += `${format(count++)}${format(len)}${cmd}`;
		}
		return cmds;
	},
	// process result-string to result-array
	process12s (res) {
		let arr = [];
		let len, curr;
		let security = +new Date();	// 迭代安全机制
		while (res.length) {
			if (+new Date() - security > 5000) {	// 迭代安全机制，超时时间 5 秒
				console.error('解析超时：', res, arr);
				break;
			}
			len = res.substr(2, 2);	// 当前响应的长度
			len = parseInt(len, 16) * 2;	// 16进制转10进制
			res = res.substr(4);	// 去掉序号和长度字节
			curr = res.substr(0, len);	// 截取当前响应
			arr.push(curr);
			res = res.substr(len);	// 截掉当前响应部分
		}
		return arr;
	},
	// type 0: 卡；1: obu
	transCommand (type, arr, callback) {
		let cmds = '';
		let channel = '00';
		switch (type) {
			case 0: channel = 'A3'; break;
			case 1: channel = 'A7'; break;
		}
		cmds = this.processs21(arr);
		console.log('拼装前的指令：', arr);
		console.log('拼装后的指令：', cmds);
		bleUtil.transCmd(cmds, '00', channel, (res) => {
			let results;
			console.log(res);
			console.log('err');
			results = this.process12s(res.serviceData.dataBuff);
			console.log(results);
			callback(res.serviceCode, results);
		});
	},
	onHide () {
		wx.closeBluetoothAdapter();
	}
});
