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
const frame_Len = (92 * 2)
const send_Len = (20 * 2)
const ST = "33"
const pre_Proto = "0a0012"
const end_Proto = "1800"
const bMagic = "fe"
const bVer = "01"
const bCmdId = "7531"
var SEQ = 3;

/**
 * 封包
 */
function makeFrame(data) {
	//分包
	let frameCount = parseInt(data.length / frame_Len)
	let frameBalance = data.length % frame_Len
	let frames = new Array()
	for (let i = 0; i < frameCount; i++) {
		frames.push(data.slice(i * frame_Len, (i + 1) * frame_Len))
	}
	if (frameBalance > 0) {
		frames.push(data.slice(-frameBalance))
	}
	//加厂商结构
	let manufacturerFrames = new Array();
	for (let i = 0; i < frames.length; i++) {
		let temp = frames[i]
		let SN = dataHandler.numberToHexString(i + 1, 1, true)
		let CTL = ""
		if (i == 0) {
			CTL = dataHandler.numberToHexString(0x80 + frames.length - 1, 1, true)
		} else {
			CTL = dataHandler.numberToHexString(frames.length - i - 1, 1, true)
		}
		let LEN = dataHandler.numberToHexString(parseInt(temp.length / 2), 1, true)
		let frame = ST + SN + CTL + LEN + temp
		let bcc = 0
		for (let j = 1; j < parseInt(frame.length / 2); j++) {
			let bit = parseInt(frame.slice(j * 2, (j + 1) * 2), 16)
			bcc = bcc ^ bit
		}
		frame += dataHandler.numberToHexString(bcc, 1, true)
		manufacturerFrames.push(frame)
	}
	//加proto
	let protoFrames = new Array()
	for (let i = 0; i < manufacturerFrames.length; i++) {
		let temp = manufacturerFrames[i]
		let len = dataHandler.numberToHexString(parseInt(temp.length / 2), 1, true)
		let frame = pre_Proto + len + temp + end_Proto
		protoFrames.push(frame)
	}
	//加微信头
	let wechatFrames = new Array()
	for (let i = 0; i < protoFrames.length; i++) {
		let temp = protoFrames[i]
		let nLen = dataHandler.numberToHexString(parseInt(temp.length / 2) + 8, 2, true)
		let nSeq = dataHandler.numberToHexString(SEQ, 2, true)
		let frame = bMagic + bVer + nLen + bCmdId + nSeq + temp
		wechatFrames.push(frame)
	}
	//SEQ 累计
	SEQ++;
	if (SEQ > 0xf) {
		SEQ = 1;
	}
	//分割发生小包
	let bufferArray = new Array()
	for (let i = 0; i < wechatFrames.length; i++) {
		let temp = wechatFrames[i]
		let bufferCount = parseInt(temp.length / send_Len)
		let bufferBalance = temp.length % send_Len
		for (let j = 0; j < bufferCount; j++) {
			let item = temp.slice(j * send_Len, (j + 1) * send_Len)
			bufferArray.push(dataHandler.hexStringToBufferArray(item))
		}
		if (bufferBalance > 0) {
			let item = temp.slice(-bufferBalance)
			bufferArray.push(dataHandler.hexStringToBufferArray(item))
		}
	}
	return bufferArray
}

/**
 * authResponse
 */
function makeAuthResponse() {
	let prefix = "fe0100184e2100010a06080012024f4b12063132"
	let endfix = "33313234"
	let dataArray = new Array()
	dataArray.push(dataHandler.hexStringToBufferArray(prefix))
	dataArray.push(dataHandler.hexStringToBufferArray(endfix))
	return dataArray;
}

/**
 * initResponse
 */
function makeInitResponse() {
	let prefix = "fe0100164e2300020a06080012024f4b10001800"
	let endfix = "2000"
	let dataArray = new Array()
	dataArray.push(dataHandler.hexStringToBufferArray(prefix))
	dataArray.push(dataHandler.hexStringToBufferArray(endfix))
	return dataArray;
}

/**
 * COS指令通道
 */
function makeA1SendData(dataType, cos) {
	let data = "a1" + dataType
	let len = dataHandler.numberToHexString(parseInt(cos.length / 2), 2, false)
	data += len
	data += cos
	return makeFrame(data)
}

/**
 * app和蓝牙盒子建立握手
 */
function makeA2SendData() {
	let data = "a2"
	return makeFrame(data)
}

/**
 * PICC通道
 * dataType:"00"=明文，"01"=密文
 * cos指令：TLV格式(最大长度不吵384)
 */
function makeA3SendData(dataType, cos) {
	let data = "a3" + dataType
	let len = dataHandler.numberToHexString(parseInt(cos.length / 2), 2, false)
	data += len
	data += cos
	return makeFrame(data)
}

/**
 * SE指令通道
 * dataType:"00"=明文，"01"=密文
 * cos指令：TLV格式(最大长度不吵384)
 */
function makeA4SendData(dataType, cos) {
	let data = "a4" + dataType
	let len = dataHandler.numberToHexString(parseInt(cos.length / 2), 2, false)
	data += len
	data += cos
	return makeFrame(data)
}

/**
 * 蓝牙盒子通道
 * "c0"=获取蓝牙盒子设备编号
 * "c1"=获取蓝牙盒子版本号
 * "c2"=获取蓝牙盒子电池电量
 * "c3"=强制蓝牙盒子断电
 * "c4"=对蓝牙盒子超时计数器清零
 * "C6"=获取obu mac
 * */
function makeA5SendData(command) {
	let data = "a5"
	let len = dataHandler.numberToHexString(parseInt(command.length / 2), 1, true)
	data += len
	data += command
	return makeFrame(data)
}

/**
 * 认证通道
 * "c0"=认证指令1
 * "c1"+渠道证书号+渠道证书+Rnd2=认证指令2：渠道证书号（1bytes），0x01表示渠道证书1（001C文件），0x02表示渠道证书2（001D文件），0x03表示渠道证书3（001E文件）。渠道证书为证书明文（xx bytes）。Rnd2为随机数，长度为32bytes(其中前8字节为UTC时间) 。
 * "c2"+F1信息=认证指令3：F1:20bytes
 * "c3"+渠道证书号+Rnd2=认证指令4：渠道证书号（1bytes），0x01表示渠道证书1（001C文件），0x02表示渠道证书2（001D文件），0x03表示渠道证书3（001E文件）。Rnd2为随机数，长度为32bytes(其中前8字节为UTC时间) 。
 * "c4"=新版认证指令1(国密)
 * "c5"+工作密钥密文+工作密钥校验值（8字节）+MAC密钥密文+MAC密钥校验值（8字节）+Rnd2（16字节）+S2=新版认证指令2(国密)S2: 工作密钥密文 + 工作密钥校验码 + MAC密钥密文 + MAC密钥校验码 + 随机数的签名值（服务器私钥签名）注：设备端由SE完成验签、密钥校验、密钥解密操作
 */
function makeA6SendData(command) {
	let data = "a6"
	let len = dataHandler.numberToHexString(parseInt(command.length / 2), 2, false)
	data += len
	data += command
	return makeFrame(data)
}

/**
 * 证书更新通道
 * "c0"=设备发行初始化
 * "c1"=获取终端公钥
 * "c2"+终端证书=灌入终端证书
 */
function makeA7SendData(command) {
	let data = "a7"
	let len = dataHandler.numberToHexString(parseInt(command.length / 2), 2, false)
	data += len
	data += command
	return makeFrame(data)
}


/**
 * ESAM指令通道
 * dataType:"00"=明文，"01"=密文
 * cos指令：TLV格式(最大长度不吵384)
 */
function makeA8SendData(dataType, cos) {
	let data = "a7" + dataType
	let len = dataHandler.numberToHexString(parseInt(cos.length / 2), 2, false)
	data += len
	data += cos
	return makeFrame(data)
}


/**
 * PICC复位
 */
function makeA9SendData(command) {
	let data = "a9"
	let len = dataHandler.numberToHexString(parseInt(command.length / 2), 1, false)
	data += len
	data += command
	return makeFrame(data)
}

/**
 * 获取记录指令通道
 * "c0"+索引=获取PICC通道指令记录索引（1bytes）:记录索引号，循环记录，最新的记录号为01，上一次的为02，依次类推……
 */
function makeABSendData(command) {
	let data = "ab"
	let len = dataHandler.numberToHexString(parseInt(command.length / 2), 2, false)
	data += len
	data += command
	return makeFrame(data)
}

module.exports = {
	makeA1SendData: makeA1SendData,
	makeA2SendData: makeA2SendData,
	makeA3SendData: makeA3SendData,
	makeA4SendData: makeA4SendData,
	makeA5SendData: makeA5SendData,
	makeA6SendData: makeA6SendData,
	makeA7SendData: makeA7SendData,
	makeA8SendData: makeA8SendData,
	makeA9SendData: makeA9SendData,
	makeABSendData: makeABSendData,
	makeAuthResponse: makeAuthResponse,
	makeInitResponse: makeInitResponse
}
