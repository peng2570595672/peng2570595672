/**
 * 天津obu连接蓝牙激活
**/
const util = require('../../../../utils/util.js');
const bleUtil = require('../../libs/tianjin_wj_sdk/wjBleAPI.js');

const SUCCESS_CODE = '0';
const FAILED_CODE = '1';
const app = getApp();
let timer;
Page({
	data: {
		showLoading: 1, // 是否显示搜索中
		getListFailed: 0, // 获取obu设备
		deviceName: '', // 设备名称
		connectState: -1, // 是否已连接 默认连接中 -1:未初始化状态；1:已连接；2:连接失败
		isActivating: 0, // 是否激活
		// obuid: undefined, // obuid
		// obuNum: undefined, // obu编号
		obuBrand: 7, // obu品牌
		model: 'W-115B+', // obu型号
		cardVersion: undefined, // 卡版本
		faceCardNumber: undefined, // 卡号
		IssuerMarking: undefined,	// 发行方标识
		protocolType: undefined,	// 协议类型
		contractVersion: undefined,	// 合同版本
		contractNumber: undefined,	// 合同序列号
		startTime: undefined, // 启用时间
		endTime: undefined, // 过期时间
		cardType: undefined, // 卡类型
		cardBrand: undefined, // 卡品牌
		host: '',
		errMsg: '',
		msg: '',
		activated: 0
	},
	returnMiniProgram () {
		util.returnMiniProgram();
	},
	onLoad () {
		this.setData({
			urlPrefix: 'consumer/etc/tj/common'
			// host: 'http://192.168.69.6:10021/tj/v2/etc/cardonline'	// 奎安电脑
			// host: 'http://192.168.2.158:10021/tj/v2/etc/cardonline'	// 奎安电脑
			// host: 'http://192.168.2.173:10021/tj/v2/etc/cardonline'	// 奎安台式机
		});
		this.start();
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
		const failed = (isUnfound) => { this.setData({showLoading: 0, getListFailed: ~~isUnfound, connectState: 2}); };
		// 打开蓝牙适配器
		const openBle = () => {
			this.openBle(code => {
				if (+code) { failed(1); } else { scanBle(); }	// 搜索 OBU 设备
			});
		};
		// 搜索 OBU 设备
		const scanBle = () => {
			this.scanBle(device => {
				if (+device === 1) return failed(1);
				console.log('搜索到设备：', device);
				clearTimeout(timer);
				this.setData({
					deviceName: device.name || device.localName,
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
							failed();
						} else {
							console.log('连接 & 部署设备成功');
							// 读取系统信息
							this.getContractInfo();
						}
					});
				}
			});
		};
		wx.openBluetoothAdapter({fail: res => { failed(1); }, success: openBle});
	},
	// 点击按钮
	go () {
		// 激活
		if (this.data.connectState !== 1 && this.data.getListFailed) {
			wx.uma.trackEvent('activation_failed_retry');
		}
		if (this.data.connectState === 1) {
			if (this.data.isActivating) return;
			this.setData({isActivating: 1, errMsg: '', msg: '设备激活中...'});
			// 二次激活
			this.uploadObuSysInfo();
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
				// 读取卡片信息
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
		cosArr.push('0020000003123456');	// 0020 0000 pin码位数 pin码
		cosArr.push('00B095002B');
		this.transCommand(0, cosArr, (code, res) => {
			console.log('读取卡片信息：');
			console.log(code);
			console.log(res);
			if (!/9000$/.test(res[1])) return this.isOver('pin验证失败');
			let info = res[2];
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
				let cBrand = cardId.substr(6, 2);
				let cardBrand = '';
				switch (+cBrand) {
					// 握奇
					case 1: cardBrand = 2; break;
					// 航天
					case 2: cardBrand = 7; break;
					// 捷德
					case 3: cardBrand = 1; break;
					// 天喻
					case 4: cardBrand = 3; break;
					// 四川科道
					case 5: cardBrand = 1; break;
					// 未知卡品牌
					default: this.isOver(`未知卡品牌：${cBrand}`); return;
				}
				console.log('卡品牌：', cBrand, cardBrand);
				this.setData({
					cardType,
					cardVersion,
					faceCardNumber,
					cardId,
					startTime,
					endTime,
					cardBrand
				});
				// 显示设备连接成功信息
				this.setData({connectState: 1, msg: 'OBU连接成功'});
			} else {
				this.isOver('读取卡片信息失败');
			}
		});
	},

	// 7. 更新obu信息（obu系统信息 operateType: 3）
	uploadObuSysInfo () {
		new Promise((resolve, reject) => {
			let cosArr = [];
			cosArr.push('00A40000023F00');
			cosArr.push('00B081001B');
			cosArr.push('0084000004');
			this.transCommand(1, cosArr, (code, res) => {
				console.log(res);
				// obu sysinfo
				let tempSysInfo = res[1].slice(0, -4).toUpperCase();
				let sysInfo = [];
				// 以byte为单位，转成array
				[...new Array(tempSysInfo.length).keys()].map((i) => {
					if (i % 2) return;
					sysInfo.push(tempSysInfo.substr(i, 2));
				});

				// 获取随机数
				let random = res[2].slice(0, -4).toUpperCase();
				console.log('0015-8位随机数：', random);
				resolve({random, sysInfo});
			});
		}).then(({random, sysInfo}) => {
			// 随机数 8字节 00补位
			random += '00000000';

			// 拼接指令
			let cmd = '04D681001F';

			// 拆卸状态
			sysInfo[26] = '01';

			console.log('sysInfo: ', sysInfo);
			// 转string
			sysInfo = sysInfo.join('');

			// 拼接指令
			cmd += sysInfo;
			console.log('7. 指令：', cmd);
			// 请求接口
			return new Promise((resolve, reject) => {
				let params = {
					// 随机数
					initialData: random,
					// 分散因子
					scatterData: this.data.contractNumber,
					// 操作类型 1.持卡人信息，2.卡发行信息，3.更新Obu系统信息，4.更新Obu车辆信息（非货车），5.更新Obu车辆信息（货车）
					operateType: 3,
					// 指令拼接字符串
					mac: cmd
				};
				util.getDataFromServer(`${this.data.urlPrefix}/tj-update-equipment-info`, params, () => {
					this.isOver('更新obu系统信息失败');
				}, (res) => {
					if (+res.code || +res.data.code) {
						this.isOver(res.data.message);
					} else {
						// 在线秘钥返回值
						let mac2 = res.data.message;
						if (mac2.length !== 8) {
							this.isOver('在线秘钥获取失败（更新obu系统信息）');
							return;
						}
						// 写入数据到obu
						resolve(cmd + mac2);
					}
				});
			});
		}).then((cmd) => {
			// 写入数据到obu
			let cosArr = [];
			cosArr.push(cmd);
			this.transCommand(1, cosArr, (code, res) => {
				console.log('写obu（系统信息）返回：', res);
				// 写obu
				if (!/9000$/.test(res[0])) {
					this.isOver('写obu（系统信息）失败');
					return;
				}
				// 己方数据库设备激活
				this.activateData();
			});
		});
	},
	// 10. 己方数据库设备激活
	activateData () {
		let params = {
			// 订单ID
			orderId: app.globalData.orderInfo.orderId,
			// 卡号
			cardId: this.data.cardId,
			// obu编号
			obuId: this.data.contractNumber
		};
		util.getDataFromServer(`${this.data.urlPrefix}/user-confirm-info`, params, () => {
			this.isOver('数据库设备激活失败');
		}, (res) => {
			if (+res.code) {
				this.isOver(res.message);
			} else {
				wx.uma.trackEvent('activate_the_success');
				this.setData({msg: '', activated: 1});
			}
		});
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
							if (/WJ|WanJi/.test(res.devices[i].name)) {
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
		let cmdType;
		switch (type) {
			case 0: cmdType = '10'; break;
			case 1: cmdType = '20'; break;
		}
		cmds = this.processs21(arr);
		console.log('拼装前的指令：', arr);
		console.log('拼装后的指令：', cmds);
		bleUtil.transCommand(cmds, cmdType, '82', (res) => {
			let results;
			console.log(res);
			results = this.process12s(res.serviceData.dataBuff);
			console.log(results);
			callback(res.serviceCode, results);
		});
	},
	onHide () {
		wx.closeBluetoothAdapter();
	}
});
