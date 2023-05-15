/**
 * 协议说明（使用省份：广西）
 * 微信硬件设备蓝牙协议 + protobuf + 厂商协议（ST + SN + CTL + LEN + DATA + BCC）
 * ST：1byte，固定0x33
 * SN：1byte，帧序
 * CTL：1byte，包标识，包序号从N-1开始,如：0x82、0x01、0x00，首包0x8（N-1）（只有一包为0x80）
 * LEN：1byte，DATA的字节数
 * BCC：1byte，从SN到DATA的^运算
 */
const dataHandler = require("./artcDataHandler.js")
const dataUtil = require("./artcDataUtil.js")
const FUNCTION = "function"
const serviceUUID = "0000FEE7-0000-1000-8000-00805F9B34FB"
const writeUUID = "0000FEC7-0000-1000-8000-00805F9B34FB"
const readUUID = "0000FEC8-0000-1000-8000-00805F9B34FB"
const connectTime = (20 * 1000)
const startA2Time = 240
const waitA2ResponseTime = 1000
const codeEnum = {
	successCode: 0,
	failureCode: 1,
	stopScanFailure: 2,
	creatConnectionFailure: 3,
	getServiceFailure: 4,
	noTargetServiceId: 5,
	getCharacteristicsFailure: 6,
	noTargetCharacteristic: 7,
	monitorNotificationFailure: 8,
	authResponseFailure: 9,
	initResponseFailure: 10,
	initDeviceFailure: 11,
	dataFrameTransboundary: 12,
	notPassBccCheck: 13,
	sendDataFailure: 14,
	timeout: 100
}

var haveFoundDevice = new Array()//已发现的设备
var connectDeviceId//连接的设备ID
var connectCallback//连接回调函数
var connectTimer//超时计数器
var startA2Timer//等待发送a2指令
var waitA2ResponseTimer//等待a2回复
var frame = ""//一帧数据
var frameLen = 0//一帧数据的长
var frames = new Array()//数据集
var framesLen = 0//数据集的长
var dataHandlerCallback//接收数据处理回调
var sendBufferArray = new Array()//发送buffer数组
var sendIndex//发送下标
var resendCount = 3//重发次数

/**
 * 搜索设备
 * callback:搜索回调，(code, device, msg) => {}
 */
function scanBleDevice(callback) {
	haveFoundDevice = new Array()
	wx.startBluetoothDevicesDiscovery({
		services: ["FEE7"],
		success: function (res) {
			//搜索到新设备回调
			wx.onBluetoothDeviceFound(function (res) {
				for (let i = 0; i < res.devices.length; i++) {
					let device = res.devices[i];
					let ishave = false;
					for (let j = 0; j < haveFoundDevice.length; j++) {
						let foundDevice = haveFoundDevice[i];
						if (device.deviceId == foundDevice.deviceId) {
							ishave == true;
							break;
						}
					}
					if (ishave == false) {
						haveFoundDevice.push(device);
						typeof callback == FUNCTION && callback(codeEnum.successCode, device, "新设备");
					}
				}
			})
		},
		fail: function () {
			typeof callback == FUNCTION && callback(codeEnum.failureCode, null, "搜索失败");
		}
	})
}

/**
 * 连接设备
 * deviceId:蓝牙外设的id
 * callback:连接结果回调函数，(code) => {}
 */
function connectBleDevice(deviceId, callback) {
	connectDeviceId = deviceId
	console.log('connectDeviceId:' + connectDeviceId);
	connectCallback = callback
	if (typeof connectTimer != undefined) clearTimeout(connectTimer)
	if (typeof startA2Timer != undefined) clearTimeout(startA2Timer)
	if (typeof waitA2ResponseTimer != undefined) clearTimeout(waitA2ResponseTimer)
	connectTimer = setTimeout(() => {
		typeof connectCallback == FUNCTION && connectCallback(codeEnum.timeout)
	}, connectTime)
	wx.stopBluetoothDevicesDiscovery({
		success: function (res) {
			//开始连接
			startConnectBle()
		},
		fail: function () {
			if (typeof connectTimer != undefined) clearTimeout(connectTimer)
			typeof connectCallback == FUNCTION && connectCallback(codeEnum.stopScanFailure)
		}
	})
}

/**
 * 开始连接
 */
function startConnectBle() {
	console.log("开始连接")
	wx.createBLEConnection({
		deviceId: connectDeviceId,
		success: function (res) {
			//获取并检查服务
			startGetAndCheckService()
		},
		fail: function () {
			if (typeof connectTimer != undefined) clearTimeout(connectTimer)
			typeof connectCallback == FUNCTION && connectCallback(codeEnum.creatConnectionFailure)
		}
	})
}

/**
 * 开始获取服务
 */
function startGetAndCheckService() {
	console.log("开始获取服务")
	wx.getBLEDeviceServices({
		deviceId: connectDeviceId,
		success: function (res) {
			//检查目标服务
			let haseTargetServiceId = false
			for (let i = 0; i < res.services.length; i++) {
				let itemServiceId = res.services[i].uuid
				if (itemServiceId == serviceUUID) {
					haseTargetServiceId = true
					break
				}
			}
			if (haseTargetServiceId == true) {
				//开始获取检查目标特征
				startGetAndCheckCharacterisitc()
			} else {
				if (typeof connectTimer != undefined) clearTimeout(connectTimer)
				typeof connectCallback == FUNCTION && connectCallback(codeEnum.noTargetServiceId)
			}
		},
		fail: function () {
			if (typeof connectTimer != undefined) clearTimeout(connectTimer)
			typeof connectCallback == FUNCTION && connectCallback(codeEnum.getServiceFailure)
		}
	})
}

/**
 * 获取并检查特征
 */
function startGetAndCheckCharacterisitc() {
	console.log("获取并检查特征")
	wx.getBLEDeviceCharacteristics({
		deviceId: connectDeviceId,
		serviceId: serviceUUID,
		success: function (res) {
			let haveRead = false
			let haveWrite = false
			for (let i = 0; i < res.characteristics.length; i++) {
				let itemUUID = res.characteristics[i].uuid
				if (itemUUID == readUUID) {
					haveRead = true
				} else if (itemUUID == writeUUID) {
					haveWrite = true
				}
				if (haveRead == true && haveWrite == true) {
					break
				}
			}
			if (haveRead == true && haveWrite == true) {
				//监听数据
				monitorNotification()
			} else {
				if (typeof connectTimer != undefined) clearTimeout(connectTimer)
				typeof connectCallback == FUNCTION && connectCallback(codeEnum.noTargetCharacteristic)
			}
		},
		fail: function () {
			if (typeof connectTimer != undefined) clearTimeout(connectTimer)
			typeof connectCallback == FUNCTION && connectCallback(codeEnum.getCharacteristicsFailure)
		}
	})
}

/**
 * 监听数据
 */
function monitorNotification() {
	console.log("监听数据")
	wx.notifyBLECharacteristicValueChange({
		deviceId: connectDeviceId,
		serviceId: serviceUUID,
		characteristicId: readUUID,
		state: true,
		success: function (res) {
		},
		fail: function () {
			if (typeof connectTimer != undefined) clearTimeout(connectTimer)
			typeof connectCallback == FUNCTION && connectCallback(codeEnum.monitorNotificationFailure)
		}
	})

	wx.onBLECharacteristicValueChange((res) => {
		if (res.deviceId = connectDeviceId && res.serviceId == serviceUUID && res.characteristicId == readUUID) {
			//解析数据
			analyticData(res.value)
		}
	})
}

/**
 * 解析数据
 */
function analyticData(value) {
	let data = dataHandler.bufferArrayToHexString(value)
	console.log("接收：" + data)
	if (frame.length == 0) {
		frameLen = parseInt(data.slice(4, 8), 16) * 2
	}
	frame += data
	if (frame.length > frameLen) {
		frame = ""
		frameLen = 0
		typeof dataHandlerCallback == FUNCTION && dataHandlerCallback(codeEnum.dataFrameTransboundary, "", "数据长度越界")
	} else if (frame.length == frameLen) {
		let bCmdId = frame.slice(8, 12)
		if (bCmdId === "2711") {
			frame = ""
			frameLen = 0
			//收到authrequest握手包，回复
			sendDataToDevice(dataUtil.makeAuthResponse(), (code, data, msg) => {
				if (code != 0) {
					if (typeof connectTimer != undefined) clearTimeout(connectTimer)
					typeof connectCallback == FUNCTION && connectCallback(codeEnum.authResponseFailure)
				}
			})
		} else if (bCmdId === "2713") {
			frame = ""
			frameLen = 0
			//收到initrequest握手包，回复
			sendDataToDevice(dataUtil.makeInitResponse(), (code, data, msg) => {
				if (code != 0) {
					if (typeof connectTimer != undefined) clearTimeout(connectTimer)
					if (typeof startA2Timer != undefined) clearTimeout(startA2Timer)
					typeof connectCallback == FUNCTION && connectCallback(codeEnum.initResponseFailure)
				}
			})
			//延时，发设备握手包
			startA2Timer = setTimeout(() => {
				//发送设备初始化数据
				initDevice()
				//一段时间没任何相应，重发一次
				waitA2ResponseTimer = setTimeout(() => {
					initDevice()
				}, waitA2ResponseTime)
			}, startA2Time)
		} else if (bCmdId === "2712") {
			let outWechatFrame = frame.slice(16)
			let outProtoFrame = outWechatFrame.slice(8, -6)
			frame = ""
			frameLen = 0
			if (frames.length == 0) {
				let ctl = parseInt(outProtoFrame.slice(4, 6), 16)
				framesLen = ctl - 0x80 + 1
			}
			frames.push(outProtoFrame)
			if (frames.length == framesLen) {
				let allPaseBCC = true
				for (let i = 0; i < frames.length; i++) {
					let itemFrame = frames[i]
					let bcc = 0
					for (let j = 1; j < parseInt(itemFrame.length / 2) - 1; j++) {
						let bit = parseInt(itemFrame.slice(j * 2, (j + 1) * 2), 16)
						bcc ^= bit
					}
					if (bcc != parseInt(itemFrame.slice(-2), 16)) {
						allPaseBCC = false
						break;
					}
				}
				if (allPaseBCC == false) {
					frames = new Array()
					framesLen = 0
					typeof dataHandlerCallback == FUNCTION && dataHandlerCallback(codeEnum.notPassBccCheck, "", "bcc校验不通过")
				} else {
					let completeData = ""
					for (let i = 0; i < frames.length; i++) {
						let itemFrame = frames[i]
						completeData += itemFrame.slice(8, -2)
					}
					frames = new Array()
					framesLen = 0
					typeof dataHandlerCallback == FUNCTION && dataHandlerCallback(codeEnum.successCode, completeData, "成功")
				}
			}
		} else {
			console.log("奇异数据")
			frame = ""
			frameLen = 0
		}
	}
}

/**
 * 发送设备初始化握手数据
 */
function initDevice() {
	sendDataToDevice(dataUtil.makeA2SendData(), (code, data, msg) => {
		if (typeof connectTimer != undefined) clearTimeout(connectTimer)
		if (typeof waitA2ResponseTimer != undefined) clearTimeout(waitA2ResponseTimer)
		if (code === 0 && data.slice(2, 4) === "00") {
			typeof connectCallback == FUNCTION && connectCallback(codeEnum.successCode)
		} else {
			typeof connectCallback == FUNCTION && connectCallback(codeEnum.initDeviceFailure)
		}
	})
}

/**
 * 发送数据到设备
 * bufferArray: 通过dataUtil接口获取相应到的bufferArray的数据
 * callback: 结果回调，(code, data, msg) => {}
 */
function sendDataToDevice(bufferArray, callback) {
	dataHandlerCallback = callback
	sendBufferArray = new Array().concat(bufferArray)
	sendIndex = 0
	frame = ""
	frameLen = 0
	frames = new Array()
	framesLen = 0
	runningSendData()
}

/**
 * 连续发送待发数据
 */
function runningSendData() {
	let value = sendBufferArray[sendIndex]
	let hex = dataHandler.bufferArrayToHexString(value)
	console.log("发送：" + hex)
	wx.writeBLECharacteristicValue({
		deviceId: connectDeviceId,
		serviceId: serviceUUID,
		characteristicId: writeUUID,
		value: value,
		success: (res) => {
			sendIndex++
			resendCount = 3
			if (sendIndex < sendBufferArray.length) {
				runningSendData()
			}
		},
		fail: function () {
			if (resendCount > 0) {
				resendCount--
				setTimeout(() => {
					console.log("第" + (3 - resendCount) + "次重发")
					runningSendData()
				}, 200)
			} else {
				typeof dataHandlerCallback == FUNCTION && dataHandlerCallback(codeEnum.sendDataFailure, "", "发送数据失败")
			}
		}
	})
}

module.exports = {
	sendDataToDevice: sendDataToDevice,
	connectBleDevice: connectBleDevice,
	scanBleDevice: scanBleDevice
}
