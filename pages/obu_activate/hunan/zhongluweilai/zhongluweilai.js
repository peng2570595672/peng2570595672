/*
* 湖南中路未来
 */
const util = require('../../../../utils/util.js');
const etcBleUtil = require('../../libs/hunan_zhongluweilai_sdk/etcBleUtil.js');
const etcDataUtil = require('../../libs/hunan_zhongluweilai_sdk/etcDataUtil.js');
const etcDataHandler = require('../../libs/hunan_zhongluweilai_sdk/etcDataHandler.js');
const app = getApp();
let timer;
Page({
	data: {
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
		ui: {
			showLoading: true, // 是否显示搜索中
			getListFailed: false, // 获取obu设备
			deviceName: undefined, // 设备名称
			connectState: -1, // 是否已连接 默认连接中 1 已连接 2 连接失败
			isActivating: false, // 是否激活中
			errMsg: '', // 错误消息
			msg: '', // 进度提示
			activated: false, // 是否已经激活
			returnMiniProgram: 'returnMiniProgram',
			clickHandle: 'retry',
			cardNo: '',
			obuNo: '',
			isForce: false
		},
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
		// 651795450998816768 中路未来未贴标签订单号
		// 652144038597623808 贴标签的订单号
		// app.globalData.orderInfo.orderId = '652144038597623808';
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
		// 打开蓝牙适配器
		wx.openBluetoothAdapter({
			success: (res) => {
				// 扫描蓝牙设备
				etcBleUtil.scanBleDevice((code, device, msg) => {
					// 停止扫描
					this.stopScanDevice();
					if (code === 0) {
						let name = device.name;
						if (!name) {
							name = device.localName;
						}
						if (timer) {
							clearTimeout(timer);
						}
						this.mySetData({
							device: device,
							deviceName: name,
							getListFailed: true,
							showLoading: false
						});
						// 是中路未来设备才连接 否则只显示名称 连接中 会出现连接不上
						this.connectBleDevice(device);
					} else {
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
	//  连接设备
	connectBleDevice (device) {
		etcBleUtil.connectBleDevice(device, (code) => {
			if (code === 0) {
				// 0 表示连接成功
				this.mySetData({
					connectState: 1,
					getListFailed: false
				});
				console.log('连接设备成功');
			} else {
				// 0 表示连接成功
				this.mySetData({
					device: 0,
					connectState: 2,
					getListFailed: false
				});
				console.log('连接设备失败：' + code);
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
		let tlv = etcDataHandler.makeTLV(['00A40000023F00', '00A40000021001', '00B095002b']);
		etcBleUtil.sendDataToDevice(etcDataUtil.makeA3SendData('00', tlv), (code, data, msg) => {
			if (code === 0) {
				let reapdu = etcDataHandler.resolveTLV(data.slice(10));
				let cardNo = reapdu[2].substring(20, 40);
				this.mySetData({
					cardNo: cardNo
				});
				// 读取obu号
				this.readObuNoFromDevice();
			} else {
				this.isOver(`${code} - ${msg}`);
			}
		});
	},
// 读取obu号
	readObuNoFromDevice () {
		this.mySetData({
			msg: '正在读取OBU号...'
		});
		let tlv = etcDataHandler.makeTLV(['00A40000023F00', '00B081001B']);
		etcBleUtil.sendDataToDevice(etcDataUtil.makeA7SendData('00', tlv), (code, data, msg) => {
			if (code === 0) {
				let reapdu = etcDataHandler.resolveTLV(data.slice(10));
				let obuNo = reapdu[1].slice(20, 36);
				this.mySetData({
					obuNo: obuNo
				});
				// 换卡换签
				if (this.data.repairType === -1) {
					setTimeout(() => {
						this.getCardAndObuIssueStatus();
					}, 200);
				} else {
					// 普通二发和二次激活流程
					setTimeout(() => {
						this.getOrderInfo();
					}, 200);
				}
			} else {
				this.isOver(`${code} - ${msg}`);
			}
		});
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
		let url = this.data.repairType === -1 ? 'second-issue' : 'secondIssueReplace';
		let requestResult = await util.getDataFromServersV2(`consumer/etc/hunan/common/${url}`,params);
		if (res.code === 0) {
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
		let tlv = etcDataHandler.makeTLV(obj.cmd);
		etcBleUtil.sendDataToDevice(etcDataUtil.makeA7SendData('00', tlv), (code, data, msg) => {
			if (code === 0) {
				let reapdu = etcDataHandler.resolveTLV(data.slice(10));
				console.log(reapdu);
				// 写卡
				let r = this.data.res;
				r[this.data.index] = reapdu;
				this.mySetData({
					res: r
				});
				let result = this.data.result;
				this.mySetData({
					index: this.data.index + 1
				});
				if (this.data.result.length === this.data.index) {
					setTimeout(() => {
						this.startOnlineDistribution();
					}, 200);
					return;
				}
				let o = result[this.data.index];
				if (o.key === 0) {
					this.sendCmdToCard(o);
				} else {
					this.sendCmdToObu(o);
				}
			} else {
				this.isOver(`${code} - ${msg}`);
			}
		});
	},
	// 发送数据到卡
	sendCmdToCard (obj) {
		let tlv = etcDataHandler.makeTLV(obj.cmd);
		etcBleUtil.sendDataToDevice(etcDataUtil.makeA3SendData('00', tlv), (code, data, msg) => {
			if (code === 0) {
				console.log('发送数据成功');
				let reapdu = etcDataHandler.resolveTLV(data.slice(10));
				// reapdu元素顺序对于指令的处理结果
				console.log(reapdu);
				// 写卡
				let r = this.data.res;
				r[this.data.index] = reapdu;
				this.mySetData({
					res: r
				});
				let result = this.data.result;
				this.mySetData({
					index: this.data.index + 1
				});
				if (this.data.result.length === this.data.index) {
					setTimeout(() => {
						this.startOnlineDistribution();
					}, 200);
					return;
				}
				let o = result[this.data.index];
				// 0表示写卡 1表示写obu
				if (o.key === 0) {
					this.sendCmdToCard(o);
				} else {
					this.sendCmdToObu(o);
				}
			} else {
				this.isOver(`${code} - ${msg}`);
			}
		});
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
		wx.closeBLEConnection({
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
