var bleCode = require('./JLZJConfig.js');
var onfire = require('./onfire.js');
var dataTool = require('./dataTool.js');
var successCode = bleCode.bleSuccessCode();
var errorCode = bleCode.bleErrorCode();
var serviceId = 'FEE7';
var charact_serviceId = serviceId;
var deviceId;
var serviceId;
var characticId;
var dev;
export function scan_StartScanBleDevice (nameFlag, callBack) {
  var devs = [];
  initBluetoothAdapte(function (res) {
    if (res.code == bleCode.bleSuccessCode()) {
      wx.startBluetoothDevicesDiscovery({
        services: ['FEE7'],
        success: function (res) {
          wx.onBluetoothDeviceFound(function (res) {
            var scandevices = res.devices;
            for (var i = 0; i < scandevices.length; i++) {
              var scan_dev = scandevices[i];
              if (nameFlag != null) {
                if (scan_dev.name.indexOf(nameFlag) != -1) {
                  devs.push(scan_dev);
                }
              } else {
                if (scan_dev.name.length > 0) {
                  devs.push(scan_dev);
                }
              }
            }
            if (devs.length > 0) {
              callBack.call(this, {
                code: successCode,
                msg: '搜索设备成功',
                data: devs
              });
            }
          });
        },
        fail: function (err) {
          var msg = '';
          if (err) {
            msg = bluetoothErrMsg(err.errCode);
          }
          callBack.call(this, {
            code: bleCode.bleErrorCode(),
            msg: msg,
            data: null
          });
        }
      });
    } else {
      callBack.call(this, res);
    }
  });
};
export function scan_stopScanBleDevice (callBack) {
  wx.stopBluetoothDevicesDiscovery({
    success: function (res) {
      callBack.call(this, {
        code: successCode,
        msg: '停止扫描成功',
        data: null
      });
    },
    fail: function (err) {
      var msg = '';
      if (err) {
        msg = bluetoothErrMsg(err.errCode);
      }
      callBack.call(this, {
        code: errorCode,
        msg: msg,
        data: null
      });
    }
  });
};

function initBluetoothAdapte (callBack) {
  wx.openBluetoothAdapter({
    success: function (res) {
      wx.getBluetoothAdapterState({
        success: function (res) {
          if (res.available == true && res.discovering == false) {
            callBack.call(this, {
              code: successCode,
              msg: '初始化蓝牙模块成功',
              data: null
            });
          }
          if (res.available == false) {
            callBack.call(this, {
              code: errorCode,
              msg: '蓝牙适配器不可用',
              data: null
            });
          }
          if (res.discovering == true) {
            callBack.call(this, {
              code: errorCode,
              msg: '正在搜索设备',
              data: null
            });
          }
        },
        fail: function (err) {
          var msg = '';
          if (err) {
            msg = bluetoothErrMsg(err.errCode);
          }
          callBack.call(this, {
            code: errorCode,
            msg: msg,
            data: null
          });
        }
      });
    },
    fail: function (err) {
      var msg = '';
      if (err) {
        msg = bluetoothErrMsg(err.errCode);
      }
      callBack.call(this, {
        code: errorCode,
        msg: msg,
        data: null
      });
    }
  });
}

function closeBluetoothAdapte (callBack) {
  wx.getBluetoothAdapterState({
    success: function (res) {
      wx.closeBluetoothAdapter({
        success: function (res) {
          callBack.call(this, {
            code: successCode,
            msg: '关闭蓝牙模块成功',
            data: null
          });
        },
        fail: function (err) {
          callBack.call(this, {
            code: errorCode,
            msg: err.errmsg,
            data: null
          });
        }
      });
    },
    fail: function (err) {
      var msg = '';
      if (err) {
        msg = bluetoothErrMsg(err.errCode);
      }
      callBack.call(this, {
        code: errorCode,
        msg: msg,
        data: null
      });
    }
  });
}
export function connectDevice (device, callBack) {
  dev = device;
  getConnectedDevice(function (res) {
    if (res.code == bleCode.bleSuccessCode()) {
      wxConnectDevice(function (res) {
        callBack.call(this, res);
      });
    } else {
      callBack.call(this, res);
    }
  });
};
export function disConnectDevice (callBack) {
  wxDisConnectDevice(function (res) {
    callBack.call(this, res);
  });
};
export function onDeviceConnectStateChange (callBack) {
  wx.onBLEConnectionStateChange(function (res) {
    if (res.connected == true) {
      callBack.call(this, {
        code: bleCode.successCode(),
        data: res.deviceId,
        msg: '设备连接'
      });
    } else {
      callBack.call(this, {
        code: bleCode.ondisConnect(),
        data: res.deviceId,
        msg: '设备断开'
      });
    }
  });
};

function wxConnectDevice (callBack) {
  console.log('连接设备对象:' + JSON.stringify(dev));
  wx.createBLEConnection({
    deviceId: dev.deviceId,
    success: function (res) {
      callBack.call(this, {
        code: bleCode.bleSuccessCode(),
        msg: '蓝牙物理连接成功',
        data: dev
      });
    },
    fail: function (err) {
      var msg = '';
      if (err) {
        msg = bluetoothErrMsg(err.errCode);
      }
      callBack.call(this, {
        code: bleCode.bleErrorCode(),
        msg: msg,
        data: null
      });
    }
  });
}

function getConnectedDevice (callBack) {
  wx.getConnectedBluetoothDevices({
    services: ['fee7'],
    success: function (res) {
      console.log(JSON.stringify(res) + '******************************************ldd');
      if (res.devices.length > 0) {
        callBack.call(this, {
          code: bleCode.bleErrorCode(),
          msg: '蓝牙被占用',
          data: res.services[0]
        });
      } else {
        callBack.call(this, {
          code: bleCode.bleSuccessCode(),
          msg: '可连接设备',
          data: null
        });
      }
    },
    fail: function (err) {
      console.log(JSON.stringify(err) + '******************************************ldd');
      var msg = '';
      if (err) {
        msg = bluetoothErrMsg(err.errCode);
      }
      callBack.call(this, {
        code: bleCode.bleErrorCode(),
        msg: msg,
        data: null
      });
    }
  });
}

function wxDisConnectDevice (callBack) {
  if (dev != null) {
    wx.closeBLEConnection({
      deviceId: dev.deviceId,
      success: function (res) {
        wx.closeBluetoothAdapter({
          success: function (res) {
            callBack.call(this, {
              code: bleCode.bleSuccessCode(),
              msg: '设备断开连接成功',
              data: null
            });
          },
          fail: function (err) {
            callBack.call(this, {
              code: bleCode.bleErrorCode(),
              msg: '设备断开连接成功,' + err.errmsg,
              data: null
            });
          }
        });
      },
      fail: function (err) {
        var msg = '';
        if (err) {
          msg = bluetoothErrMsg(err.errCode);
        }
        callBack.call(this, {
          code: bleCode.bleErrorCode(),
          msg: msg,
          data: null
        });
      }
    });
  } else {
    callBack.call(this, {
      code: bleCode.bleSuccessCode(),
      msg: '暂无设备连接',
      data: null
    });
  }
}
export function findDeviceServices (device, callBack1, callBack2) {
  getDeviceService(device, function (res) {
    getDeviceCharacteristics(device, res.data, function (res1) {
      callBack1.call(this, res1);
    }, function (res2) {
      if (res2.code == bleCode.bleSuccessCode()) {
        wx.onBLECharacteristicValueChange(function (res) {
          console.log('接收数据<<=============:' + dataTool.bufferTohex(res.value).toLocaleUpperCase());
          callBack2.call(this, {
            code: bleCode.bleSuccessCode(),
            msg: '特征值发生变化',
            data: {
              value: dataTool.bufferTohex(res.value).toLocaleUpperCase()
            }
          });
        });
      } else {
        callBack2.call(this, res2);
      }
    });
  });
};

function getDeviceService (device, callBack) {
  wx.getBLEDeviceServices({
    deviceId: device.deviceId,
    success: function (res) {
      var services = res.services;
      for (var i = 0; i < services.length; i++) {
        if (res.services[i].uuid.substr(0, 8) == '0000FEE7') {
          callBack.call(this, {
            code: bleCode.bleSuccessCode(),
            msg: '寻找服务成功',
            data: res.services[i].uuid
          });
        }
      }
    }
  });
}

function getDeviceCharacteristics (device, serviceId, callBack1, callBack2) {
  wx.getBLEDeviceCharacteristics({
    deviceId: device.deviceId,
    serviceId: serviceId,
    success: function (res) {
      var charactertics = res.characteristics;
      for (var i = 0; i < charactertics.length; i++) {
        var charact = charactertics[i];
        if (charact.properties.read == true) {
          wx.readBLECharacteristicValue({
            deviceId: device.deviceId,
            serviceId: charact_serviceId,
            characteristicId: charact.uuid,
            success: function (res) {}
          });
        }
        if (charact.properties.write == true) {
          callBack1.call(this, {
            code: bleCode.bleSuccessCode(),
            msg: null,
            data: {
              id: {
                devId: device.deviceId,
                serId: serviceId,
                charactId: charact.uuid
              }
            }
          });
        }
        if (charact.properties.notify == true || charact.properties.indicate == true) {
          wx.notifyBLECharacteristicValueChange({
            deviceId: device.deviceId,
            serviceId: serviceId,
            characteristicId: charact.uuid,
            state: true,
            success: function (res) {
              callBack2.call(this, {
                code: bleCode.bleSuccessCode(),
                msg: '开启设备监听成功',
                data: res
              });
            },
            fail: function (err) {
              var msg = '';
              if (err) {
                msg = bluetoothErrMsg(err.errCode);
              }
              callBack2.call(this, {
                code: bleCode.bleErrorCode(),
                msg: msg,
                data: null
              });
            }
          });
        }
      }
    }
  });
}
export function setParams (id) {
  deviceId = id.devId;
  serviceId = id.serId;
  characticId = id.charactId;
  console.log('写数据各项ID:' + JSON.stringify(id));
};
export function sendMessageToDevice (cmdArray, callBack) {
  var cmd = dataTool.strToBuffer(cmdArray[0]);
  var i = 0;
  wx.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characticId,
    value: cmd,
    success: function (res) {
      if (i < cmdArray.length - 1) {
        i++;
        onfire.fire('send', i);
      } else {
        onfire.clear();
        console.info('所有数据发送完成 共:' + cmdArray.length + '包');
        console.info('发送数据=============>>::' + cmdArray);
        callBack.call(this, {
          code: successCode,
          msg: '数据发送成功',
          data: cmdArray
        });
      }
    },
    fail: function (err) {
      console.log('writeBLECharacteristicValue fail:' + JSON.stringify(err));
      var msg = '';
      if (err) {
        msg = bluetoothErrMsg(err.errCode);
      }
      callBack.call(this, {
        code: bleCode.bleErrorCode(),
        msg: msg,
        data: null
      });
    }
  });
  onfire.on('send', i => {
    var cmd1 = dataTool.strToBuffer(cmdArray[i]);
    wx.writeBLECharacteristicValue({
      deviceId: deviceId,
      serviceId: serviceId,
      characteristicId: characticId,
      value: cmd1,
      success: function (res) {
        if (i < cmdArray.length - 1) {
          i++;
          onfire.fire('send', i);
        } else {
          onfire.clear();
          console.info('所有数据发送完成 共:' + cmdArray.length + '包');
          console.info('发送数据=============>>:' + cmdArray);
          callBack.call(this, {
            code: successCode,
            msg: '数据发送成功',
            data: cmdArray
          });
        }
      },
      fail: function (err) {
        console.log('writeBLECharacteristicValue fail:' + JSON.stringify(err));
        var msg = '';
        if (err) {
          msg = bluetoothErrMsg(err.errCode);
        }
        callBack.call(this, {
          code: bleCode.bleErrorCode(),
          msg: msg,
          data: null
        });
      }
    });
  });
};

function bluetoothErrMsg (errorCode) {
  switch (errorCode) {
    case 0:
      return '正常';
      break;
    case 1e4:
      return '未初始化蓝牙适配器';
      break;
    case 10001:
      return '当前蓝牙适配器不可用';
      break;
    case 10002:
      return '没有找到指定设备';
      break;
    case 10003:
      return '连接失败：操作超时';
      break;
    case 10004:
      return '蓝牙设备没有找到指定服务';
      break;
    case 10005:
      return '蓝牙设备没有找到指定特征值';
      break;
    case 10006:
      return '当前设备连接已断开';
      break;
    case 10007:
      return '当前特征值不支持此操作';
      break;
    case 10008:
      return '其余所有系统上报的异常';
      break;
    case 10009:
      return '安卓系统版本低于4.3不支持BLE';
      break;
    default:
      return '操作失败';
      break;
  }
}
