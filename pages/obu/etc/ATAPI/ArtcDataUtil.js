
/**
 * number转换成指定字节数的hexString
 * num：转换的number值
 * bitNum：转换后的字节数
 * isBig：true-大端，fasle-小端
 */
var num2hex = function (num, bitNum, isBig) {
  //转大端hex并补足
  let hex = num.toString(16);
  for (let i = hex.length; i < bitNum * 2; i++) {
    hex = "0" + hex;
  }
  //多位截取
  if (hex.length > bitNum * 2) {
    hex = hex.substring(hex.length - bitNum * 2);
  }
  //转小端
  if (isBig == false) {
    let temp = "";
    for (let i = hex.length - 2; i >= 0; i -= 2) {
      temp = temp + hex.substring(i, i + 2);
    }
    hex = temp;
  }
  return hex;
}

/**
 * 将hexString转成bufferArray
 */
var hex2buf = function (hexString) {
  let bufferArray = new Uint8Array(hexString.match(/[\da-f]{2}/gi).map(function (h) {
    return parseInt(h, 16)
  }))
  return bufferArray.buffer
}

/**
 * 将bufferArray转成hexString
 */
var buf2hex = function (bufferArray) {
  let hex = Array.prototype.map.call(new Uint8Array(bufferArray), x => ('00' + x.toString(16)).slice(-2)).join('')
  return hex
}

/**
 * TLV指令构造
 * tpdus:指令集合
 * needResponse:对于tpdu指令是否需要返回数据，true有返回，fasle没有返回，如：["00a40000023f00","00a40000021001"],[true,false],这前一条有返回3f00的信息和状态码，后一条则只返回状态码，没有信息
 */
var makeTLV = function (tpdus, needResponses) {
  let tlv = ""
  for (let i = 0; i < tpdus.length; i++) {
    let temp = "" + tpdus[i]
    let status = i + 1
    if (typeof needResponses == "object" && needResponses[i] === false) {
      status = 0x80 + status
    }
    //指令失败继续往下执行
    status += 0x40;
    let cmdLen = parseInt(temp.length / 2);
    let cmdLenHex = cmdLen.toString(16);
    if (cmdLenHex.length % 2 != 0) {
      cmdLenHex = "0" + cmdLenHex;
    }
    if (cmdLen > 0x80) {
      cmdLenHex = (0x80 + parseInt(cmdLenHex.length / 2)).toString(16) + cmdLenHex;
    }
    tlv = tlv + num2hex(status, 1, true) + cmdLenHex + temp;
  }
  let tlvLen = tlv.length / 2;
  let tlvLenHex = tlvLen.toString(16);
  if (tlvLenHex.length % 2 != 0) {
    tlvLenHex = "0" + tlvLenHex;
  }
  if (tlvLen > 0x80) {
    tlvLenHex = (0x80 + parseInt(tlvLenHex.length / 2)).toString(16) + tlvLenHex;
  }
  return "80" + tlvLenHex + tlv;
}


/**
 * 分解TLV指令结构,返回tpdu指令数组
 */
var reTLV = function (tlv) {
  let tpdus = new Array();
  let lenc = parseInt(tlv.substring(2, 4), 16);
  let index = 4;
  if (lenc > 0x80) {
    index = index + (lenc - 0x80) * 2;
  }
  let count = 1;
  while (index < tlv.length) {
    let time = parseInt(tlv.substring(index, index + 2), 16);
    index += 2;
    let len = parseInt(tlv.substring(index, index + 2), 16);
    index += 2;
    if (len > 0x80) {
      let bit = (len - 0x80) * 2;
      len = parseInt(tlv.substring(index, index + bit), 16);
      index += bit;
    }
    let tpdu = tlv.substring(index, index + len * 2);
    tpdus.push(tpdu);
    index += len * 2;
  }
  if (tpdus.length == 0) {
    tpdus.push("FFFF");
  }
  return tpdus;
}

const frame_Len = 184
const send_Len = 40
const ST = "50"

var makeFrame = function (data) {
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
      CTL = num2hex(0x8000 + frames.length, 2, true)
    }
    else {
      CTL = num2hex(i + 1, 2, true)
    }
    let LEN = num2hex(parseInt(temp.length / 2), 1, true)
    let frame = ST + CTL + LEN + temp
    let bcc = 0
    for (let j = 0; j < parseInt(frame.length / 2); j++) {
      let bit = parseInt(frame.slice(j * 2, (j + 1) * 2), 16)
      bcc = bcc ^ bit
    }
    frame += num2hex(bcc, 1, true)
    manufacturerFrames.push(frame)
  }
  //分割发生小包
  let bufferArray = new Array()
  for (let i = 0; i < manufacturerFrames.length; i++) {
    let temp = manufacturerFrames[i]
    let bufferCount = parseInt(temp.length / send_Len)
    let bufferBalance = temp.length % send_Len
    for (let j = 0; j < bufferCount; j++) {
      let item = temp.slice(j * send_Len, (j + 1) * send_Len)
      bufferArray.push(hex2buf(item))
    }
    if (bufferBalance > 0) {
      let item = temp.slice(- bufferBalance)
      bufferArray.push(hex2buf(item))
    }
  }
  return bufferArray
}

/**
 * 设备初始化通道
 */
var make80SendData = function () {
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
var make81SendData = function (command) {
  let data = "81"
  let len = num2hex(parseInt(command.length / 2), 2, false)
  data += len
  data += command
  return makeFrame(data)
}

/**
 * 对IC/ESAM/SE等进行COS操作通道
 * dataType : bit0=数据类型（0-明文数据，1-密文数据）；bit1~bit3=(设置为0)；bit4~bit7=目标索引（1-用户卡，2-ESAM安全模块，3-SE，其他保留）
 * cos : TLV格式(长度不超过384)
 */
var make82SendData = function (dataType, cos) {
  let data = "82"
  let len = num2hex(parseInt(cos.length / 2), 2, false)
  data += dataType
  data += len
  data += cos
  return makeFrame(data)
}

/**
 * 获取IC卡密文通讯时的记录通道
 * conmand : "co" + 记录索引
 */
var make83SendData = function (command) {
  let data = "83"
  let len = num2hex(parseInt(command.length / 2), 2, false)
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
var make84SendData = function (command) {
  let data = "84"
  let len = num2hex(parseInt(command.length / 2), 2, false)
  data += len
  data += command
  return makeFrame(data)
}

/**
 * 数据透彻操作通道
 * dataType : bit0=数据类型（0-明文数据，1-密文数据）；bit1~bit3=(设置为0)；bit4~bit7=目标索引（1-用户卡，2-ESAM安全模块，3-SE，其他保留）
 * command : 透彻指令数据
 */
var make85SendData = function (dataType, command) {
  let data = "85"
  let len = num2hex(parseInt(command.length / 2), 2, false)
  data += dataType
  data += len
  data += command
  return makeFrame(data)
}

/**
 * 厂商自定义功能
 * "c1" + code : 设备显示字符，code("01"=激活中，"02"=激活成功，"03"=激活失败，"04"=发行中，"05"=发行成功，"06"=发行失败)
 */
var make8FSendData = function (command) {
  let data = "8F"
  let len = num2hex(parseInt(command.length / 2), 2, false)
  data += len
  data += command
  return makeFrame(data)
}


var ArtcDataUtil = {
  num2hex: num2hex,
  hex2buf: hex2buf,
  buf2hex: buf2hex,
  makeTLV: makeTLV,
  reTLV: reTLV,
  make80SendData: make80SendData,
  make81SendData: make81SendData,
  make82SendData: make82SendData,
  make83SendData: make83SendData,
  make84SendData: make84SendData,
  make85SendData: make85SendData,
  make8FSendData: make8FSendData,
}

module.exports = ArtcDataUtil