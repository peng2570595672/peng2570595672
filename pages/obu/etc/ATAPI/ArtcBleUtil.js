const ArtcDataUtil = require('./ArtcDataUtil.js');
const FUNCTION = 'function';
const SERVICE_UUID = '0000FF17-0000-1000-8000-00805F9B34FB';
const WRITE_UUID = '0000FF02-0000-1000-8000-00805F9B34FB';
const READ_UUID = '0000FF03-0000-1000-8000-00805F9B34FB';

var DevResult = function (code, data, msg) {
  this.code = code,
  this.data = data,
  this.msg = msg;
};

var _bleDeviceId;
var _connectCallback;
var _connectCallback_0;

/**
 * 连接设备
 */
var connectDevice = function (device, callback, callback_0) {
  _bleDeviceId = device.deviceId;
  _connectCallback = callback;
  _connectCallback_0 = callback_0;
  wx.onBLEConnectionStateChange((res) => {
    if (res.deviceId == _bleDeviceId) {
      if (res.connected == true) {
        deployBle();
      } else {
        // console.log("连接断开")
        typeof _connectCallback_0 === FUNCTION && _connectCallback_0(new DevResult(1, null, '连接断开'));
      }
    }
  });
  wx.createBLEConnection({
    deviceId: _bleDeviceId,
    timeout: 20 * 1000,
    success: (res) => {
    },
    fail: () => {
      typeof _connectCallback === FUNCTION && _connectCallback(new DevResult(1001, null, '连接失败'));
    }
  });
};

/**
 * 配置连接外设
 */
var deployBle = function () {
  wx.getBLEDeviceServices({
    deviceId: _bleDeviceId,
    success: (res) => {
      for (let i = 0; i < res.services.length; i++) {
        if ((res.services[i].uuid + '') == SERVICE_UUID) {
          wx.getBLEDeviceCharacteristics({
            deviceId: _bleDeviceId,
            serviceId: SERVICE_UUID,
            success: (res) => {
              let haveRead = false;
              let haveWrite = false;
              for (let j = 0; j < res.characteristics.length; j++) {
                let chr = res.characteristics[j].uuid + '';
                if (chr == READ_UUID) {
                  haveRead = true;
                } else if (chr == WRITE_UUID) {
                  haveWrite = true;
                }
              }
              if (haveRead == true && haveWrite == true) {
                wx.notifyBLECharacteristicValueChange({
                  deviceId: _bleDeviceId,
                  serviceId: SERVICE_UUID,
                  characteristicId: READ_UUID,
                  state: true,
                  success: (res) => {
                    initDevice();
                  },
                  fail: () => {
                    disconnectDevice();
                    typeof _connectCallback === FUNCTION && _connectCallback(new DevResult(1002, null, '监听数据失败'));
                  }
                });
              } else {
                disconnectDevice();
                typeof _connectCallback === FUNCTION && _connectCallback(new DevResult(1003, null, '必须特征不满足'));
              }
            },
            fail: () => {
              disconnectDevice();
              typeof _connectCallback === FUNCTION && _connectCallback(new DevResult(1004, null, '读取特征失败'));
            }
          });
          return;
        }
      }
      disconnectDevice();
      typeof _connectCallback === FUNCTION && _connectCallback(new DevResult(1005, null, '必须服务不满足'));
    },
    fail: () => {
      disconnectDevice();
      typeof _connectCallback === FUNCTION && _connectCallback(new DevResult(1006, null, '读取服务失败'));
    }
  });
  wx.onBLECharacteristicValueChange((res) => {
    if (res.deviceId == _bleDeviceId && res.serviceId == SERVICE_UUID && res.characteristicId == READ_UUID) {
      let hexData = ArtcDataUtil.buf2hex(res.value);
      // console.log("接收：" + hexData)
      analyticData(hexData);
    }
  });
};

/**
 * 断开蓝牙连接
 */
var disconnectDevice = function (callback) {
  wx.closeBLEConnection({
    deviceId: _bleDeviceId,
    success: (res) => {
      typeof callback === FUNCTION && callback(new DevResult(0, null, '连接断开成功'));
    },
    fail: () => {
      typeof callback === FUNCTION && callback(new DevResult(1101, null, '连接断开失败'));
    }
  });
};

var _sendCallback;
var _sendDatas;
var _sendIndex = 0;
/**
 * 发送数据
 */
var sendData = function (datas, callback) {
  _pakectData = '';
  _packetLength = 0;
  _pakectArray = new Array();
  _pakectCount = 0;
  _sendCallback = callback;
  _sendDatas = datas;
  _sendIndex = 0;
  doSendData();
};

var doSendData = function () {
  if (_sendIndex < _sendDatas.length) {
    let value = _sendDatas[_sendIndex];
    wx.writeBLECharacteristicValue({
      deviceId: _bleDeviceId,
      serviceId: SERVICE_UUID,
      characteristicId: WRITE_UUID,
      value: value,
      success: (res) => {
        // console.log("发送：" + ArtcDataUtil.buf2hex(value))
        setTimeout(() => {
          _sendIndex++;
          doSendData();
        }, 5);
      },
      fail: () => {
        typeof _sendCallback === FUNCTION && _sendCallback(new DevResult(1201, null, '发送数据失败'));
      }
    });
  }
};

var _pakectData = '';
var _packetLength = 0;
var _pakectArray = new Array();
var _pakectCount = 0;
/**
 * 解析数据
 */
var analyticData = function (data) {
  if (_pakectData.length == 0) {
    if (data.startsWith('50') && data.length >= 8) {
      _packetLength = parseInt(data.slice(6, 8), 16) * 2 + 10;
    } else {
      typeof _sendCallback === FUNCTION && _sendCallback(new DevResult(1202, null, '接收数据异常，LEN字段缺失'));
      return;
    }
  }
  _pakectData += data;
  if (_pakectData.length < _packetLength) {
    return;
  }
  if (_pakectData.length > _packetLength) {
    _pakectData = '';
    _packetLength = 0;
    typeof _sendCallback === FUNCTION && _sendCallback(new DevResult(1203, null, '接收数据异常，接收数据超长'));
    return;
  }
  if (_pakectData.length == _packetLength) {
    if (_pakectArray.length == 0) {
      let ctl = parseInt(_pakectData.slice(2, 6), 16);
      _pakectCount = ctl - 0x8000;
      if (_pakectCount <= 0) {
        _pakectData = '';
        _packetLength = 0;
        typeof _sendCallback === FUNCTION && _sendCallback(new DevResult(1204, null, '接收数据异常，CTL字段数据异常'));
        return;
      }
    }
    _pakectArray.push(_pakectData);
    _pakectData = '';
    _packetLength = 0;

    if (_pakectArray.length == _pakectCount) {
      for (let i = 0; i < _pakectArray.length; i++) {
        let bcc = 0;
        for (let j = 0; j < _pakectArray[i].length - 2; j += 2) {
          let bit = parseInt(_pakectArray[i].slice(j, j + 2), 16);
          bcc ^= bit;
        }
        if (bcc != parseInt(_pakectArray[i].slice(-2), 16)) {
          typeof _sendCallback === FUNCTION && _sendCallback(new DevResult(1205, null, '接收数据异常，BCC校验失败'));
          _pakectArray = new Array();
          _packetLength = 0;
          return;
        }
      }
      let completeData = '';
      for (let i = 0; i < _pakectArray.length; i++) {
        if (_pakectArray[i].length >= 10) {
          completeData += _pakectArray[i].slice(8, -2);
        }
      }
      _pakectArray = new Array();
      _packetLength = 0;
      typeof _sendCallback === FUNCTION && _sendCallback(new DevResult(0, completeData, '指令发送成功，接收结果成功'));
    }
  }
};

var initDevice = function () {
  sendData(ArtcDataUtil.make80SendData(), (res) => {
    if (res.code == 0) {
      let data = res.data;
      if (data.startsWith('9000')) {
        typeof _connectCallback === FUNCTION && _connectCallback(new DevResult(0, null, '连接成功，初始化设备成功'));
        typeof _connectCallback_0 === FUNCTION && _connectCallback_0(new DevResult(0, null, '连接成功，初始化设备成功'));
      } else {
        disconnectDevice();
        typeof _connectCallback === FUNCTION && _connectCallback(new DevResult(1008, null, '连接成功，初始化设备失败'));
      }
    } else {
      disconnectDevice();
      typeof _connectCallback === FUNCTION && _connectCallback(new DevResult(1007, null, '连接成功，初始化设备失败'));
    }
  });
};

var transCmd = function (cmd, cmdtype, callback) {
  let tlv = ArtcDataUtil.makeTLV(cmd);
  sendData(ArtcDataUtil.make82SendData(cmdtype, tlv), (res) => {
    if (res.code == 0) {
      let data = res.data;
      if (data.length >= 12) {
        let tlv = data.slice(10);
        let reapdus = ArtcDataUtil.reTLV(tlv);
        typeof callback === FUNCTION && callback(new DevResult(0, reapdus, '透传成功'));
      } else {
        typeof callback === FUNCTION && callback(new DevResult(1206, null, '缺失tlv数据'));
      }
    } else {
      typeof callback === FUNCTION && callback(res);
    }
  });
};

// 接口对象
var ArtcBleUtil = {
  connectDevice: connectDevice,
  disconnectDevice: disconnectDevice,
  transCmd: transCmd
};

// 暴露接口对象
module.exports = ArtcBleUtil;
