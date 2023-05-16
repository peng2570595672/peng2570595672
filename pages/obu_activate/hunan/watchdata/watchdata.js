/*
* 湖南握奇
 */
const util = require('../../../../utils/util.js');
var obuSdk = require('../../../../libs/hunan_watchdata_sdk/WCDObuSdk.js');
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
		resultInfo: '',
		originValue: '',
		apduFlag: '',
		result: {},
		res: [],
		index: 0,
		type: 0,
		selfType: 0,
		oldCardNo: '',
		oldObuNo: '',
		repairType: -1 // 1换卡 2 换签 3换卡换签
	},
	onLoad (options) {
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
		// 8991 7518
		// app.globalData.orderInfo.orderId = '656545578007658496';
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
		wx.openBluetoothAdapter({
			success: (res) => {
				console.log('开启蓝牙适配器：' + JSON.stringify(res));
				wx.startBluetoothDevicesDiscovery({
					services: ['FEE7'],
					success: (res) => {
						console.log('扫描设备：' + JSON.stringify(res));
						// 搜索到新设备回调
						wx.onBluetoothDeviceFound((res) => {
							console.log('找到设备：' + JSON.stringify(res));
							for (let i = 0; i < res.devices.length; i++) {
								let device = res.devices[i];
								let name = device.localName ? device.localName : device.name;
								if (name.indexOf('HN') !== -1 || name.indexOf('GV') !== -1) {
									if (!this.data.device) {
										// 停止扫描蓝牙设备
										this.stopScanDevice();
										if (timer) {
											clearTimeout(timer);
										}
										this.mySetData({
											device: device,
											deviceName: name,
											getListFailed: true,
											showLoading: false
										});
										this.connectDevice();
									}
								}
							}
						});
					},
					fail: () => {
						this.mySetData({
							getListFailed: true,
							showLoading: false
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
	// 连接设备
	connectDevice () {
		console.log('开始连接');
		obuSdk.connectAndInit(this.data.device, {
			success: (res) => {
				console.log(JSON.stringify(res));
				// 0 表示连接成功
				this.mySetData({
					connectState: 1,
					getListFailed: false
				});
			},
			fail: (res) => {
				console.log(JSON.stringify(res));
				// 0 表示连接成功
				this.mySetData({
					device: 0,
					connectState: 2,
					getListFailed: false
				});
			}
		}, 10000);
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
		this.mySetData({
			msg: '正在读取卡号...'
		});
		obuSdk.sendAndReceive(0, ['00A40000023F00', '00A40000021001', '00B095002b'], {
			success: (res) => {
				if (res && res.data && res.data.length === 3) {
					let cardNo = res.data[2].substring(20, 40);
					this.mySetData({
						cardNo: cardNo
					});
					this.readObuNoFromDevice();
				} else {
					this.isOver('读取卡号失败，请重试！');
				}
			},
			fail: (res) => {
				this.isOver(res.msg);
			}
		}, 60000);
	},
	readObuNoFromDevice () {
		this.mySetData({
			msg: '正在读取OBU号...'
		});
		obuSdk.sendAndReceive(1, ['00A40000023F00', '00B081001B'], {
			success: (res) => {
				if (res && res.data && res.data.length === 2) {
					let obuNo = res.data[1].slice(20, 36);
					this.mySetData({
						obuNo: obuNo
					});
					// 普通流程
					if (this.data.repairType === -1) {
						this.getCardAndObuIssueStatus();
					} else {
						this.getOrderInfo();
					}
				} else {
					this.isOver('读取OBU号失败，请重试！');
				}
			},
			fail: (res) => {
				this.isOver(res.msg);
			}
		}, 60000);
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
							this.getOrderInfo();
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
				this.getOrderInfo();
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
				this.startOnlineDistribution();
			} else if (parseInt(res.data.order_status) === 8 || parseInt(res.data.order_status) === 10) {
				// 换卡 或者 换签
				this.startOnlineDistribution();
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
				this.getCardAndObuIssueStatus(true);
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
			if (obj.key === 0) {
				this.sendCmdToCard(obj);
			} else {
				this.sendCmdToObu(obj);
			}
		}
	},
	// 发送数据到obu
	sendCmdToObu (obj) {
		obuSdk.sendAndReceive(1, obj.cmd, {
			success: (res) => {
				console.log('发送数据到OBU成功:' + JSON.stringify(res));
				// 写卡
				let r = this.data.res;
				r[this.data.index] = res.data;
				this.mySetData({
					res: r
				});
				let result = this.data.result;
				this.mySetData({
					index: this.data.index + 1
				});
				if (this.data.result.length === this.data.index) {
					this.startOnlineDistribution();
					return;
				}
				let o = result[this.data.index];
				if (o.key === 0) {
					this.sendCmdToCard(o);
				} else {
					this.sendCmdToObu(o);
				}
			},
			fail: (res) => {
				console.log('发送数据到OBU失败:' + JSON.stringify(res));
				this.isOver(res.msg);
			}
		}, 60000);
	},
	// 发送数据到卡
	sendCmdToCard (obj) {
		obuSdk.sendAndReceive(0, obj.cmd, {
			success: (res) => {
				console.log('发送数据到卡成功:' + JSON.stringify(res));
				// 写卡
				let r = this.data.res;
				r[this.data.index] = res.data;
				this.mySetData({
					res: r
				});
				let result = this.data.result;
				this.mySetData({
					index: this.data.index + 1
				});
				if (this.data.result.length === this.data.index) {
					this.startOnlineDistribution();
					return;
				}
				let o = result[this.data.index];
				if (o.key === 0) {
					this.sendCmdToCard(o);
				} else {
					this.sendCmdToObu(o);
				}
			},
			fail: (res) => {
				console.log('发送数据到卡失败:' + JSON.stringify(res));
				this.isOver(res.msg);
			}
		}, 60000);
	},
	// 重置
	isOver (msg) {
		this.disonnectDevice();
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
		this.disonnectDevice();
	}
});
