module.exports = {
  numberToHexString: numberToHexString,
  hexStringToBufferArray: hexStringToBufferArray,
  bufferArrayToHexString: bufferArrayToHexString,
  makeTLV: makeTLV,
  makeTLVWithCondition: makeTLVWithCondition,
  resolveTLV: resolveTLV,
  getBleMac: getBleMac
}

/**
 * number转换成指定字节数的hexString
 * num：转换的number值
 * bitNum：转换后的字节数
 * isBig：true-大端，fasle-小端
 */
function numberToHexString(num, bitNum, isBig) {
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
function hexStringToBufferArray(hexString) {
  let bufferArray = new Uint8Array(hexString.match(/[\da-f]{2}/gi).map(function (h) {
    return parseInt(h, 16)
  }))
  return bufferArray.buffer
}

/**
 * 将bufferArray转成hexString
 */
function bufferArrayToHexString(bufferArray) {
  let hex = Array.prototype.map.call(new Uint8Array(bufferArray), x => ('00' + x.toString(16)).slice(-2)).join('')
  return hex
}

/**
 * TLV指令构造
 * tpdus:指令集合
 */
function makeTLV(tpdus) {
  let tlv = ""
  for (let i = 0; i < tpdus.length; i++) {
    let temp = "" + tpdus[i]
    tlv = tlv + numberToHexString(i + 1, 1, true) + numberToHexString(parseInt(temp.length / 2), 1, true) + temp;
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
 * TLV指令构造
 * tpdus:指令集合
 * needResponse:对于tpdu指令是否需要返回数据，true有返回，fasle没有返回，如：["00a40000023f00","00a40000021001"],[true,false],这前一条有返回3f00的信息和状态码，后一条则只返回状态码，没有信息
 */
function makeTLVWithCondition(tpdus, needResponses) {
  let tlv = ""
  for (let i = 0; i < tpdus.length; i++) {
    let temp = "" + tpdus[i]
    let status = i + 1
    if(needResponses[i] === false) {
      status = 0x80 + status
    }
    tlv = tlv + numberToHexString(status, 1, true) + numberToHexString(parseInt(temp.length / 2), 1, true) + temp;
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
function resolveTLV(tlv) {
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
    let tpdu = tlv.substring(index, index + len * 2);
    tpdus.push(tpdu);
    index += len * 2;
  }
  return tpdus;
}


/**
 * 读取搜索到的device设备的mac
 * device: 搜索蓝牙外设返回的device对象
 */
function getBleMac(device) {
  let advertisDataHex = Array.prototype.map.call(new Uint8Array(device.advertisData), x => ('00' + x.toString(16)).slice(-2)).join('')
  let bleMac = advertisDataHex.slice(4)
  return bleMac
}

