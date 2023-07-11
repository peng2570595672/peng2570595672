/*
* 湖南握奇
 */
const util = require('../../../../utils/util.js');
const plugin = requirePlugin('obu-plugin');
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
		currentStep: -1,
		alertNum: 0,
		resultInfo: '',
		originValue: '',
		apduFlag: '',
		result: {},
		res: [],
		index: 0,
		type: 0,
		selfType: 0,
		isUnload: 0,
		oldCardNo: '',
		oldObuNo: '',
		repairType: -1 // 1换卡 2 换签 3换卡换签
	},
	onLoad (options) {
		// 删除所有过滤名
		plugin.setBletoothFilter(null);
		// 设置过滤名
		const blefilter = ['WQ', '61WQ', 'HN', 'WJ', 'JL', 'WD', 'ZJ'];
		// app.i('------------------');
		for (let i = 0; i < blefilter.length; i++) {
			plugin.setBletoothFilter(blefilter[i]);
			// app.i('添加过滤名 :: ' + blefilter[i]);
		}

		let reg = new RegExp(`^(1|2|3)$`);
		if (reg.test(options.repairType)) {
			this.mySetData({
				oldCardNo: options.oldCardNo,
				oldObuNo: options.oldObuNo,
				repairType: parseInt(options.repairType)
			});
		}
		wx.canIUse('setBackgroundColor') && wx.setBackgroundColor({
			backgroundColor: '#ffffff',
			backgroundColorBottom: '#ffffff'
		});
		this.start();
	},
	start () {
		setTimeout(() => {
			this.openBluetooth();
		}, 300);
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
		console.log(tempObj);
		this.setData(tempObj);
	},
	// 开启蓝牙
	openBluetooth () {
		plugin.setDeviceModel(plugin.DEVICE_MODEL_HUNAN_A); // 湖南后装OBU
		// 搜索到新设备回调
		const connect = plugin.checkConnect();
		console.log(connect);
		const that = this;
		if (connect === 0) {
			that.isOver('目前OBU处于连接状态, 请手工断开连接');
		}
		plugin.scan(function callback (res) {
			console.log(res);
			if (res.code === 0) {
				// 保存扫描到的第一个OBU设备信息
				that.mySetData({
					deviceId: res.data.device_no,
					deviceName: res.data.device_name,
					getListFailed: true,
					showLoading: false
				});
				that.isOver('');
				// 搜索到蓝牙后，建议过1000ms再去连接，否则会存在连接失败率
				setTimeout(() => {
					that.connectDevice();
				}, 1000);
			} else {
				that.isOver('扫描结果: code=' + res.code + ' msg=' + res.msg);
			}
		}, 30000);
	},
	handleRetry () {
		this.disonnectDevice();
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
			currentStep: -1,
			resultInfo: '',
			originValue: '',
			apduFlag: '',
			result: {},
			res: [],
			index: 0,
			type: 0,
			selfType: 0,
			alertNum: 0,
			isUnload: 0
		});
		setTimeout(() => {
			this.start();
		}, 2000);
	},
	// 连接设备
	connectDevice () {
		// 连接之前扫描到的第一个OBU设备
		let device = {
			deviceId: this.data.deviceId,
			name: this.data.ui.deviceName
		};
		const that = this;
		let callback = {
			success (res) {
				console.log('连接成功',res);
				that.mySetData({
					connectState: 1,
					getListFailed: false
				});
				wx.onBLEConnectionStateChange(function (res) {
					console.log(res);
					console.log(that.data);
					if (that.data.ui.activated || that.data.isUnload || res.connected) {
						return;
					}
					that.setData({
						alertNum: that.data.alertNum + 1
					});
					// if (that.data.alertNum > 1) {
					// 	return;
					// }
					// util.alert({
					// 	title: '蓝牙中断',
					// 	content: '检测到您的蓝牙链接中断\n请重新链接',
					// 	confirmText: '重新连接',
					// 	showCancel: false,
					// 	confirm: () => {
					// 		that.setData({
					// 			alertNum: 0
					// 		});
					// 		that.handleRetry();
					// 	}
					// });
				});
			},
			fail (res) {
				console.log(res);
				that.isOver('连接失败  code=' + res.code + ' msg=' + res.msg);
				that.mySetData({
					device: 0,
					connectState: 2,
					getListFailed: false
				});
			}
		};
		console.log('will connect: ' + device.deviceId);
		plugin.connectAndInit(device, callback, 10000);
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
			this.handleRetry();
			// this.mySetData({
			// 	showLoading: true,
			// 	getListFailed: false,
			// 	connectState: -1,
			// 	errMsg: '',
			// 	msg: ''
			// });
			// this.openBluetooth();
			// timer = setTimeout(() => {
			// 	wx.closeBluetoothAdapter();
			// 	this.mySetData({
			// 		showLoading: false,
			// 		getListFailed: true
			// 	});
			// }, 15000);
		}
	},
	// 从设备读取卡号
	readCardNoFromDevice () {
		this.mySetData({
			msg: '正在读取卡号...'
		});
		let cmdArray = [
			'00A40000021001',
			'00B095002B']; // 读0015文件
		const that = this;
		let callback = {
			success (res) {
				console.log('picc', res);
				if (res && res.data && res.data.length === 2) {
					let cardNo = res.data[1].substring(20, 40);
					that.mySetData({
						// 43011911239481869266
						cardNo: cardNo
					});
					that.readObuNoFromDevice();
				} else {
					that.isOver('读取卡号失败，请重试！');
				}
			},
			fail (res) {
				console.log('picc', res);
				that.isOver('PICC code=' + res.code + ' msg=' + res.msg);
			}
		};

		plugin.sendAndReceive(0, cmdArray, callback, 10001);
	},
	readObuNoFromDevice () {
		this.mySetData({
			msg: '正在读取OBU号...'
		});
		let cmdArray = [
			// Select 3F00
			'00A40000023F00',
			// EF01
			'00B081001B'
		];
		const that = this;
		let callback = {
			success (res) {
				console.log('esam', res);
				let obuNo = res.data[1].slice(20, 36);
				that.mySetData({
					obuNo: obuNo
				});
				// 普通流程
				if (that.data.repairType === -1) {
					setTimeout(() => {
						that.getCardAndObuIssueStatus();
					}, 200);
				} else {
					setTimeout(() => {
						that.getOrderInfo();
					}, 200);
				}
			},
			fail (res) {
				console.log('esam', res);
				that.isOver('esam  code=' + res.code + ' msg=' + res.msg);
			}
		};
		plugin.sendAndReceive(1, cmdArray, callback, 10001);
	},
	// 获取卡签状态
	async getCardAndObuIssueStatus (isOver) {
		this.mySetData({
			msg: '获取卡签发行状态中...'
		});
		let params = {
			orderId: app.globalData.orderInfo.orderId
		};
		let res = await util.getDataFromServersV2(`consumer/etc/hunan/common/secondIssueQuery`,params);
		if (res.code === 0) {
			console.log(res);
			// {"code":0,"data":{"card_status":"1","error_msg":"成功","card_no":"43011900239180290001","success":"1","error_code":"100","obu_no":"4301198960290001","obu_status":"1"},"message":"SUCCESS"}
			let cardStatus = parseInt(res.data.card_status);
			let obuStatus = parseInt(res.data.obu_status);
			// 发行完成
			if (isOver) {
				// 卡签发行成功
				if (this.data.selfType !== 2 && cardStatus === 1 && obuStatus === 1) {
					wx.uma.trackEvent('activate_the_success');
					this.mySetData({
						activated: true,
						msg: '',
						errMsg: ''
					});
					this.disonnectDevice();
				} else if (cardStatus === 2 && obuStatus === 2) {
					this.isOver('卡签发行失败，请联系客服！');
				} else if (cardStatus === 2 || this.data.selfType === 2) {
					this.isOver('卡发行失败，请联系客服！');
				} else if (obuStatus === 2) {
					this.isOver('签发行失败，请联系客服！');
				}
			} else {
				// 是否强制发行
				if (this.data.ui.isForce) {
					util.alert({
						content: '是否确定强制完成本次发行？',
						confirmText: '确定',
						showCancel: true,
						confirm: () => {
							this.mySetData({
								selfType: 3
							});
							setTimeout(() => {
								this.getOrderInfo();
							}, 200);
						}
					});
					return;
				}
				// 0:初始化 1:成功 2:失败
				if (cardStatus === 2 && obuStatus === 0) {
					// 卡发行失败 obu初始化状态 那么单独发行obu
					this.mySetData({
						selfType: 2
					});
				}
				setTimeout(() => {
					this.getOrderInfo();
				}, 200);
			}
		} else {
			this.isOver(res.message);
		}
	},
	// 后去订单信息
	async getOrderInfo () {
		this.mySetData({
			msg: '获取订单信息中...'
		});
		let params = {
			orderId: app.globalData.orderInfo.orderId
		};
		let res = await util.getDataFromServersV2(`consumer/etc/hunan/common/hunanissueOrderQuery`,params);
		if (res.code === 0) {
			// 审核通过 进行二发
			if (parseInt(res.data.order_status) === 4 || parseInt(res.data.order_status) === 7) {
				this.mySetData({
					type: this.data.selfType !== 0 ? this.data.selfType : parseInt(res.data.order_status) === 7 ? 1 : 0
				});
				setTimeout(() => {
					this.startOnlineDistribution();
				}, 200);
			} else if (parseInt(res.data.order_status) === 8 || parseInt(res.data.order_status) === 10) {
				// 换卡 或者 换签
				setTimeout(() => {
					this.startOnlineDistribution();
				}, 200);
			} else {
				this.isOver('订单' + this.getStatus(res.data.order_status));
			}
		} else {
			this.isOver(res.message);
		}
	},
	// 获取状态
	getStatus (status) {
		let result = '';
		switch (parseInt(status)) {
			case 0:
				result = '初始化状态';
				break;
			case 1:
				result = '待审核';
				break;
			case 2:
				result = '驳回';
				break;
			case 3:
				result = '车辆信息提交成功';
				break;
			case 4:
				result = '审核通过';
				break;
			case 5:
				result = '已取消';
				break;
			case 6:
				result = '审核中';
				break;
			case 7:
				result = '已完成';
				break;
			case 9:
				result = '换卡换签审核成功';
				break;
		}
		return result;
	},
	// 开始二发流程
	async startOnlineDistribution () {
		this.mySetData({
			msg: '获取数据中...'
		});
		let result = this.data.result;
		let res = this.data.res;
		let resultInfo = {};
		let k = 0;
		for (let i = 0; i < result.length; i++) {
			let myType = result[i].key;
			for (let j = 0; j < res[i].length; j++) {
				if (myType === 1) {
					resultInfo[k] = {};
					resultInfo[k]['inner'] = {
						'cmd_type': 1,
						'cmd_value': res[i][j]
					};
				} else {
					resultInfo[k] = {};
					resultInfo[k]['inner'] = {
						'cmd_type': 0,
						'cmd_value': res[i][j]
					};
				}
				k++;
			}
		}

		let params = {
			orderId: app.globalData.orderInfo.orderId,
			apduFlag: this.data.apduFlag,
			cardNo: this.data.cardNo,
			obuNo: this.data.obuNo,
			originValue: this.data.originValue,
			curStep: this.data.currentStep + 1,
			resultInfo: JSON.stringify(resultInfo) === '{}' ? '' : JSON.stringify(resultInfo)
		};
		// 二发
		if (this.data.repairType !== -1) {
			// 换卡换签
			params['repairType'] = this.data.repairType;
			params['oldCardNo'] = this.data.oldCardNo;
			params['oldObuNo'] = this.data.oldObuNo;
		} else {
			params['type'] = this.data.type;
		}
		// this.getDataFromServer(this.data.repairType === -1 ? 'second-issue' : 'secondIssueReplace', params, () => {
		let url = this.data.repairType === -1 ? 'second-issue' : 'secondIssueReplace';
		let requestResult = await util.getDataFromServersV2(`consumer/etc/hunan/common/${url}`,params);
		if (requestResult.code === 0) {
			let response = requestResult.data.response;
			if (!response) {
				response = requestResult.data;
			}
			this.setData({
				apduFlag: response.apdu_flag ? response.apdu_flag : '',
				cardNo: response.card_no ? response.card_no : '',
				obuNo: response.obu_no ? response.obu_no : '',
				originValue: response.origin_value ? response.origin_value : '',
				currentStep: response.cur_step,
				resultInfo: response.resp_info,
				index: 0
			});
			// 激活完成
			if (this.data.currentStep === response.total_step) {
				setTimeout(() => {
					this.getCardAndObuIssueStatus(true);
				}, 200);
				return;
			}
			this.getCmd();
		} else {
			this.isOver(requestResult.message);
		}
	},
	// 获取命令
	getCmd () {
		this.mySetData({
			msg: '写入数据中...'
		});
		let objArr = [];
		let info = this.data.resultInfo;
		let arr = Object.keys(info);
		let obj = {};
		for (let item of arr) {
			obj = {};
			let inner = info[item].inner;
			// 二次激活
			// 01-esam 00-picc
			if (objArr.length === 0) {
				obj['key'] = inner.cmd_type;
				obj['cmd'] = [inner.cmd_value];
				objArr.push(obj);
			} else {
				if (objArr[objArr.length - 1]['key'] === inner.cmd_type) {
					objArr[objArr.length - 1].cmd.push(inner.cmd_value);
				} else {
					obj['key'] = inner.cmd_type;
					obj['cmd'] = [inner.cmd_value];
					objArr.push(obj);
				}
			}
		}
		this.mySetData({
			result: objArr
		});
		if (objArr.length > 0) {
			let obj = objArr[this.data.index];
			console.log(obj);
			if (obj.key === 0) {
				this.sendCmdToCard(obj);
			} else {
				this.sendCmdToObu(obj);
			}
		}
	},
	// 发送数据到obu
	sendCmdToObu (obj) {
		const that = this;
		let callback = {
			success (res) {
				console.log('发送数据到OBU成功:' + JSON.stringify(res));
				// 写卡
				let r = that.data.res;
				r[that.data.index] = res.data;
				that.mySetData({
					res: r
				});
				let result = that.data.result;
				that.mySetData({
					index: that.data.index + 1
				});
				if (that.data.result.length === that.data.index) {
					setTimeout(() => {
						that.startOnlineDistribution();
					}, 200);
					return;
				}
				let o = result[that.data.index];
				if (o.key === 0) {
					that.sendCmdToCard(o);
				} else {
					that.sendCmdToObu(o);
				}
			},
			fail (res) {
				console.log('发送数据到OBU失败:' + res);
				that.isOver('PICC code=' + res.code + ' msg=' + res.msg);
			}
		};
		plugin.sendAndReceive(1, obj.cmd, callback, 10001);
	},
	// 发送数据到卡
	sendCmdToCard (obj) {
		const that = this;
		let callback = {
			success (res) {
				console.log('发送数据到卡成功:' + JSON.stringify(res));
				// 写卡
				let r = that.data.res;
				r[that.data.index] = res.data;
				that.mySetData({
					res: r
				});
				let result = that.data.result;
				that.mySetData({
					index: that.data.index + 1
				});
				if (that.data.result.length === that.data.index) {
					setTimeout(() => {
						that.startOnlineDistribution();
					}, 200);
					return;
				}
				let o = result[that.data.index];
				if (o.key === 0) {
					that.sendCmdToCard(o);
				} else {
					that.sendCmdToObu(o);
				}
			},
			fail (res) {
				console.log('esam', res);
				that.isOver('ESAM code=' + res.code + ' msg=' + res.msg);
			}
		};
		plugin.sendAndReceive(0, obj.cmd, callback, 10001);
	},
	// 重置
	isOver (msg) {
		if (msg) {
			this.disonnectDevice();
			this.mySetData({
				connectState: -1
			});
		}
		this.mySetData({
			device: 0,
			isActivating: false,
			getListFailed: true,
			errMsg: msg
		});
	},
	// 断开设备连接
	disonnectDevice () {
		plugin.disConnectBLE({
			success (res) {
				console.log('蓝牙断开成功  code=' + res.code + ' msg=' + res.msg);
				wx.closeBluetoothAdapter();
			},
			fail (res) {
				wx.closeBluetoothAdapter();
				console.log('蓝牙断开失败  code=' + res.code + ' msg=' + res.msg);
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
		this.disonnectDevice();
	}
});
