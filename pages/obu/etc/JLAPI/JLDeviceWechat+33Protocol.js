var TAG = 'JLDeviceWechar+33Protocol';
var onfire = require('./onfire');
var request33 = require('./JLObuWechat33Pack.js');
var recive33 = require('./JLObuWecha33UnPackt.js');
var config = require('./JLZJConfig');
var ble = require('./JLBleManagerTool.js');
var dataTool = require('./dataTool');
var sendTimeOut = 1e4;
var connectTimeOut = 3e4;
var wechat_arr = [];
var dataArray = [];
var isConnect = false;
var frame_total = 1;
var frame_count = 1;
var fireFlag = '';
var timeId;
var receive_data = '';
var receive_data_total_len = '';
var wechat1 = false;
var wechat2 = false;
var timeId;
var cmd_count = 0;
var all_cmdArray = [];
var flag = 0;
var result_arr = [];
var errMsg_arr = [];
var current_device = null;
export function scanDevice (nameFlag, timeOut, callBack) {
	timeId = setTimeout(res => {
		ble.scan_stopScanBleDevice(res => {
			callBack.call(this, {
				code: config.timeOutCode(),
				msg: '扫描超时',
				data: null
			});
		});
	}, timeOut);
	ble.scan_StartScanBleDevice(nameFlag, res => {
		clearTimeout(timeId);
		console.log('返回上层数据:' + JSON.stringify(res));
		callBack.call(this, res);
	});
};
export function stopScanDevice (callBack) {
	ble.scan_stopScanBleDevice(res => {
		callBack.call(this, res);
	});
};
export function connect (device, callBack) {
	console.log('==========connectDevice_Start==========:' + JSON.stringify(device));
	receive_data = '';
	if (current_device != null) {
		callBack.call(this, {
			code: 10004,
			msg: '已连接其他蓝牙设备',
			data: current_device
		});
		return;
	}
	if (device == null || device == 'undefined') {
		callBack.call(this, {
			code: 10003,
			msg: '参数错误',
			data: null
		});
		return;
	}
	timeId = setTimeout(res => {
		disConnectDevice(res => {});
		callBack.call(this, {
			code: config.timeOutCode(),
			msg: '连接超时',
			data: null
		});
	}, connectTimeOut);
	ble.scan_stopScanBleDevice(res => {
		if (res.code == config.successCode()) {
			ble.connectDevice(device, res => {
				if (res.code == config.successCode()) {
					ble.findDeviceServices(res.data, res => {
						console.info(JSON.stringify(res));
						ble.setParams(res.data.id);
						if (res.code != config.successCode()) {
							disConnectDevice(res => {});
							console.log('返回上层数据:' + JSON.stringify(res));
							callBack.call(this, {
								code: config.bleErrorCode(),
								msg: '连接失败',
								data: null
							});
						}
					}, res1 => {
						dealReceiveData(res1.data.value, res => {
							clearTimeout(timeId);
							console.log('返回上层数据:' + JSON.stringify(res));
							ICCReset_Protocol(res => {
								if (res.code == 0) {
									current_device = device;
									callBack.call(this, {
										code: config.bleSuccessCode(),
										msg: '连接成功',
										data: null
									});
								} else {
									disConnectDevice(res => {});
									callBack.call(this, {
										code: config.bleErrorCode(),
										msg: '连接失败,卡复位失败',
										data: null
									});
								}
							});
						});
					});
				} else {
					console.log('返回上层数据:' + JSON.stringify(res));
					callBack.call(this, res);
				}
			});
		} else {
			console.log('返回上层数据:' + JSON.stringify(res));
			callBack.call(this, res);
		}
	});
};
export function onDisconnet (callBack) {
	ble.onDeviceConnectStateChange(res => {
		isConnect = false;
		dataArray = [];
		frame_count = 0;
		frame_total = 0;
		onfire.clear();
		receive_data = '';
		clearTimeout(timeId);
		current_device = null;
		callBack.call(this, res);
	});
};
export function disConnectDevice (callBack) {
	receive_data = '';
	ble.disConnectDevice(res => {
		isConnect = false;
		dataArray = [];
		frame_count = 0;
		frame_total = 0;
		onfire.clear();
		clearTimeout(timeId);
		current_device = null;
		callBack.call(this, res);
	});
};
export function ESAMReset_Protocol (callBack) {
	console.log('==========ESAMReset_Protocol_Start==========');
	receive_data = '';
	timeId = setTimeout(res => {
		receive_data = '';
		errMsg_arr = [];
		callBack.call(this, {
			code: config.timeOutCode(),
			msg: 'ICC复位超时',
			data: null
		});
	}, sendTimeOut);
	var cmd_arr = request33.ESAMResetReq();
	ble.sendMessageToDevice(cmd_arr, res => {
		fireFlag = config.ResetFlag();
		recive33.receiveReset(res => {
			clearTimeout(timeId);
			console.log('返回上层数据:' + JSON.stringify(res));
			callBack.call(this, res);
		});
	});
};
export function ESAMChannel_CmdArray (cmdArray, callBack) {
	if (current_device == null) {
		callBack.call(this, {
			code: config.errorCode(),
			msg: '未连接设备',
			data: null
		});
		return;
	}
	cmd_count = cmdArray.length;
	all_cmdArray = cmdArray;
	ESAMTransfro(callBack);
};
export function ICCReset_Protocol (callBack) {
	console.log('==========ICCReset_Protocol_Start==========');
	receive_data = '';
	timeId = setTimeout(res => {
		receive_data = '';
		callBack.call(this, {
			code: config.timeOutCode(),
			msg: 'ICC复位超时',
			data: null
		});
	}, sendTimeOut);
	var cmd_arr = request33.ICCResetReq();
	ble.sendMessageToDevice(cmd_arr, res => {
		fireFlag = config.ResetFlag();
		recive33.receiveReset(res => {
			clearTimeout(timeId);
			console.log('返回上层数据:' + JSON.stringify(res));
			callBack.call(this, res);
		});
	});
};
export function ICCChannel_CmdArray (cmdArray, callBack) {
	if (current_device == null) {
		callBack.call(this, {
			code: config.errorCode(),
			msg: '未连接设备',
			data: null
		});
		return;
	}
	cmd_count = cmdArray.length;
	all_cmdArray = cmdArray;
	ICCTransfro(callBack);
};

function ESAMChannel_Protocol (cmd, callBack) {
	console.log('==========ESAMChannel_Protocol_Start==========:' + cmd);
	var cmd_arr = request33.ESAMChannelTransmission('00', [cmd]);
	timeId = setTimeout(res => {
		receive_data = '';
		errMsg_arr = [];
		callBack.call(this, {
			code: config.timeOutCode(),
			msg: 'ESAM透传超时',
			data: null
		});
	}, sendTimeOut);
	ble.sendMessageToDevice(cmd_arr, res => {
		fireFlag = config.ChannelFlag();
		recive33.receiveChannel(res => {
			clearTimeout(timeId);
			console.log('返回上层数据:' + JSON.stringify(res));
			callBack.call(this, res);
		});
	});
}

function ESAMTransfro (callBack) {
	var cmd = all_cmdArray[flag];
	var that = this;
	ESAMChannel_Protocol(cmd, res => {
		if (res.code == 0) {
			flag++;
			if (errMsg_arr.length == 0) {
				result_arr.push(res.data);
			}
			if (flag < cmd_count) {
				ESAMTransfro(callBack);
			} else {
				cmd_count = 0;
				all_cmdArray = [];
				flag = 0;
				if (errMsg_arr.length == 0) {
					res.data = result_arr;
				}
				result_arr = [];
				callBack.call(this, res);
			}
		} else {
			if (errMsg_arr.length > 0) {
				res.msg = errMsg_arr[flag];
			}
			errMsg_arr = [];
			cmd_count = 0;
			all_cmdArray = [];
			flag = 0;
			callBack.call(this, res);
		}
	});
}

function ICCChannel_Protocol (cmd, callBack) {
	console.log('==========ICCChannel_Protocol_Start==========:' + cmd);
	var cmd_arr = request33.ICCChannelTransmission('00', [cmd]);
	timeId = setTimeout(res => {
		receive_data = '';
		callBack.call(this, {
			code: config.timeOutCode(),
			msg: 'ICC透传超时',
			data: null
		});
	}, sendTimeOut);
	ble.sendMessageToDevice(cmd_arr, res => {
		fireFlag = config.ChannelFlag();
		recive33.receiveChannel(res => {
			clearTimeout(timeId);
			console.log('返回上层数据:' + JSON.stringify(res));
			callBack.call(this, res);
		});
	});
}

function ICCTransfro (callBack) {
	var cmd = all_cmdArray[flag];
	var that = this;
	ICCChannel_Protocol(cmd, res => {
		if (res.code == 0) {
			flag++;
			if (errMsg_arr.length == 0) {
				result_arr.push(res.data);
			}
			if (flag < cmd_count) {
				ICCTransfro(callBack);
			} else {
				cmd_count = 0;
				all_cmdArray = [];
				flag = 0;
				if (errMsg_arr.length == 0) {
					res.data = result_arr;
				}
				result_arr = [];
				callBack.call(this, res);
			}
		} else {
			if (errMsg_arr.length > 0) {
				res.msg = errMsg_arr[flag];
			}
			cmd_count = 0;
			all_cmdArray = [];
			result_arr = [];
			flag = 0;
			callBack.call(this, res);
		}
	});
}

function dealReceiveData (data, callBack) {
	if (receive_data.length > 0) {
		if (receive_data.indexOf('FE01') == -1) {
			receive_data = '';
		}
	}
	receive_data += data;
	var blg = parseInt(receive_data.substring(4, 8), 16) * 2 == receive_data.length ? true : false;
	if (blg) {
		var flag_protocol = receive_data.substr(24, 2);
		var flag_wechat = receive_data.substr(8, 4);
		if (flag_protocol == '33') {
			console.log(TAG + '----fireFlag:' + fireFlag);
			var pack_count = receive_data.substr(28, 2);
			wechat_arr.push(receive_data);
			receive_data = '';
			if (pack_count == '80' || pack_count == '00') {
				onfire.fire(fireFlag, wechat_arr);
				wechat_arr = [];
			}
		} else if (flag_wechat == '2711' || flag_wechat == '2713') {
			if (flag_wechat == '2711') {
				var mac = receive_data.substring(40, 44);
				var cmd_arr = request33.wechatInit1(mac);
				receive_data = '';
				ble.sendMessageToDevice(cmd_arr, res => {});
			} else if (flag_wechat == '2713') {
				var cmd_arr = request33.wechatInit2(mac);
				receive_data = '';
				ble.sendMessageToDevice(cmd_arr, res => {
					receive_data = '';
					callBack.call(this, {
						code: config.bleSuccessCode(),
						msg: '连接成功',
						data: null
					});
				});
			} else {
				callBack.call(this, {
					code: config.bleErrorCode,
					msg: '非法连接',
					data: null
				});
			}
		} else {
			callBack.call(this, {
				code: config.bleErrorCode,
				msg: '非法连接',
				data: null
			});
		}
	}
}
