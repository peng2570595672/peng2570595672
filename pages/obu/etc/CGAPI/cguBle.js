
const TAG_FUNCTION = 'function';
const CGU_SERVICE_UUID = '0000FEE7-0000-1000-8000-00805F9B34FB';// 目标服务
const CGU_WRTIE_UUID = '0000FFE1-0000-1000-8000-00805F9B34FB';// 目标写特征
const CGU_READ_UUID = '0000FFE4-0000-1000-8000-00805F9B34FB';// 目标读特征

const SUCCESS_CODE = 0;
const FAILL_CODE = -1;

module.exports = {
  ScanDevice: ScanDevice,
  StopScanDevice: StopScanDevice,
  connectDevice: connectDevice,
  disconnectDevice: disconnectDevice,
  transCmd: transCmd,
  noSleepCmd: noSleepCmd

};
let foundDevices = [];

var cguDeviceId = '';
var cguServiceId = '';
var cguWriteId = '';
var cguReadId = '';
var correctPacketIndex = 1;// 理应包数
var receivePacketSize = 0;// 接收总包数
var sendCallback;
var timeOutId;
var recevResendCount = 3;
var recevSuccessFlag = false;
var flashFlag = false;
var valueArray = new Array();// 完整数据保存
var cguSendData = new Array();// 送法的数据
var cguSendIndex = 0;
var cguResendCount = 3;
var IntervalTimer = 0;// 搜搜蓝牙定时器
var SetoutTimer = 0;
// 打开蓝牙适配器
function openBleAdapter (callback) {
  let DevResult = {};
  if (!wx.openBluetoothAdapter) {
    DevResult.code = 10001;
    DevResult.msg = '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试';
    DevResult.data = null;
    typeof callback === TAG_FUNCTION && callback(DevResult);
  } else {
    wx.openBluetoothAdapter({
      success: function (res) {
        DevResult.code = 0;
        DevResult.msg = '初始化蓝牙成功';
        DevResult.data = res;
        typeof callback === TAG_FUNCTION && callback(DevResult);
      },
      fail: function (res) {
        DevResult.code = 10001;
        DevResult.msg = '初始化蓝牙失败';
        DevResult.data = res;
        typeof callback === TAG_FUNCTION && callback(DevResult);
      }
    });
  }
}

// 搜索蓝牙 flag 是过滤标识
function ScanDevice (flag, callback) {
  openBleAdapter(function (res) {
    if (res.code == 0) {
      let DevResult = {};
      foundDevices = [];
      wx.startBluetoothDevicesDiscovery({
        services: [],
        success: function (res) {
          fn();
          SetoutTimer = setTimeout(function () {
            StopScanDevice(function (res) {
              DevResult.code = 10002;
              DevResult.msg = '搜索超时，未发现设备';
              DevResult.data = null;
              typeof callback === TAG_FUNCTION && callback(DevResult);
            });
          }, 30000);

          function fn () {
            wx.onBluetoothDeviceFound(function (res) {
              for (let i = 0; i < res.devices.length; i++) {
                let isHave = false;
                for (let j = 0; j < foundDevices.length; j++) {
                  if (res.devices[i].deviceId == foundDevices[j].deviceId) {
                    isHave = true;
                    break;
                  }
                }

                var blueName = res.devices[i]['name'];
                if (typeof (blueName) === undefined || blueName == '') {
                } else {
                  console.log('蓝牙名称：', res.devices[i]['name']);
                  if (isHave == false) {
                    foundDevices.push(res.devices[i]);
                    var deviceName = res.devices[i]['name'];
                    // 过滤器 name
                    if (deviceName.indexOf(flag) != -1) {
                      var deviceId = res.devices[i]['deviceId'];
                      // 停止搜搜
                      StopScanDevice(function (res) {
                        if (res.code == 0) {
                          clearTimeout(SetoutTimer);
                          SetoutTimer = 0;
                          let device = new Object();
                          device.deviceId = deviceId;
                          device.name = deviceName;
                          DevResult.code = 0;
                          DevResult.msg = '搜索成功';
                          DevResult.data = device;
                          typeof callback === TAG_FUNCTION && callback(DevResult);
                        } else {
                          DevResult.code = 10002;
                          DevResult.msg = '搜索失败';
                          DevResult.data = res;
                          typeof callback === TAG_FUNCTION && callback(DevResult);
                        }
                      });
                      break;
                    } else {

                    }
                  }
                }
              }
            });
          }
        },
        fail: function (res) {
          DevResult.code = 10001;
          DevResult.msg = '搜索失败';
          DevResult.data = res;
          typeof callback === TAG_FUNCTION && callback(DevResult);
        }
      });
    } else {
      typeof callback === TAG_FUNCTION && callback(res);
    }
  });
}

// 停止搜索
function StopScanDevice (callback) {
  if (SetoutTimer != 0) {
    clearTimeout(SetoutTimer);
    SetoutTimer = 0;
  }
  let DevResult = {};
  wx.stopBluetoothDevicesDiscovery({
    success: function (res) {
      DevResult.code = 0;
      DevResult.data = res;
      DevResult.msg = '操作成功';
      typeof callback === TAG_FUNCTION && callback(DevResult);
    },
    fail: function (res) {
      DevResult.code = 10030;
      DevResult.data = res;
      DevResult.msg = '蓝牙已关闭';
      typeof callback === TAG_FUNCTION && callback(DevResult);
    }
  });
}
// 连接蓝牙
function connectDevice (device, callback, callback_2) {
  console.log('连接蓝牙==================');
  console.log(device);
  var DevResult = {};
  if (device != null) {
    cguWriteId = '';
    cguReadId = '';
    cguDeviceId = '';
    let deviceId = device.deviceId;
    cguDeviceId = deviceId;
    wx.createBLEConnection({
      deviceId: deviceId,
      success: function (data) {
        console.log('连接成功设备，开始使能服务');

        wx.onBLEConnectionStateChange(function (res) {
          if (res.connected == false) {
            DevResult.code = 1;
            DevResult.data = null;
            DevResult.msg = '监听到断开连接';
            console.log('蓝牙异常断开');
            typeof callback_2 === TAG_FUNCTION && callback_2(DevResult);
          } else {
            DevResult.code = 0;
            DevResult.data = null;
            DevResult.msg = '监听连接成功';
            typeof callback_2 === TAG_FUNCTION && callback_2(DevResult);
          }
        });
        wx.getBLEDeviceServices({
          deviceId: deviceId,
          success: function (res) {
            for (let i = 0; i < res.services.length; i++) {
              let serviceuuid = res.services[i].uuid.toUpperCase();
              if (CGU_SERVICE_UUID.indexOf(serviceuuid) != -1) {
                cguServiceId = serviceuuid;
                // 获取特征
                wx.getBLEDeviceCharacteristics({
                  deviceId: cguDeviceId,
                  serviceId: cguServiceId,
                  success: function (res) {
                    for (let i = 0; i < res.characteristics.length; i++) {
                      let chauuid = res.characteristics[i].uuid.toUpperCase();
                      if (CGU_READ_UUID.indexOf(chauuid) != -1) {
                        cguReadId = chauuid;
                      } else if (CGU_WRTIE_UUID.indexOf(chauuid) != -1) {
                        cguWriteId = chauuid;
                      }
                    }
                    if (cguWriteId.length == 0 || cguReadId.length == 0) {
                      DevResult.code = -3;
                      DevResult.data = res;
                      DevResult.msg = '获取特征值失败';
                      typeof callback === TAG_FUNCTION && callback(DevResult);
                    } else {
                      openReceiveData(function (res) {
                        typeof callback === TAG_FUNCTION && callback(res);
                      });
                    }
                  },
                  fail: function (res) {
                    DevResult.code = -2;
                    DevResult.data = res;
                    DevResult.msg = '获取特征值失败';
                    typeof callback === TAG_FUNCTION && callback(DevResult);
                  }
                });
              }
            }
          },
fail: function (res) {
            DevResult.code = -1;
            DevResult.data = res;
            DevResult.msg = '获取特征值失败';
            typeof callback === TAG_FUNCTION && callback(DevResult);
          }
        });
      },
      fail: function (err) {
        disconnectDevice(function (res) {
          DevResult.code = 10001;
          DevResult.data = res;
          DevResult.msg = '获取特征值失败';
          typeof callback === TAG_FUNCTION && callback(DevResult);
        });
      }
    });
  } else {
    DevResult.code = 10002;
    DevResult.data = device;
    DevResult.msg = '蓝牙名称为空';
    typeof callback === TAG_FUNCTION && callback(DevResult);
  }
}

// 数据接收
function openReceiveData (callback) {
  var DevResult = {};
  wx.notifyBLECharacteristicValueChange({
    deviceId: cguDeviceId,
    serviceId: cguServiceId,
    characteristicId: cguReadId,
    state: true,
    success: function (res) {
      DevResult.code = 0;
      DevResult.data = null;
      DevResult.msg = '连接蓝牙成功';
      sendData(noSleepCmd(), function (res) {

      });
      setTimeout(function () {
        typeof callback === TAG_FUNCTION && callback(DevResult);
      },500);
    },
fail: function (res) {
      DevResult.code = -1;
      DevResult.data = res;
      DevResult.msg = '打开notify失败';
      typeof callback === TAG_FUNCTION && callback(DevResult);
    }
  });
  wx.onBLECharacteristicValueChange(function (characteristic) {
    var DevResult = {};

    if (CGU_READ_UUID.indexOf(characteristic.characteristicId.toUpperCase()) != -1) {
      let hex = Array.prototype.map.call(new Uint8Array(characteristic.value), x => ('00' + x.toString(16)).slice(-2)).join('');
      console.log('原始数据：' + hex);
      if (hex.length > 6) {
        let receivePacketIndex = parseInt(hex.substring(4, 6), 16);
        if (parseInt(hex.substring(2, 4), 16) == 0x80) {
          receivePacketSize = parseInt(hex.substring(4, 6), 16);
        }
        if (receivePacketSize == 1) {
          if ((parseInt(hex.substring(6, 8), 16) != 0xc7) && (parseInt(hex.substring(6, 8), 16) != 0xc0)) {
            console.log('进入只有一包数据的回调');
            recevSuccessFlag = true;
            recevResendCount = 3;
            clearInterval(timeOutId);
            hex = hex.substring(6, hex.length - 2);
            typeof sendCallback === TAG_FUNCTION && sendCallback(SUCCESS_CODE,hex);
          }
        } else {
          valueArray.push(hex.substring(6, hex.length - 2));

          if (correctPacketIndex == 1 && parseInt(hex.substring(2, 4), 16) != 0x80) {
            recevSuccessFlag = false;
            console.log('第一帧数据丢包');
            correctPacketIndex++;
          } else if (correctPacketIndex != receivePacketIndex && correctPacketIndex != 1) {
            recevSuccessFlag = false;
            console.log('数据丢包');
            correctPacketIndex++;
          } else if (correctPacketIndex == receivePacketSize) {
            correctPacketIndex = 1;
            var data = '';
            for (var i = 0; i < receivePacketSize; i++) {
              data = data + valueArray[i];
            }
            console.log('组包后:' + data);
            if ((parseInt(data.substring(0, 2), 16) != 0xc7)) {
              recevSuccessFlag = true;
              recevResendCount = 3;
              clearInterval(timeOutId);
              typeof sendCallback === TAG_FUNCTION && sendCallback(SUCCESS_CODE,data);
            }
          } else {
            correctPacketIndex++;
          }
        }
      }
    }
  });
}
// 断开连接
function disconnectDevice (callback) {
  let deviceId = cguDeviceId;
  wx.closeBLEConnection({
    deviceId: deviceId,
    success: function (res) {
      if (res.errCode == 0) {
        wx.closeBluetoothAdapter({
          success: function (data) {
            let DevResult = {};
            DevResult.code = 0;
            DevResult.msg = '断开成功';
            DevResult.data = data;
            typeof callback === TAG_FUNCTION && callback(DevResult);
          }
        });
      } else {
        let DevResult = {};
        DevResult.code = 10001;
        DevResult.msg = '断开失败';
        DevResult.data = res;
        typeof callback === TAG_FUNCTION && callback(DevResult);
      }
    },
fail: function (err) {
      let DevResult = {};
      DevResult.code = 10002;
      DevResult.msg = '断开失败';
      DevResult.data = err;
      typeof callback === TAG_FUNCTION && callback(DevResult);
    }
  });
}
// 发送数据
// bufferArray:封好数据包并拆分20字节一帧的数组
function sendData (bufferArray, callback) {
  var that = this;
  cguSendData = bufferArray;
  cguSendIndex = 0;
  sendCallback = callback;
  valueArray = [];// 重置记录数据
  if (flashFlag) {
    flashFlag = false;
    recevSuccessFlag = true;
  } else {
    recevSuccessFlag = false;
  }
  correctPacketIndex = 1;
  startSendData();
}
function startSendData () {
  let DevResult = {};
  var that = this;
  let buffer = cguSendData[cguSendIndex];
  console.log('开始发送第' + cguSendIndex + '包数据: ' + Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('') + '，总包数: ' + cguSendData.length);
  wx.writeBLECharacteristicValue({
    deviceId: cguDeviceId,
    serviceId: cguServiceId,
    characteristicId: cguWriteId,
    value: buffer,
    success: function (res) {
      console.log('发送第' + cguSendIndex + '包数据成功');
      cguResendCount = 3;
      cguSendIndex++;
      if (cguSendIndex < cguSendData.length) {
        startSendData();// 继续发下一个
      } else {
        // 设置超时
        clearInterval(timeOutId);
        timeOutId = null;
        timeOutId = setInterval(resendData, 10000);
      }
    },
    fail: function () {
      clearInterval(timeOutId);
      timeOutId = null;
      console.log('发送第' + cguSendIndex + '包数据失败');
      typeof sendCallback === TAG_FUNCTION && sendCallback(FAILL_CODE,'数据发送失败');
    }
  });
}
function resendData () {
  recevResendCount = 3;
  clearInterval(timeOutId);
  timeOutId = null;
  console.log('数据接收失败，数据接收超时');
  typeof sendCallback === TAG_FUNCTION && sendCallback(FAILL_CODE, '数据接收失败');
}

/**
 * cos通道接口
 * cosArr：指令数组；channelType：访问通道10访问IC卡，20访问ESAM；其他默认透传纯指令数据
 * callback(回调)，返回响应指令+状态码数组，
 */

function transCmd (cosArr, channelType, callback) {
  var CmdArrayData = new Array();
  if (cosArr.length > 3) {
    let DevResult = {};
    var test = Group(cosArr, 3);
    if (channelType == '20') {
      let cmd = getEsamCmdByArray(test[0]);
      sendData(cmd, function (code, res) {
        if (code == 0 && parseInt(res.substring(0, 2), 16) == 0xB4) {
          var resultA = getArrayByReturnCmd(res);
          cmd = getEsamCmdByArray(test[1]);
          sendData(cmd, function (code2, res2) {
            if (code2 == 0 && parseInt(res2.substring(0, 2), 16) == 0xB4) {
              var resultB = getArrayByReturnCmd(res2);
              var dataRarray = resultA.concat(resultB);
              DevResult.code = 0;
              DevResult.msg = '透传ESAM指令成功';
              DevResult.data = dataRarray;
              typeof callback === TAG_FUNCTION && callback(DevResult);
            } else {
              DevResult.code = 1;
              DevResult.msg = '透传ESAM指令失败' + res2;
              DevResult.data = res2;
              typeof callback === TAG_FUNCTION && callback(DevResult);
            }
          });
        } else {
          DevResult.code = 1;
          DevResult.msg = '透传ESAM指令失败' + res;
          DevResult.data = res;
          typeof callback === TAG_FUNCTION && callback(DevResult);
        }
      });
    } else if (channelType == '10') {
      let cmd = getICCardCmdByArray(test[0]);
      sendData(cmd, function (code, res) {
        if (code == 0 && parseInt(res.substring(0, 2), 16) == 0xB3) {
          var resultA = getArrayByReturnCmd(res);
          cmd = getICCardCmdByArray(test[1]);
          sendData(cmd, function (code2, res2) {
            if (code2 == 0 && parseInt(res2.substring(0, 2), 16) == 0xB3) {
              var resultB = getArrayByReturnCmd(res2);
              var dataRarray = resultA.concat(resultB);
              DevResult.code = 0;
              DevResult.msg = '透传IC卡指令成功';
              DevResult.data = dataRarray;
              typeof callback === TAG_FUNCTION && callback(DevResult);
            } else {
              DevResult.code = 1;
              DevResult.msg = '透传IC卡指令失败' + res2;
              DevResult.data = res2;
              typeof callback === TAG_FUNCTION && callback(DevResult);
            }
          });
        } else {
          DevResult.code = 1;
          DevResult.msg = '透传IC卡指令失败' + res;
          DevResult.data = res;
          typeof callback === TAG_FUNCTION && callback(DevResult);
        }
      });
    }
  } else {
    let DevResult = {};
    if (channelType == '10') {
      sendData(getICCardCmdByArray(cosArr), function (code, res) {
        if (code == 0) {
          if (parseInt(res.substring(0, 2), 16) == 0xB3) {
            DevResult.code = 0;
            DevResult.data = getArrayByReturnCmd(res);
            DevResult.msg = '透传IC卡指令成功';
            typeof callback === TAG_FUNCTION && callback(DevResult);
          } else {
            DevResult.code = -1;
            DevResult.data = res;
            DevResult.msg = '透传IC卡指令失败：' + res;
            typeof callback === TAG_FUNCTION && callback(DevResult);
          }
        } else {
          DevResult.code = -2;
          DevResult.data = res;
          DevResult.msg = '指令透传失败：' + res;
          typeof callback === TAG_FUNCTION && callback(DevResult);
        }
      });
    } else if (channelType == '20') {
      sendData(getEsamCmdByArray(cosArr), function (code, res) {
        if (code == 0) {
          if (parseInt(res.substring(0, 2), 16) == 0xB4) {
            DevResult.code = 0;
            DevResult.data = getArrayByReturnCmd(res);
            DevResult.msg = '透传ESAM指令成功';
            typeof callback === TAG_FUNCTION && callback(DevResult);
          } else {
            DevResult.code = -2;
            DevResult.data = res;
            DevResult.msg = '透传ESAM指令失败：' + res;
            typeof callback === TAG_FUNCTION && callback(DevResult);
          }
        }
      });
    } else {
      if (typeof (cosArr) === 'object') {

      } else if (typeof (cosArr) === 'string') {
        sendData(packetData(cosArr), function (code, res) {
          if (code == 0) {
            DevResult.code = 0;
            DevResult.data = res;
            DevResult.msg = '透传其他指令成功';
            typeof callback === TAG_FUNCTION && callback(DevResult);
          } else {
            DevResult.code = 1;
            DevResult.data = res;
            DevResult.msg = '透传其他指令失败';
            typeof callback === TAG_FUNCTION && callback(DevResult);
          }
        });
      }
    }
  }
}

// 将数组拆分为小数组
function Group (array, subGroupLength) {
  let index = 0;
  let newArray = [];
  while (index < array.length) {
    newArray.push(array.slice(index, index += subGroupLength));
  }
  return newArray;
}

function getICCardCmdByArray (cosArr) {
  let arrLen = cosArr.length;
  let cmd = 'A3' + intToHexString(arrLen, 1, false);
  for (let i = 0; i < cosArr.length; i++) {
    cmd = cmd + intToHexString(cosArr[i].length / 2, 1, false) + cosArr[i];
  }
  return packetData(cmd);
}
function getEsamCmdByArray (cosArr) {
  let arrLen = cosArr.length;
  let cmd = 'A4' + intToHexString(arrLen, 1, false);
  for (let i = 0; i < cosArr.length; i++) {
    cmd = cmd + intToHexString(cosArr[i].length / 2, 1, false) + cosArr[i];
  }
  return packetData(cmd);
}
function getArrayByReturnCmd (cmd) {
  let cmdCount = parseInt(cmd.substring(2, 6), 16);
  let returnCosArr = new Array();
  let startIndex = 6;
  let cmdLength = 0;
  for (let i = 0; i < cmdCount; i++) {
    cmdLength = parseInt(cmd.substring(startIndex, startIndex + 2), 16);
    let cmdStr = cmd.substring(startIndex + 2, startIndex + 2 + 2 * cmdLength);
    startIndex += 2 + cmdLength * 2;
    returnCosArr[i] = cmdStr;
  }
  return returnCosArr;
}

/**
     * 不休眠60s
     *
     */
function noSleepCmd () {
  let cmd = 'D13C';// 60s
  return packetData(cmd);
}
/**
     * 不休眠30s
     *
     */
function getNoSleepCmd () {
  let cmd = 'D11E';
  return packetData(cmd);
}
function packetData (content) {
  console.log('开始拆包:' + content);
  let bufferArr = new Array();
  let sendPacketSize;
  let ST, CTL, DATA, BCC;
  let contentLength = content.length;
  if (content.length % 15 == 0) {
    sendPacketSize = parseInt(content.length / (15 * 2));
  } else {
    sendPacketSize = parseInt(content.length / (15 * 2)) + 1;
  }
  for (let i = 0; i < sendPacketSize; i++) {
    if (i == 0) {
      CTL = '80' + intToHexString(sendPacketSize, 1, false);
    } else {
      CTL = '00' + intToHexString(i + 1, 1, false);
    }
    if (contentLength >= 15 * 2) {
      DATA = content.substring(i * 15 * 2, (i + 1) * 15 * 2);
      contentLength = contentLength - 15 * 2;
    } else {
      DATA = content.substring(content.length - contentLength, content.length);
    }
    ST = '5' + parseInt(DATA.length / 2, 10).toString(16);
    BCC = getBcc(ST + CTL + DATA);
    console.log('组帧：' + 'ST:' + ST + '  CTL:' + CTL + '  DATA:' + DATA + '  BCC:' + BCC);
    bufferArr.push(str2array(ST + CTL + DATA + BCC).buffer);
  }
  return bufferArr;
}

// num：要转换的数(number)    bitNum：转换后的字节数(number)   isBig:是不是大端模式(boolean)
function intToHexString (num, bitNum, isBig) {
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

// array 转str
function array2Str (array) {
  let data = '';
  for (let i = 0; i < array.length; i++) {
    data = data + array[i];
  }
  return data;
}

// str 转 array
function str2array (str) {
  let array = new Uint8Array(str.match(/[\da-f]{2}/gi).map(function (h) {
    return parseInt(h, 16);
  }));
  return array;
}

// 计算BCC
function getBcc (data) {
  var bcc = 0x00;
  var bcc1;
  for (var i = 0; i < data.length / 2; i++) {
    bcc1 = parseInt(data.substring(i * 2, i * 2 + 2), 16);
    bcc = bcc1 ^ bcc;
  }
  let str = bcc.toString(16);
  if (str.length == 1) {
    str = '0' + str;
  }
  return str;
}
function arraycopy (/* array */ from, /* index */ from_start,
/* array */ to, /*  index */ to_start,
/*  integer */ length) {
  // 逻辑代码；
  for (var i = 0; i < length; i++) {
    to[to_start + i] = from[from_start + i];
  }
}
