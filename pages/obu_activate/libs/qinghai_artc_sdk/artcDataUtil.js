/**
 * 微信硬件设备蓝牙协议 + protobuf + 厂商协议（ST + CTL + LEN + DATA + BCC）
 * ST：1byte，固定为0x50
 * CTL：2byte，最高位为1是为开始包，其他位标识总包数，最高位为0表示延续包，其他位表包序号，如：0x8003、0x0002、0x0003
 * LEN：1byte，DATA的字节数
 * BCC：1byte，从ST到DATA的^运算
 */
const dataHandler = require("./artcDataHandler.js")
const frame_Len = (92 * 2)
const send_Len = (20 * 2)
const ST = "50"
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
    frames.push(data.slice(- frameBalance))
  }
  //加厂商结构
  let manufacturerFrames = new Array();
  for (let i = 0; i < frames.length; i++) {
    let temp = frames[i]
    let CTL = ""
    if (i == 0) {
      CTL = dataHandler.numberToHexString(0x8000 + frames.length, 2, true)
    }
    else {
      CTL = dataHandler.numberToHexString(i + 1, 2, true)
    }
    let LEN = dataHandler.numberToHexString(parseInt(temp.length / 2), 1, true)
    let frame = ST + CTL + LEN + temp
    let bcc = 0
    for (let j = 0; j < parseInt(frame.length / 2); j++) {
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
      let item = temp.slice(- bufferBalance)
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
 * 设备初始化通道
 */
function make80SendData() {
  let data = "80"
  return makeFrame(data)
}

/**
 * 对设备操作通道
 * "c0" : 获取设备的设备表面号
 * "c1" : 获取设备的版本号
 * "c2" : 获取设备的电池电量
 * "c3" : 强制设备断电
 * "c4" : 对设备复位
 * "c5" : 获取设备的蓝牙MAC
 * "cc" : 获取设备信息：ASCII码，最长100字节
 */
function make81SendData(command) {
  let data = "81"
  let len = dataHandler.numberToHexString(parseInt(command.length / 2), 2, false)
  data += len
  data += command
  return makeFrame(data)
}

/**
 * 对IC/ESAM/SE等进行COS操作通道
 * dataType : bit0=数据类型（0-明文数据，1-密文数据）；bit1~bit3=(设置为0)；bit4~bit7=目标索引（1-用户卡，2-ESAM安全模块，3-SE，其他保留）
 * cos : TLV格式(长度不超过384)
 */
function make82SendData(dataType, cos) {
  let data = "82"
  let len = dataHandler.numberToHexString(parseInt(cos.length / 2), 2, false)
  data += dataType
  data += len
  data += cos
  return makeFrame(data)
}

/**
 * 获取IC卡密文通讯时的记录通道
 * conmand : "co" + 记录索引
 */
function make83SendData(command) {
  let data = "83"
  let len = dataHandler.numberToHexString(parseInt(command.length / 2), 2, false)
  data += len
  data += command
  return makeFrame(data)
}

/**
 * 设备认证（包括更新终端证书）操作通道
 * "c0" : 设备认证步骤1
 * "c1" + 工作密钥密文 + ... + Rnd2 + S2 : 设备认证步骤2
 * "c2" : 更新终端证书步骤1 -- 初始化
 * "c3" : 更新终端证书步骤2 -- 获取终端公钥
 * "c4" + 终端证书 : 更新终端证书步骤3 -- 更新证书 
 */
function make84SendData(command) {
  let data = "84"
  let len = dataHandler.numberToHexString(parseInt(command.length / 2), 2, false)
  data += len
  data += command
  return makeFrame(data)
}

/**
 * 数据透彻操作通道
 * dataType : bit0=数据类型（0-明文数据，1-密文数据）；bit1~bit3=(设置为0)；bit4~bit7=目标索引（1-用户卡，2-ESAM安全模块，3-SE，其他保留）
 * command : 透彻指令数据
 */
function make85SendData(dataType, command) {
  let data = "85"
  let len = dataHandler.numberToHexString(parseInt(command.length / 2), 2, false)
  data += dataType
  data += len
  data += command
  return makeFrame(data)
}

/**
 * 厂商自定义功能
 * "c1" + code : 设备显示字符，code("01"=激活中，"02"=激活成功，"03"=激活失败，"04"=发行中，"05"=发行成功，"06"=发行失败)
 */
function make8FSendData(command) {
  let data = "8F"
  let len = dataHandler.numberToHexString(parseInt(command.length / 2), 2, false)
  data += len
  data += command
  return makeFrame(data)
}

module.exports = {
  makeAuthResponse : makeAuthResponse,
  makeInitResponse : makeInitResponse,
  make80SendData : make80SendData,
  make81SendData : make81SendData,
  make82SendData : make82SendData,
  make83SendData : make83SendData,
  make84SendData : make84SendData,
  make85SendData : make85SendData,
  make8FSendData : make8FSendData
}