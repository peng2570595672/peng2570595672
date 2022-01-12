
var WCDBluetooth = require('WDObuDataUtil.js');
var result = [];
var deviceInfo = {
  adviceId: '',// nw    90D0964C-064F-4781-CD75-1A3CFEBE18DF
  services: [],
  discoveryTimeout: 60000,
  connectTimeout: 20000,
  sendTimeout: 10000,
  delayTime: 1000,
  accTimeout: 200,
  success: function success (res) { },
  fail: function fail (res) { },
  complete: function complete (res) { },
  srv_uuid: '0000FEE7-0000-1000-8000-00805F9B34FB',
  chr_write_uuid: '0000fec7-0000-1000-8000-00805f9b34fb',
  chr_indicate_uuid: '0000fec8-0000-1000-8000-00805f9b34fb',
  chr_read_uuid: '0000fec9-0000-1000-8000-00805f9b34fb',
  localLog: false,
  callback_0: function callback_0 (res) {}
};

var preventMultipleClicks = false;

/**
 * 链接
 */
function connectDevice (device, callback, callback_0) {
  deviceInfo.adviceId = device.deviceId;
  WCDBluetooth.createBLEConnection(Object.assign(deviceInfo,
    {
      success: function (res) {
        WCDBluetooth.setConnectingState(false);
        callback({
          code: 0,
          data: [],
          msg: '链接成功'

        });
      },
      fail: function (error) {
        WCDBluetooth.setConnectingState(false);
        callback({
          code: 1,
          data: [],
          msg: '连接失败'

        });
      }
    }
  ), callback_0);
}

/**
 * 断开连接
 */
function disconnectDevice (params) {
  WCDBluetooth.disconnectBleDevice(params);
}

/**
 * 检查设备是否处于连接状态
 */
function checkConnect () {
  return WCDBluetooth.isConnectionStateChange();
}

/**
 * 发送明文指令 操作通道
 * cn 通道号 0: PICC通道 1:ESAM通道
 * requestData 需要发送的数据
 */
function transCmd (cmdArray, cmdType, callback_1) {
  console.log('开始发送指令');
  if (!isEven(cmdArray, callback_1)) {
    return null;
  }

  if (checkConnect() != 0) {
    callback_1({
      code: 1,
      data: [],
      msg: "由于设备未连接导致发送指令失败'"
    });
    return null;
  }
  if (cmdArray.length == 0) {
    console.log('发送的指令', cmdArray);
    callback_1({
      code: 1,
      data: [],
      msg: '发送指令为空'
    });
    return null;
  }
  result = [];
  let cmdList = new Array();
  let list = new Array();
  for (let i = 0; i < cmdArray.length; i++) {
    let cmd = '';
    if (cmdType == '10') {
      cmd = 'a300'; // picc签名通道指令
    } else {
      cmd = 'a700'; // esam签名通道指令
    }
    let tlv = organizationTLV(cmdArray[i]);
    let tlvLen = numberToHexString(tlv.length / 2, 2, false);
    cmd = cmd + tlvLen + tlv;
    console.log('需要发送的明文数据为:' + cmd);
    cmdList.push(cmd);
  }

  WCDBluetooth.transCmd(cmdList[0], function success (res) {
    if (res == undefined) return;
    let rData = WCDBluetooth.bytes2HexStr(res.slice(5));
    let rapdu = analysisTLV(rData);
    result.push(rapdu);
    if (cmdArray.length > 1) {
      send(cmdList, 0, callback_1, rapdu);
    } else {
      callback_1({
        code: 0,
        data: result,
        msg: '发送指令成功'
      });
    }
  }, function fail (res) {
    callback_1({
      code: 1,
      data: [],
      msg: res.msg
    });
  });
}

function send (cmdList, flag, callback, data) {
  flag++;
  WCDBluetooth.transCmd(cmdList[flag], function success (res) {
    if (res != undefined) {
      let rData = WCDBluetooth.bytes2HexStr(res.slice(5));
      let rapdu = analysisTLV(rData);
      result.push(rapdu);
      if (flag < cmdList.length - 1) {
        send(cmdList, flag, callback, rapdu);
      } else {
        callback({
          code: 0,
          data: result,
          msg: '发送指令成功'
        });
      }
    }
  }, function fail (res) {
    callback({
      code: 1,
      data: [],
      msg: res.msg
    });
  });
}

function checkParams (params) {
  var dict = {
    errMsg: '',
    errCode: 0
  };

  if (!checkConnect) {
    dict = {
      errMsg: '设备未连接,请检查设备是否正常',
      errCode: -1
    };
    return dict;
  }

  // 判断命令代码是否为空
  if (params.cn.length == 0 ||
    params.cn == null) {
    console.log('命令通道为空,发送失败');
    dict = {
      errMsg: '命令通道为空,发送失败',
      errCode: -1
    };
    return dict;
  }
  // 检查 发送的数据指令是否为空
  if (params.requestData[0].length == 0 ||
    params.requestData[0] == null) {
    console.log('数据指令为空,发送失败');
    dict = {
      errMsg: '数据指令为空,发送失败',
      errCode: -1
    };
    return dict;
  }

  // 校验数据格式是否正确
  for (let i = 0; i < params.requestData[0].length; i++) {
    let c = params.requestData[0].charAt(i);
    if (!((c >= '0' && c <= '9') ||
      (c >= 'a' && c <= 'f') ||
      (c >= 'A' && c <= 'F'))) {
      console.log('c发送数据出错,发送失败');
      dict = {
        errMsg: '发送数据出错,发送失败',
        errCode: -1
      };
      return dict;
    }
  }
  return dict;
}

/**
 * 将外部传入的指令转换成tlv格式的指令. 返回apdu字符串
 */
function organizationTLV (command) {
  console.log('需要组包的指令 == ' + command);
  // 获取指令数据
  var apduArrs = new Array(0);
  apduArrs.push(command);
  // for (let i = 0; i < command.length;i++){
  //   console.log("循环 == " + command[i]);
  //
  // }

  // tlv字符串
  let tlv = '';
  console.log('apduArrs.length = ' + apduArrs.length);
  for (let i = 0; i < apduArrs.length; i++) {
    // 获取单条apdu指令
    let v = apduArrs[i];
    console.log('v === ' + v);
    // 设置t
    let t = numberToHexString(i + 1, 1, false);
    console.log('t === ' + t);
    // 获取单条apdu指令长度
    let l = numberToHexString(v.length / 2, 1, false);
    console.log('l === ' + l);
    // 拼接t l v 组成所需tlv格式的16进制字符串
    tlv = tlv + t + l + v;
  }
  console.log('tlv === ' + tlv);
  // 获取tlv格式apdu总长度
  let tlvLen = tlv.length / 2;
  let index = 1;
  // 获取16进制总长度
  let hexTlvLen = numberToHexString(tlvLen, index, false);
  console.log('hexTlvLen === ' + hexTlvLen);
  while (tlvLen != parseInt(hexTlvLen, 16)) {
    index++;
    hexTlvLen = numberToHexString(tlvLen, index, false);
  }
  if (tlvLen > 0x80) {
    let head = 0x80 + hexTlvLen.length / 2;
    console.log('head  === ' + head + 'hexTlvLen.length/2 === ' + hexTlvLen.length / 2);
    let hexHead = numberToHexString(head, 1, false);
    hexTlvLen = hexHead + hexTlvLen;
  }
  console.log('cmd === ' + '80' + hexTlvLen + tlv);

  return '80' + hexTlvLen + tlv;
}

// number转换成指定字节数的hexString
// num：要转换的数(number)    bitNum：转换后的字节数(number)   isBig:是不是大端模式(boolean)
function numberToHexString (num, bitNum, isBig) {
  // 转大端hex并补足
  let hex = num.toString(16);
  for (let i = hex.length; i < bitNum * 2; i++) {
    hex = '0' + hex;
  }
  // 多位截取
  if (hex.length > bitNum * 2) {
    hex = hex.substring(hex.length - bitNum * 2);
  }
  // 转小端
  if (isBig == false) {
    let temp = '';
    for (let i = hex.length - 2; i >= 0; i -= 2) {
      temp = temp + hex.substring(i, i + 2);
    }
    hex = temp;
  }
  return hex;
}

function analysisTLV (command) {
  // console.log("开始解析tlv",command)
  let apdus = new Array();
  let totalLength = parseInt(command.substring(2, 4), 16);

  let offset = 4;
  if (totalLength > 0x80) {
    offset = offset + (totalLength - 0x80) * 2;
    console.log('大于了');
  }

  while (offset < command.length) {
    // 获取t
    let t = command.substring(offset, offset + 2);

    offset += 2;
    // 获取单条指令的长度
    let l = command.substring(offset, offset + 2);
    let len = parseInt(l, 16);

    offset += 2;
    // 获取v
    let v = command.substring(offset, offset + len * 2);
    offset += len * 2;
    apdus.push(v);
  }

  // let r_cmd = numberToHexString(apdus.length, 1, false);
  let r_cmd = '';
  for (let i = 0; i < apdus.length; i++) {
    let cmd = apdus[i];
    let cmdLen = numberToHexString(cmd.length / 2, 1, false);
    // r_cmd = r_cmd + cmdLen + cmd;
    r_cmd = cmd;
  }
  return r_cmd;
}

function scan () {
  console.log('扫描蓝牙中');
  foundDevices = [];
  wx.closeBluetoothAdapter();
  wx.openBluetoothAdapter({
    success: function (res) {
      wx.startBluetoothDevicesDiscovery({
        services: [],
        success: function (res) {
          // 扫描结果的监听
          wx.onBluetoothDeviceFound(function (res) {
            var name = res.devices[0]['name'];
            var deviceId = res.devices[0]['deviceId'];
            if (name != '' && name != undefined && name != 'undefined') {
              var prefixName = name.substring(0, 2);
              prefixName = prefixName.toUpperCase();
              if (prefixName == 'WJ' || prefixName == 'JL' || prefixName == 'JY' || prefixName == 'ZJ' || prefixName == 'WQ' || prefixName == 'HN' || prefixName == 'WD') {
                clearTimeout(scanTimeout);
                wx.stopBluetoothDevicesDiscovery({
                  success: function (res) {
                    device = {};
                    device.name = name;
                    device.deviceId = deviceId;
                    device.prefixName = prefixName;
                    connectPrefixName = device.prefixName;
                    console.log(device);
                    delete device.prefixName;
                    // 去连接
                  }
                });
              }
            }
          });
        },
        fail: function (res) {
          console.log(res);
        }
      });
      scanTimeout = setTimeout(function () {
        wx.closeBluetoothAdapter();
        console.log('扫描蓝牙超时，未找到设备，请打开设备蓝牙');
        console.log('scan timeout');
      }, 50000);
    },
    fail: function (res) {
      console.log(res);
      // alertF('手机蓝牙未打开或不支持蓝牙');
    }
  });
}

function isEven (cmdArray, callback) {
  let result = false;
  let flag = true;
  let lengthCmd = 0;
  while (flag) {
    if (cmdArray.length == lengthCmd) {
      flag = false;
      break;
    }
    console.log(cmdArray[lengthCmd], cmdArray[lengthCmd] == undefined, cmdArray.length);
    if (cmdArray[lengthCmd] == null || cmdArray[lengthCmd] == undefined || cmdArray.length <= 0) {
      callback({
        code: 1,
        data: [],
        msg: '指令为空'
      });
      return;
    }
    lengthCmd++;
  }

  for (let i = 0; i < cmdArray.length; i++) {
    if (cmdArray[i].length % 2 == 0) {
      result = true;
    } else {
      // 奇数
      callback({
        code: 1,
        data: [],
        msg: '由于指令' + cmdArray[i] + '错误导致失败发送ICC指令失败'
      });
      return false;
    }
  }
  return result;
}
module.exports = {
  connectDevice: connectDevice,
  disconnectDevice: disconnectDevice,
  checkConnect: checkConnect,
  transCmd: transCmd,
  organizationTLV: organizationTLV,
  analysisTLV: analysisTLV,
  scan,
scan
};
