/**
 * 天津obu连接蓝牙激活
**/
const util = require('../../../../utils/util.js');
const bleUtil = require('../../libs/tianjin_jy_sdk/GenvictBleUtil.js');
const encodeToGb2312 = require('../../libs/encodeToGb2312.js').encodeToGb2312;
const app = getApp();
let timer;
Page({
	data: {
		balance: 0,	// 余额
		showLoading: 1, // 是否显示搜索中
		getListFailed: 0, // 获取obu设备
		deviceName: '', // 设备名称
		connectState: -1, // 是否已连接 默认连接中 -1:未初始化状态；1:已连接；2:连接失败
		isActivating: 0, // 是否激活
		// obuid: undefined, // obuid
		// obuNum: undefined, // obu编号
		obuBrand: 2, // obu品牌
		model: 'Sophia-V60c+', // obu型号
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
	onLoad () {
		// // TODO TEST CODE
		// app.globalData.orderInfo.orderId = '686626185374863360';

		this.setData({
			// host: app.globalData.host + 'consumer/etc/tj/common'
			urlPrefix: 'consumer/etc/tj/common'
			// urlPrefix: 'http://192.168.0.129:8658/consumer/tj/common'
			// host: 'http://192.168.2.158:10021/tj/v2/etc/cardonline'	// 奎安电脑
			// host: 'http://192.168.2.173:10021/tj/v2/etc/cardonline'	// 奎安台式机
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
		this.setData({msg: '正在连接OBU设备...'});
		// 所有操作失败的回调
		const failed = (isUnfound) => { this.setData({showLoading: 0, getListFailed: ~~isUnfound, connectState: 2}); };
		// 打开蓝牙适配器
		const openBle = () => {
			bleUtil.openBle(code => {
				if (+code) { failed(1); } else { scanBle(); }	// 搜索 OBU 设备
			});
		};
		// 搜索 OBU 设备
		const scanBle = () => {
			bleUtil.scanBle(device => {
				if (+device === 1) return failed(1);
				console.log('搜索到设备：', device);
				clearTimeout(timer);
				this.setData({
					deviceName: device.name || device.localName,
					showLoading: 0,
					getListFailed: 0
				});
				connectBle(device);	// 连接 OBU 设备
			});
		};
		// 连接 OBU 设备
		const connectBle = device => {
			bleUtil.connectBle(device, code => {
				if (+code) return failed();
				console.log('连接设备成功');
				deployBle();	// 部署 OBU 设备
			});
		};
		// 部署 OBU 设备
		const deployBle = () => {
			bleUtil.deployBle(code => {
				if (+code) return failed();
				console.log('部署设备成功');
				// 读取系统信息
				this.getContractInfo();
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
			this.setData({isActivating: 1, errMsg: '', msg: '读取设备中...'});
			// 获取步骤信息
			this.getCurrentStep();
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
	// 读取系统信息
	getContractInfo () {
		let cosArr = [];
		cosArr.push('00A40000023F00');
		cosArr.push('00B081001B');
		bleUtil.gvEsamChannel('20', cosArr, (code, res) => {
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
				if (app.globalData.newEmptyObuNo) {
					if (app.globalData.newEmptyObuNo !== contractNumber) {
						this.isOver(`当前设备卡号与下单设备卡号不一致`);
						return;
					}
				}
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
		bleUtil.cosChannel('00', cosArr, (code, res) => {
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

	// 根据当前步骤继续流程
	startCurrentStep (step, isUpdating) {
		// 0. 已开卡
		if (step === 0) {
			if (isUpdating) {
				wx.uma.trackEvent('activate_the_success');
				this.setData({msg: '', activated: 1});
				return;
			} else {
				this.setData({errMsg: '已开卡，请勿重复操作'});
				return;
			}
		}
		// 兼容老流程方案
		switch (true) {
			case step < 5: step = 1; break;
			case step === 5: step = 102; break;
			case step < 9: step = 103; break;
			case step === 9: step = 104; break;
			case step === 10: step = 105; break;
		}
		let title, fun;
		switch (step) {
			// 1（101）. 新增卡
			case 1: title = '新增卡信息...'; fun = this.increaseCard; break;
			// 102. 更新订单（卡发行 operateType: 1）
			case 102: title = '更新订单中...'; fun = this.uploadOrderForCard; break;
			// 103. 新增obu  （读obu信息
			case 103: title = '新增OBU信息...'; fun = this.increaseObu; break;
			// 104. 更新订单（obu发行 operateType: 2）
			case 104: title = '更新订单中...'; fun = this.uploadOrderForObu; break;
			// 105. 己方数据库设备激活
			case 105: title = '激活中...'; fun = this.activateData; break;
			// 未知值时，从第一步新增卡开始
			default: title = '新增卡信息...'; fun = this.increaseCard;
		}
		title && this.setData({msg: title});
		fun && fun();
	},
	// 获取步骤
	getCurrentStep () {
		this.setData({msg: '加载中...'});
		let params = {
			orderId: app.globalData.orderInfo.orderId
		};
		util.getDataFromServer(`${this.data.urlPrefix}/seekOrderStep`, params, () => {
			this.isOver('步骤信息获取失败');
		}, (res) => {
			console.log(res);
			if (+res.code) {
				this.isOver(res.message);
			} else {
				this.startCurrentStep(+res.stepNum);
			}
		});
		// wx.request({
		// 	url: `${this.data.host}/seekOrderStep`,
		// 	method: 'POST',
		// 	data: params,
		// 	success: (res) => {
		// 		console.log(res);
		// 		if (res.statusCode !== 200) {
		// 			this.isOver('步骤信息获取失败');
		// 			return;
		// 		}
		// 		res = res.data;
		// 		if (+res.code) {
		// 			this.isOver(res.message);
		// 		} else {
		// 			this.startCurrentStep(+res.stepNum);
		// 		}
		// 	},
		// 	fail: (res) => {
		// 		this.isOver('步骤信息获取失败');
		// 	}
		// });
	},
	// 保存和触发下一步流程
	updateCurrentStep (step) {
		this.setData({msg: '更新进度信息...'});
		let params = {
			orderId: app.globalData.orderInfo.orderId,
			stepnum: step
		};
		util.getDataFromServer(`${this.data.urlPrefix}/updateOrderStep`, params, () => {
			this.isOver('更新进度信息失败');
		}, (res) => {
			if (+res.code) {
				this.isOver(res.message);
			} else {
				this.startCurrentStep(step, 1);
			}
		});
		// wx.request({
		// 	url: `${this.data.host}/updateOrderStep`,
		// 	method: 'POST',
		// 	data: params,
		// 	success: (res) => {
		// 		if (res.statusCode !== 200) {
		// 			this.isOver('更新进度信息失败');
		// 			return;
		// 		}
		// 		res = res.data;
		// 		if (+res.code) {
		// 			this.isOver(res.message);
		// 		} else {
		// 			this.startCurrentStep(step, 1);
		// 		}
		// 	},
		// 	fail: (res) => {
		// 		this.isOver('更新进度信息失败');
		// 	}
		// });
	},
	// 1（101）. 新增卡
	increaseCard () {
		let params = {
			// 订单id
			orderId: app.globalData.orderInfo.orderId,
			// 卡号
			cardId: this.data.cardId,
			// 卡品牌
			brand: this.data.cardBrand
		};
		util.getDataFromServer(`${this.data.urlPrefix}/tj-card-add`, params, () => {
			this.isOver('新增卡信息失败');
		}, (res) => {
			if (+res.code) {
				this.isOver(res.message);
			} else {
				// 下一步：圈存
				this.loadForMoney();
			}
		});
		// wx.request({
		// 	url: `${this.data.host}/tj-card-add`,
		// 	method: 'POST',
		// 	data: params,
		// 	success: (res) => {
		// 		if (res.statusCode !== 200) {
		// 			this.isOver('新增卡信息失败');
		// 			return;
		// 		}
		// 		res = res.data;
		// 		if (+res.code) {
		// 			this.isOver(res.message);
		// 		} else {
		// 			// 下一步：圈存
		// 			this.loadForMoney();
		// 		}
		// 	},
		// 	fail: (res) => {
		// 		this.isOver('新增卡信息失败');
		// 	}
		// });
	},
	// 圈存（改变金额
	loadForMoney () {
		this.setData({msg: '圈存中...'});
		// 圈存初始化金额
		let money = '7FFFFFFF';	// 2147483647
		// 圈存初始化时间
		let tradeTime;
		new Promise((resolve, reject) => {
			// 请求获取终端机编号接口
			let params = {
			};
			util.getDataFromServer(`${this.data.urlPrefix}/initialization-init`, params, () => {
				this.isOver('获取终端机编号失败');
			}, (res) => {
				if (+res.code) {
					this.isOver(res.message);
				} else {
					let termNum = res.data;
					console.log('终端机编号：', termNum);
					// 圈存初始化
					resolve(termNum);
				}
			});
			// wx.request({
			// 	url: `${this.data.host}/initialization-init`,
			// 	method: 'POST',
			// 	data: params,
			// 	success: (res) => {
			// 		if (res.statusCode !== 200) {
			// 			this.isOver('获取终端机编号失败');
			// 			return;
			// 		}
			// 		res = res.data;
			// 		if (+res.code) {
			// 			this.isOver(res.message);
			// 		} else {
			// 			let termNum = res.data;
			// 			console.log('终端机编号：', termNum);
			// 			// 圈存初始化
			// 			resolve(termNum);
			// 		}
			// 	},
			// 	fail: (res) => {
			// 		this.isOver('获取终端机编号失败');
			// 	}
			// });
		}).then((termNum) => {
			// 圈存初始化
			return new Promise((resolve, reject) => {
				// 与后端统一写死的圈存初始化金额
				let cosArr = [];
				cosArr.push('00A40000021001');
				cosArr.push('0020000003123456');	// 0020 0000 pin码位数 pin码
				cosArr.push(`805000020B01${money}${termNum}10`);	// 圈存初始化（805000020B01 + 圈存金额 + 终端机编号 + 获取数据的长度
				cosArr.push('805C000204');	// 读取余额
				console.log(`圈存初始化: 805000020B01${money}${termNum}10`);	// 805000020B017FFFFFFF011200CD0028
				bleUtil.cosChannel('00', cosArr, (code, res) => {
					console.log(res);
					if (!/9000$/.test(res[1])) {
						this.isOver('pin验证失败');
						return;
					}
					if (!/9000$/.test(res[2])) {
						this.isOver('圈存初始化失败');
						return;
					}
					if (!/9000$/.test(res[3])) {
						console.error('读取余额失败');
					} else {
						let balance = res[3].slice(0, -4);
						this.balance = parseInt(balance, 16);
					}
					// 请求圈存初始化接口
					resolve(res[2].slice(0, -4));
				});
			});
		}).then((data) => {
			let now = new Date();
			let formatNum = (n) => { return `${n}`.length - 1 ? `${n}` : `0${n}`; };
			// 赋值 圈存初始化时间
			// 格式：yyyyMMddHHmmss
			tradeTime = `${now.getFullYear()}${[now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds()].map(formatNum).join('')}`;
			// 请求圈存初始化接口
			return new Promise((resolve, reject) => {
				// 解析 卡交易序号、伪随机数、mac码
				let cardTradeNum, cardRandom, mac1;
				cardTradeNum = data.substr(8, 4).toUpperCase();
				cardRandom = data.substr(16, 8).toUpperCase();
				mac1 = data.substr(24, 8).toUpperCase();
				let params = {
					// 卡交易序号
					cardTradeNo: cardTradeNum,
					// 16位卡号
					cardId: this.data.cardId,
					// 伪随机数
					cardRandom: cardRandom,
					// 指令拼接字符串
					mac: mac1,
					// 圈存初始化金额
					chargeMoney: money,
					// 圈存初始化时间
					tradeTime: tradeTime
				};
				util.getDataFromServer(`${this.data.urlPrefix}/tj-initialization-online`, params, () => {
					this.isOver('圈存失败');
				}, (res) => {
					if (+res.code || +res.data.code) {
						if (this.balance) {
							// 余额非零，代表已圈存初始化，流程继续
							// 下一步：更新卡信息（持卡人信息）
							this.updateCardOwnerInfo();
						} else {
							// 余额为零，流程中止
							this.isOver('圈存初始化失败');
						}
					} else {
						// 圈存
						resolve(res.data.message);
					}
				});
				// wx.request({
				// 	url: `${this.data.host}/tj-initialization-online`,
				// 	method: 'POST',
				// 	data: params,
				// 	success: (res) => {
				// 		if (res.statusCode !== 200) {
				// 			this.isOver('圈存失败');
				// 			return;
				// 		}
				// 		res = res.data;
				// 		if (+res.code || +res.data.code) {
				// 			if (this.balance) {
				// 				// 余额非零，代表已圈存初始化，流程继续
				// 				// 下一步：更新卡信息（持卡人信息）
				// 				this.updateCardOwnerInfo();
				// 			} else {
				// 				// 余额为零，流程中止
				// 				this.isOver('圈存初始化失败');
				// 			}
				// 		} else {
				// 			// 圈存
				// 			resolve(res.data.message);
				// 		}
				// 	},
				// 	fail: (res) => {
				// 		this.isOver('圈存失败');
				// 	}
				// });
			});
		}).then((mac2) => {
			// 圈存
			mac2 = mac2.substr(0, 8);
			let cosArr = [];
			cosArr.push(`805200000b${tradeTime}${mac2}`);	// 圈存（805200000b + 圈存初始化时间 + mac2
			console.log(`圈存：805200000b${tradeTime}${mac2}`);
			bleUtil.cosChannel('00', cosArr, (code, res) => {
				console.log(res);
				// 圈存
				if (!/9000$/.test(res[0])) {
					this.isOver('圈存指令执行失败');
					return;
				}
				// 下一步：更新卡信息（持卡人信息）
				this.updateCardOwnerInfo();
			});
		});
	},
	// 更新卡信息（持卡人信息 operateType: 1）
	updateCardOwnerInfo () {
		this.setData({msg: '写入数据中...'});
		this.fetchInfo(1).then((info) => {
			return new Promise((resolve, reject) => {
				// 取随机数
				let cosArr = [];
				cosArr.push('00A40000023F00');
				cosArr.push('0084000004');
				bleUtil.cosChannel('00', cosArr, (code, res) => {
					// 获取随机数
					let random = res[1].slice(0, -4).toUpperCase();
					// this.setData({random});
					console.log('0015-8位随机数：', random);
					resolve({random, info});
				});
			});
		}).then(({random, info}) => {
			// 随机数 8字节 00补位
			random += '00000000';

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
			let IDType = (+info.userIdType).toString(16).toUpperCase();
			if (IDType.length < 2) IDType = '0' + IDType;
			console.log('持卡人证件类型：', IDType);
			cmd += IDType;

			// 计算当前长度 16进制（包括'04D69600'的长度
			// let cmdLen = cmd.length + 8;
			let cmdLen = cmd.length / 2 + 4;
			cmdLen = `${cmdLen < 16 ? '0' : ''}${cmdLen.toString(16)}`.toUpperCase();
			console.log('指令长度：', cmdLen);

			cmd = `04D69600${cmdLen}${cmd}`;
			console.log('完整指令：', cmd);

			// 请求接口
			return new Promise((resolve, reject) => {
				let params = {
					// 随机数
					initialData: random,
					// 分散因子
					scatterData: this.data.cardId,
					// 操作类型 1.持卡人信息，2.卡发行信息，3.更新Obu系统信息，4.更新Obu车辆信息
					operateType: 1,
					// 指令拼接字符串
					mac: cmd
				};
				util.getDataFromServer(`${this.data.urlPrefix}/tj-update-equipment-info`, params, () => {
						this.isOver('更新持卡人信息失败');
				}, (res) => {
					if (+res.code || +res.data.code) {
						this.isOver(res.data.message);
					} else {
						// 在线秘钥返回值
						let mac2 = res.data.message;
						if (mac2.length !== 8) {
							this.isOver('在线秘钥获取失败（更新持卡人信息）');
							return;
						}
						// 写入数据到卡
						resolve(cmd + mac2);
					}
				});
				// wx.request({
				// 	url: `${this.data.host}/tj-update-equipment-info`,
				// 	method: 'POST',
				// 	data: params,
				// 	success: (res) => {
				// 		if (res.statusCode !== 200) {
				// 			this.isOver('更新持卡人信息失败');
				// 			return;
				// 		}
				// 		res = res.data;
				// 		if (+res.code || +res.data.code) {
				// 			this.isOver(res.data.message);
				// 		} else {
				// 			// 在线秘钥返回值
				// 			let mac2 = res.data.message;
				// 			if (mac2.length !== 8) {
				// 				this.isOver('在线秘钥获取失败（更新持卡人信息）');
				// 				return;
				// 			}
				// 			// 写入数据到卡
				// 			resolve(cmd + mac2);
				// 		}
				// 	},
				// 	fail: (res) => {
				// 		this.isOver('更新持卡人信息失败');
				// 	}
				// });
			});
		}).then((cmd) => {
			// 写入数据到卡
			let cosArr = [];
			cosArr.push(cmd);
			console.log('写卡（持卡人信息）指令：', cmd);
			bleUtil.cosChannel('00', cosArr, (code, res) => {
				console.log('写卡（持卡人信息）返回：', res);
				// 写卡
				if (!/9000$/.test(res[0])) {
					this.isOver('写卡（持卡人信息）失败');
					return;
				}
				// 下一步：更新卡信息（卡发行信息）
				this.updateCardReleasingInfo();
			});
		});
	},
	// 更新卡信息（卡发行信息 operateType: 2）
	updateCardReleasingInfo () {
		this.setData({msg: '写入数据中...'});
		this.fetchInfo(2).then((info) => {
			return new Promise((resolve, reject) => {
				let cosArr = [];
				cosArr.push('00A40000021001');
				// 取0015
				cosArr.push('00B095002B');
				// 取随机数
				cosArr.push('0084000004');
				bleUtil.cosChannel('00', cosArr, (code, res) => {
					// 0015
					let tempFile15 = res[1].slice(0, -4).toUpperCase();
					let file15 = [];
					// 以byte为单位，转成array
					[...new Array(tempFile15.length).keys()].map((i) => {
						if (i % 2) return;
						file15.push(tempFile15.substr(i, 2));
					});

					// 获取随机数
					let random = res[2].slice(0, -4).toUpperCase();
					console.log('0015-8位随机数：', random);
					resolve({random, info, file15});
				});
			});
		}).then(({random, info, file15}) => {
			// 随机数 8字节 00补位
			random += '00000000';

			// 拼接指令
			let cmd = '04D695002F';

			// 银行卡类型（22. 储蓄卡；23. 记账卡）
			file15[8] = (23).toString(16);

			// 启用时间
			let enableTime = info.enableTime.replace(/\ .*$/, '').replace(/-/g, '');
			file15[20] = enableTime.substr(0, 2);
			file15[21] = enableTime.substr(2, 2);
			file15[22] = enableTime.substr(4, 2);
			file15[23] = enableTime.substr(6, 2);

			// 到期时间
			let expireTime = info.expireTime.replace(/\ .*$/, '').replace(/-/g, '');
			file15[24] = expireTime.substr(0, 2);
			file15[25] = expireTime.substr(2, 2);
			file15[26] = expireTime.substr(4, 2);
			file15[27] = expireTime.substr(6, 2);

			// 车牌号
			let plateNumTemp = encodeToGb2312(info.plateNo).toUpperCase();
			[...new Array(12 * 2 - plateNumTemp.length).keys()].map(() => {
				plateNumTemp += '0';
			});
			[...new Array(12).keys()].map((i) => {
				file15[28 + i] = plateNumTemp.substr(i * 2, 2);
			});

			// 车辆类型	写死0：普通车（高速的李季旸这样说的
			file15[40] = '00';

			// 车牌颜色
			let plateColor = (+info.platenoColor).toString(16);
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
			cmd += file15;

			// 请求接口
			return new Promise((resolve, reject) => {
				let params = {
					// 随机数
					initialData: random,
					// 分散因子
					scatterData: this.data.cardId,
					// 操作类型 1.持卡人信息，2.卡发行信息，3.更新Obu系统信息，4.更新Obu车辆信息
					operateType: 2,
					// 指令拼接字符串
					mac: cmd
				};
				util.getDataFromServer(`${this.data.urlPrefix}/tj-update-equipment-info`, params, () => {
					this.isOver('更新卡发行信息失败');
				}, (res) => {
					if (+res.code || +res.data.code) {
						this.isOver(res.data.message);
					} else {
						// 在线秘钥返回值
						let mac2 = res.data.message;
						if (mac2.length !== 8) {
							this.isOver('在线秘钥获取失败（更新卡发行信息）');
							return;
						}
						// 写入数据到卡
						resolve(cmd + mac2);
					}
				});
				// wx.request({
				// 	url: `${this.data.host}/tj-update-equipment-info`,
				// 	method: 'POST',
				// 	data: params,
				// 	success: (res) => {
				// 		if (res.statusCode !== 200) {
				// 			this.isOver('更新卡发行信息失败');
				// 			return;
				// 		}
				// 		res = res.data;
				// 		if (+res.code || +res.data.code) {
				// 			this.isOver(res.data.message);
				// 		} else {
				// 			// 在线秘钥返回值
				// 			let mac2 = res.data.message;
				// 			if (mac2.length !== 8) {
				// 				this.isOver('在线秘钥获取失败（更新卡发行信息）');
				// 				return;
				// 			}
				// 			// 写入数据到卡
				// 			resolve(cmd + mac2);
				// 		}
				// 	},
				// 	fail: (res) => {
				// 		this.isOver('更新卡发行信息失败');
				// 	}
				// });
			});
		}).then((cmd) => {
			// 写入数据到卡
			let cosArr = [];
			cosArr.push(cmd);
			console.log('写卡（卡发行信息）指令：', cmd);
			bleUtil.cosChannel('00', cosArr, (code, res) => {
				console.log('写卡（卡发行信息）返回：', res);
				// 写卡
				if (!/9000$/.test(res[0])) {
					this.isOver('写卡（卡发行信息）失败');
					return;
				}
				// 下一步：102. 更新订单（卡发行）
				this.updateCurrentStep(102);
			});
		});
	},
	// 102. 更新订单（卡发行 operateType: 1）
	uploadOrderForCard () {
		let params = {
			// 订单ID
			orderId: app.globalData.orderInfo.orderId,
			// 卡号
			serialID: this.data.cardId,
			// 操作类型 1.卡发行，2.OBU发行
			operateType: 1
		};
		util.getDataFromServer(`${this.data.urlPrefix}/tj-update-order`, params, () => {
			this.isOver('更新订单（卡发行）失败');
		}, (res) => {
			if (+res.code) {
				this.isOver(res.message);
			} else {
				// 下一步：103. 新增obu
				this.updateCurrentStep(103);
			}
		});
		// wx.request({
		// 	url: `${this.data.host}/tj-update-order`,
		// 	method: 'POST',
		// 	data: params,
		// 	success: (res) => {
		// 		if (res.statusCode !== 200) {
		// 			this.isOver('更新订单（卡发行）失败');
		// 			return;
		// 		}
		// 		res = res.data;
		// 		if (+res.code) {
		// 			this.isOver(res.message);
		// 		} else {
		// 			// 下一步：103. 新增obu
		// 			this.updateCurrentStep(103);
		// 		}
		// 	},
		// 	fail: (res) => {
		// 		this.isOver('更新订单（卡发行）失败');
		// 	}
		// });
	},
	// 103. 新增obu （读obu信息
	increaseObu () {
		let params = {
			// 订单id
			orderId: app.globalData.orderInfo.orderId,
			// obu号
			obuId: this.data.contractNumber,
			// obu品牌
			brand: this.data.obuBrand,
			// obu型号
			model: this.data.model
			// // obu启用时间
			// enableTime:
			// // obu到期时间
			// expireTime
		};
		util.getDataFromServer(`${this.data.urlPrefix}/tj-obu-add`, params, () => {
			this.isOver('新增OBU失败');
		}, (res) => {
			if (+res.code) {
				this.isOver(res.message);
			} else {
				// 下一步：更新obu信息（obu系统信息）
				this.uploadObuSysInfo();
			}
		});
		// wx.request({
		// 	url: `${this.data.host}/tj-obu-add`,
		// 	method: 'POST',
		// 	data: params,
		// 	success: (res) => {
		// 		if (res.statusCode !== 200) {
		// 			this.isOver('新增OBU失败');
		// 			return;
		// 		}
		// 		res = res.data;
		// 		if (+res.code) {
		// 			this.isOver(res.message);
		// 		} else {
		// 			// 下一步：更新obu信息（obu系统信息）
		// 			this.uploadObuSysInfo();
		// 		}
		// 	},
		// 	fail: (res) => {
		// 		this.isOver('新增OBU失败');
		// 	}
		// });
	},
	// 更新obu信息（obu系统信息 operateType: 3）
	uploadObuSysInfo () {
		this.setData({msg: '写入数据中...'});
		this.fetchInfo(3).then((info) => {
			return new Promise((resolve, reject) => {
				let cosArr = [];
				cosArr.push('00A40000023F00');
				cosArr.push('00B081001B');
				cosArr.push('0084000004');
				bleUtil.gvEsamChannel('20', cosArr, (code, res) => {
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
					resolve({random, info, sysInfo});
				});
			});
		}).then(({random, info, sysInfo}) => {
			// 随机数 8字节 00补位
			random += '00000000';

			// 拼接指令
			let cmd = '04D681001F';

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
				// wx.request({
				// 	url: `${this.data.host}/tj-update-equipment-info`,
				// 	method: 'POST',
				// 	data: params,
				// 	success: (res) => {
				// 		if (res.statusCode !== 200) {
				// 			this.isOver('更新obu系统信息失败');
				// 			return;
				// 		}
				// 		res = res.data;
				// 		if (+res.code || +res.data.code) {
				// 			this.isOver(res.data.message);
				// 		} else {
				// 			// 在线秘钥返回值
				// 			let mac2 = res.data.message;
				// 			if (mac2.length !== 8) {
				// 				this.isOver('在线秘钥获取失败（更新obu系统信息）');
				// 				return;
				// 			}
				// 			// 写入数据到obu
				// 			resolve(cmd + mac2);
				// 		}
				// 	},
				// 	fail: (res) => {
				// 		this.isOver('更新obu系统信息失败');
				// 	}
				// });
			});
		}).then((cmd) => {
			// 写入数据到obu
			let cosArr = [];
			cosArr.push(cmd);
			bleUtil.gvEsamChannel('20', cosArr, (code, res) => {
				console.log('写obu（系统信息）返回：', res);
				// 写obu
				if (!/9000$/.test(res[0])) {
					this.isOver('写obu（系统信息）失败');
					return;
				}
				// 下一步：更新obu信息（obu车辆信息）
				this.uploadObuCarInfo();
			});
		});
	},
	// 更新obu信息（obu车辆信息 operateType: 4/5）
	uploadObuCarInfo () {
		this.setData({msg: '写入数据中...'});
		this.fetchInfo(4).then((info) => {
			return new Promise((resolve, reject) => {
				let cosArr = [];
				cosArr.push('00A40000023F00');
				cosArr.push('00A4000002DF01');
				cosArr.push('0084000004');
				bleUtil.gvEsamChannel('20', cosArr, (code, res) => {
					console.log(res);

					// 获取随机数
					let random = res[2].slice(0, -4).toUpperCase();
					console.log('0015-8位随机数：', random);
					resolve({random, info});
				});
			});
		}).then(({random, info}) => {
			// 随机数 8字节 00补位
			random += '00000000';

			// 判断当前车辆是否为货车
			let isTruck = info.type >= 11 && info.type <= 16;
			let cmd;
			if (isTruck) {
				// 拼接更新obu信息的指令（货车
				cmd = this.spliceObuCarInfoTruck(info);
			} else {
				// 拼接更新obu信息的指令（非货车
				cmd = this.spliceObuCarInfoDef(info);
			}

			// 请求接口
			return new Promise((resolve, reject) => {
				let params = {
					// 随机数
					initialData: random,
					// 分散因子
					scatterData: this.data.contractNumber,
					// 操作类型 1.持卡人信息，2.卡发行信息，3.更新Obu系统信息，4.更新Obu车辆信息（非货车），5.更新Obu车辆信息（货车）
					operateType: isTruck ? 5 : 4,
					// 指令拼接字符串
					mac: cmd
				};
				util.getDataFromServer(`${this.data.urlPrefix}/tj-update-equipment-info`, params, () => {
					this.isOver('更新obu车辆信息失败');
				}, (res) => {
					if (+res.code || +res.data.code) {
						this.isOver(res.data.message);
					} else {
						// 在线秘钥返回值
						let mac2 = res.data.message;
						if (mac2.length !== 8) {
							this.isOver('在线秘钥获取失败（更新obu车辆信息）');
							return;
						}
						// 写入数据到obu
						resolve(cmd + mac2);
					}
				});
				// wx.request({
				// 	url: `${this.data.host}/tj-update-equipment-info`,
				// 	method: 'POST',
				// 	data: params,
				// 	success: (res) => {
				// 		if (res.statusCode !== 200) {
				// 			this.isOver('更新obu车辆信息失败');
				// 			return;
				// 		}
				// 		res = res.data;
				// 		if (+res.code || +res.data.code) {
				// 			this.isOver(res.data.message);
				// 		} else {
				// 			// 在线秘钥返回值
				// 			let mac2 = res.data.message;
				// 			if (mac2.length !== 8) {
				// 				this.isOver('在线秘钥获取失败（更新obu车辆信息）');
				// 				return;
				// 			}
				// 			// 写入数据到obu
				// 			resolve(cmd + mac2);
				// 		}
				// 	},
				// 	fail: (res) => {
				// 		this.isOver('更新obu车辆信息失败');
				// 	}
				// });
			});
		}).then((cmd) => {
			// 写入数据到obu
			let cosArr = [];
			cosArr.push(cmd);
			bleUtil.gvEsamChannel('20', cosArr, (code, res) => {
				console.log('写obu（车辆信息）返回：', res);
				// 写obu
				if (!/9000$/.test(res[0])) {
					this.isOver('写obu（车辆信息）失败');
					return;
				}
				// 下一步：104. 更新订单（obu发行）
				this.updateCurrentStep(104);
			});
		});
	},
	// 拼接更新obu信息的指令（非货车
	spliceObuCarInfoDef (info) {
		let cmd = '04D681003F';
		let carInfo = [];

		// 车牌号
		let plateNumTemp = encodeToGb2312(info.plateNo).toUpperCase();
		[...new Array(12 * 2 - plateNumTemp.length).keys()].map(() => {
			plateNumTemp += '0';
		});
		[...new Array(12).keys()].map((i) => {
			carInfo[i] = plateNumTemp.substr(i * 2, 2);
		});

		// 车牌颜色
		let plateColor = (+info.platenoColor).toString(16).toUpperCase();
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
		let dimTemp;
		info.outsideDimensions.toUpperCase().replace(/\D+/g, 'X').split('X').map((item, i) => {
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
		let wheelCount = (+info.wheelCount).toString(16).toUpperCase();
		wheelCount = wheelCount.length - 1 ? wheelCount : '0' + wheelCount;
		carInfo[20] = wheelCount;

		// 车轴数
		let axleCount = (+info.axleCount).toString(16).toUpperCase();
		axleCount = axleCount.length - 1 ? axleCount : '0' + axleCount;
		carInfo[21] = axleCount;

		// 轴距
		let axleDistance = Math.floor(+info.axleDistance / 100).toString(16).toUpperCase();
		[...new Array(2 * 2 - axleDistance.length).keys()].map(() => {
			axleDistance = '0' + axleDistance;
		});
		carInfo[22] = axleDistance.substr(0, 2);
		carInfo[23] = axleDistance.substr(2, 2);

		// 车辆载重/座位数（这里指座位数
		let approvedCount = (+info.approvedCount).toString(16).toUpperCase();
		[...new Array(3 * 2 - approvedCount.length).keys()].map(() => {
			approvedCount = '0' + approvedCount;
		});
		carInfo[24] = approvedCount.substr(0, 2);
		carInfo[25] = approvedCount.substr(2, 2);
		carInfo[26] = approvedCount.substr(4, 2);

		// 车辆特征描述
		[...new Array(16).keys()].map((i) => {
			carInfo[27 + i] = 'FF';
		});

		// 车辆发动机编号
		let engineNum = encodeToGb2312(info.engineNum).toUpperCase();
		[...new Array(16 * 2 - engineNum.length).keys()].map(() => {
			engineNum += '0';
		});
		[...new Array(16).keys()].map((i) => {
			carInfo[43 + i] = engineNum.substr(i * 2, 2);
		});

		console.log('carInfo：', carInfo);
		carInfo = carInfo.join('');
		cmd += carInfo;
		return cmd;
	},
	// 拼接更新obu信息的指令（货车
	spliceObuCarInfoTruck (info) {
		let cmd = '04D6810053';
		let carInfo = [];

		// 车牌号
		let plateNumTemp = encodeToGb2312(info.plateNo).toUpperCase();
		[...new Array(12 * 2 - plateNumTemp.length).keys()].map(() => {
			plateNumTemp += '0';
		});
		[...new Array(12).keys()].map((i) => {
			carInfo[i] = plateNumTemp.substr(i * 2, 2);
		});

		// 车牌颜色
		let plateColor = (+info.platenoColor).toString(16).toUpperCase();
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
		// 4519X1831X1694  2+2+2
		let dimTemp;
		info.outsideDimensions.toUpperCase().replace(/\D+/g, 'X').split('X').map((item, i) => {
			dimTemp = Math.floor(item / 100).toString(16).toUpperCase();
			[...new Array(2 * 2 - dimTemp.length).keys()].map(() => {
				dimTemp = '0' + dimTemp;
			});
			carInfo[16 + i * 2 + 0] = dimTemp.substr(0, 2);
			carInfo[16 + i * 2 + 1] = dimTemp.substr(2, 2);
		});

		// 车辆核定载质量
		let permittedWeight = (+info.permittedWeight).toString(16).toUpperCase();
		[...new Array(3 * 2 - permittedWeight.length).keys()].map(() => {
			permittedWeight = '0' + permittedWeight;
		});
		carInfo[22] = permittedWeight.substr(0, 2);
		carInfo[23] = permittedWeight.substr(2, 2);
		carInfo[24] = permittedWeight.substr(4, 2);

		// 整备质量
		let maintenanceMass = (+info.maintenanceMass).toString(16).toUpperCase();
		[...new Array(3 * 2 - maintenanceMass.length).keys()].map(() => {
			maintenanceMass = '0' + maintenanceMass;
		});
		carInfo[25] = maintenanceMass.substr(0, 2);
		carInfo[26] = maintenanceMass.substr(2, 2);
		carInfo[27] = maintenanceMass.substr(4, 2);

		// 车辆总质量
		let totalMass = (+info.totalMass).toString(16).toUpperCase();
		[...new Array(3 * 2 - totalMass.length).keys()].map(() => {
			totalMass = '0' + totalMass;
		});
		carInfo[28] = totalMass.substr(0, 2);
		carInfo[29] = totalMass.substr(2, 2);
		carInfo[30] = totalMass.substr(4, 2);

		// 核定载人数
		let approvedCount = (+info.approvedCount).toString(16).toUpperCase();
		approvedCount = approvedCount.length - 1 ? approvedCount : '0' + approvedCount;
		carInfo[31] = approvedCount;

		// 车辆识别代号
		let vin = encodeToGb2312(info.vin).toUpperCase();
		[...new Array(17 * 2 - vin.length).keys()].map(() => {
			vin += '0';
		});
		[...new Array(17).keys()].map((i) => {
			carInfo[32 + i] = vin.substr(i * 2, 2);
		});

		// 车辆特征描述
		[...new Array(16).keys()].map((i) => {
			carInfo[49 + i] = 'FF';
		});

		// 保留字段
		[...new Array(14).keys()].map((i) => {
			carInfo[65 + i] = 'FF';
		});

		console.log('carInfo：', carInfo);
		carInfo = carInfo.join('');
		cmd += carInfo;
		return cmd;
	},

	// 104. 更新订单（obu发行 operateType: 2）
	uploadOrderForObu () {
		let params = {
			// 订单ID
			orderId: app.globalData.orderInfo.orderId,
			// obu编号
			serialID: this.data.contractNumber,
			// 操作类型 1.卡发行，2.OBU发行
			operateType: 2
		};
		util.getDataFromServer(`${this.data.urlPrefix}/tj-update-order`, params, () => {
			this.isOver('更新订单（obu发行）失败');
		}, (res) => {
			if (+res.code) {
				this.isOver(res.message);
			} else {
				// 下一步：105. 己方数据库设备激活
				this.updateCurrentStep(105);
			}
		});
		// wx.request({
		// 	url: `${this.data.host}/tj-update-order`,
		// 	method: 'POST',
		// 	data: params,
		// 	success: (res) => {
		// 		if (res.statusCode !== 200) {
		// 			this.isOver('更新订单（obu发行）失败');
		// 			return;
		// 		}
		// 		res = res.data;
		// 		if (+res.code) {
		// 			this.isOver(res.message);
		// 		} else {
		// 			// 下一步：105. 己方数据库设备激活
		// 			this.updateCurrentStep(105);
		// 		}
		// 	},
		// 	fail: (res) => {
		// 		this.isOver('更新订单（obu发行）失败');
		// 	}
		// });
	},
	// 105. 己方数据库设备激活
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
				// 下一步：0. 完成
				this.updateCurrentStep(0);
			}
		});
		// wx.request({
		// 	url: `${this.data.host}/user-confirm-info`,
		// 	method: 'POST',
		// 	data: params,
		// 	success: (res) => {
		// 		if (res.statusCode !== 200) {
		// 			this.isOver('数据库设备激活失败');
		// 			return;
		// 		}
		// 		res = res.data;
		// 		if (+res.code) {
		// 			this.isOver(res.message);
		// 		} else {
		// 			// 下一步：0. 完成
		// 			this.updateCurrentStep(0);
		// 		}
		// 	},
		// 	fail: (res) => {
		// 		this.isOver('数据库设备激活失败');
		// 	}
		// });
	},

	// 根据具体数据类型获取相关数据 type: 1. 用户信息 2. 卡信息 3. 车辆信息 4. obu信息
	fetchInfo (type) {
		return new Promise((resolve, reject) => {
			let params = {
				// 订单ID
				orderId: app.globalData.orderInfo.orderId,
				// 请求的数据类型
				type: type
			};
			if (type === 2) params = {...params, cardId: this.data.cardId};
			if (type === 3) params = {...params, obuId: this.data.contractNumber};
			let text = '';
			switch (type) {
				case 1: text = '用户信息'; break;
				case 2: text = '卡信息'; break;
				case 3: text = '车辆信息'; break;
				case 4: text = 'OBU信息'; break;
			}
			util.getDataFromServer(`${this.data.urlPrefix}/client-query-info`, params, () => {
				this.isOver(`获取${text}数据失败`);
			}, (res) => {
				if (+res.code) {
					this.isOver(res.message);
				} else if (!res.data) {
					this.isOver(`未获取到${text}`);
				} else {
					if (this.validFields(type, res.data)) resolve(res.data);
				}
			});
			// wx.request({
			// 	url: `${this.data.host}/client-query-info`,
			// 	method: 'POST',
			// 	data: params,
			// 	success: (res) => {
			// 		if (res.statusCode !== 200) {
			// 			fail();
			// 			return;
			// 		}
			// 		res = res.data;
			// 		if (+res.code) {
			// 			this.isOver(res.message);
			// 		} else if (!res.data) {
			// 			this.isOver(`未获取到${text}`);
			// 		} else {
			// 			if (this.validFields(type, res.data)) resolve(res.data);
			// 		}
			// 	},
			// 	fail: fail
			// });
		});
	},
	// 验证字段数据合法性
	validFields (type, info) {
		let isOk = 1;
		let msg;
		if (/^(1)$/.test(type)) {
			// 验证用户信息
			if (!info.userName) {
				isOk = 0;
				msg = '姓名为空，请检查！';
			} else {
				try {
					encodeToGb2312(info.userName);
				} catch (e) {
					// 姓名编码异常
					isOk = 0;
					msg = '姓名编码转换出错，请检查！';
				}
			}
		} else if (/^(2|3)$/.test(type)) {
			if (!info.plateNo) {
				isOk = 0;
				msg = '车牌为空，请检查！';
			} else { // 车牌编码校验
				try {
					encodeToGb2312(info.plateNo);
				} catch (e) {
					// 车牌编码异常
					isOk = 0;
					msg = '车牌编码转换出错，请检查！';
				}
			}
		} else if (type === 4) {
			if (!info.outsideDimensions) {
				isOk = 0;
				msg = '轮廓尺寸为空，请检查！';
			} else {
				let result = info.outsideDimensions.match(/\d{4}/ig);
				if (result.length !== 3) {
					isOk = 0;
					msg = '轮廓尺寸有误，请检查！';
				}
			}
			if (!info.engineNum) {
				isOk = 0;
				msg = '发动机引擎编号为空，请检查！';
			} else {
				// 发动机长度校验
				if (info.engineNum.length > 16) {
					isOk = 0;
					msg = '发动机引擎编号过长，请检查！';
				}
			}
		}
		if (!isOk) {
			this.isOver(msg);
		}
		return isOk;
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
