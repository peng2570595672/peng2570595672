const ArtcDataUtil = require("./ArtcDataUtil.js")
const FUNCTION = "function"
const SERVICE_UUID = "0000FF17-0000-1000-8000-00805F9B34FB"
const WRITE_UUID = "0000FF02-0000-1000-8000-00805F9B34FB"
const READ_UUID = "0000FF03-0000-1000-8000-00805F9B34FB"
var _bleDeviceId
var _connectCall = false
var _connectCallBack
var _connectTimer

var DevResult = function (code, data, msg) {
  this.code = code,//值为0表示成功
  this.data = data,//业务接口成功返回的附带信息
  this.msg = msg//备用信息
}

/**
 * 连接设备
 */
var connectBle = function (device, callBack, connectTimeout) {
  _connectCall = true
  _connectCallBack = callBack
  _bleDeviceId = device.deviceId
  wx.onBLEConnectionStateChange((res) => {
    if (res.deviceId == _bleDeviceId) {
      if (res.connected == true) {
        
      } else {
        console.log("连接断开")
        if (_closeCall) {
          clearTimeout(_sendTime)
          _closeCall = false
          typeof _closeCallBack.success == FUNCTION && _closeCallBack.success(new DevResult(1000, "", "连接断开"))
        }
        if (_sendDataCall) {
          clearTimeout(_sendTime)
          _sendDataCall = false
          typeof _sendCallback == FUNCTION && _sendCallback(new DevResult(4000, "", "连接断开"))
        }
      }
    }
  })
  wx.createBLEConnection({
    deviceId: _bleDeviceId,
    timeout: connectTimeout,
    success: (res) => {
      deployBle(callBack)//配置
    },
    fail: () => {
      if (_connectCall) {
        _connectCall = false
        clearTimeout(_connectTimer)
        typeof callBack.fail == FUNCTION && callBack.fail(new DevResult(4000, "", "连接失败"))
      }
    },
  })
  _connectTimer = setTimeout(() => {
    if (_connectCall) {
      _connectCall = false
      disconnectBle({
        success: (res) => {
          typeof callBack.fail == FUNCTION && callBack.fail(new DevResult(2002, "", "连接超时"))
        },
        fail: (res) => {
          typeof callBack.fail == FUNCTION && callBack.fail(new DevResult(2002, "", "连接超时"))
        }
      })
    }
  }, connectTimeout)
}

/**
 * 配置连接外设
 */
var deployBle = function (callback) {
  wx.getBLEDeviceServices({
    deviceId: _bleDeviceId,
    success: (res) => {
      for (let i = 0; i < res.services.length; i ++) {
        if ((res.services[i].uuid + "") == SERVICE_UUID) {
          wx.getBLEDeviceCharacteristics({
            deviceId: _bleDeviceId,
            serviceId: SERVICE_UUID,
            success: (res) => {
              let haveRead = false;
              let haveWrite = false;
              for (let j = 0; j < res.characteristics.length; j ++) {
                let chr = res.characteristics[j].uuid + ""
                if (chr == READ_UUID) {
                  haveRead = true;
                }
                else if (chr == WRITE_UUID) {
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
                    console.log("监听数据,初始化设备")
                    initDevice();
                  },
                  fail: () => {
                    if (_connectCall) {
                      _connectCall = false
                      clearTimeout(_connectTimer)
                      disconnectBle({
                        success: (res) => {
                          typeof callback.fail == FUNCTION && callback.fail(new DevResult(4000, "", "监听数据失败"))
                        }
                      })
                    }
                  }
                })
              }else {
                if (_connectCall) {
                  _connectCall = false
                  clearTimeout(_connectTimer)
                  disconnectBle({
                    success: (res) => {
                      typeof callback.fail == FUNCTION && callback.fail(new DevResult(4000, "", "需要的特征不存在"))
                    }
                  })
                }
              }
            },
            fail: () => {
              if (_connectCall) {
                _connectCall = false
                clearTimeout(_connectTimer)
                disconnectBle({
                  success: (res) => {
                    typeof callback.fail == FUNCTION && callback.fail(new DevResult(4000, "", "获取特征失败"))
                  }
                })
              }
            }
          })
          return
        }
      }
      if (_connectCall) {
        _connectCall = false
        clearTimeout(_connectTimer)
        disconnectBle({
          success: (res) => {
            typeof callback.fail == FUNCTION && callback.fail(new DevResult(4000, "", "需要的服务不存在"))
          }
        })
      }
    },
    fail: () => {
      if (_connectCall) {
        _connectCall = false
        clearTimeout(_connectTimer)
        disconnectBle({
          success: (res) => {
            typeof callback.fail == FUNCTION && callback.fail(new DevResult(4000, "", "获取服务失败"))
          }
        })
      }
    }
  })
  wx.onBLECharacteristicValueChange((res) =>{
    if (res.deviceId == _bleDeviceId && res.serviceId == SERVICE_UUID && res.characteristicId == READ_UUID) {
      let hexData = ArtcDataUtil.buf2hex(res.value)
      console.log("接收：" + hexData)
      analyticData(hexData)
    }
  })
}


/**
 * 断开蓝牙连接
 */
var disconnectBle = function (callBack) {
  console.log("主动断开蓝牙连接")
  wx.closeBLEConnection({
    deviceId: _bleDeviceId,
    success: (res) => {
      typeof callBack.success == FUNCTION && callBack.success(new DevResult(1000, "", "断开连接成功"))
    },
    fail: () => {
      typeof callBack.fail == FUNCTION && callBack.fail(new DevResult(4000, "", ""))
    }
  })
} 

var _sendTime
var _sendDataCall = false
var _sendCallback
var _sendDatas
var _sendIndex = 0
/**
 * 发送数据
 */
var sendData = function (datas, callback, sendDataTimeout) {
  _sendDataCall = true
  _pakectData = ""
  _packetLength = 0
  _pakectArray = new Array()
  _pakectCount = 0
  _sendCallback = callback
  _sendDatas = datas
  _sendIndex = 0
  doSendData()
  let timeout = sendDataTimeout
  if (!sendDataTimeout) {
    timeout = 20 * 1000
  }
  _sendTime = setTimeout(() => {
    if (_sendDataCall) {
      _sendDataCall = false
      typeof _sendCallback == FUNCTION && _sendCallback(new DevResult(2000, "", "超时"))
    }
  }, timeout)
}

var doSendData = function () {
  if (_sendIndex < _sendDatas.length) {
    let value = _sendDatas[_sendIndex]
    wx.writeBLECharacteristicValue({
      deviceId: _bleDeviceId,
      serviceId: SERVICE_UUID,
      characteristicId: WRITE_UUID,
      value: value,
      success: (res) => {
        console.log("发送：" + ArtcDataUtil.buf2hex(value))
        setTimeout(() => {
          _sendIndex++
          doSendData()
        }, 5)
      },
      fail: () => {
        clearTimeout(_sendTime)
        if (_sendDataCall) {
          _sendDataCall = false
          typeof _sendCallback == FUNCTION && _sendCallback(new DevResult(4000, "", "发送失败"))
        }
      }
    })
  }
}

var _pakectData = ""
var _packetLength = 0
var _pakectArray = new Array()
var _pakectCount = 0
/**
 * 解析数据
 */
var analyticData = function (data) {
  if (_pakectData.length == 0) {
    if (data.startsWith("50") && data.length >= 8) {
      _packetLength = parseInt(data.slice(6, 8), 16) * 2 + 10
    } else {
      clearTimeout(_sendTime)
      if (_sendDataCall) {
        _sendDataCall = false
        typeof _sendCallback == FUNCTION && _sendCallback(new DevResult(4000, "", "数据协议结构异常"))
      }
      return
    }
  }
  _pakectData += data
  if (_pakectData.length < _packetLength) {
    return
  }
  if (_pakectData.length > _packetLength) {
    _pakectData = ""
    _packetLength = 0
    clearTimeout(_sendTime)
    if (_sendDataCall) {
      _sendDataCall = false
      typeof _sendCallback == FUNCTION && _sendCallback(new DevResult(4000, "", "接收数据异常，接收数据超长"))
    }
    return
  }
  if (_pakectData.length == _packetLength) {
    if (_pakectArray.length == 0) {
      let ctl = parseInt(_pakectData.slice(2, 6), 16)
      _pakectCount = ctl - 0x8000
      if (_pakectCount <= 0) {
        _pakectData = ""
        _packetLength = 0
        clearTimeout(_sendTime)
        if (_sendDataCall) {
          _sendDataCall = false
          typeof _sendCallback == FUNCTION && _sendCallback(new DevResult(4000, "", "CTL字段数据异常"))
        }
        return
      }
    }
    _pakectArray.push(_pakectData)
    _pakectData = ""
    _packetLength = 0

    if (_pakectArray.length == _pakectCount) {
      for (let i = 0; i < _pakectArray.length; i++) {
        let bcc = 0
        for (let j = 0; j < _pakectArray[i].length - 2; j += 2) {
          let bit = parseInt(_pakectArray[i].slice(j, j + 2), 16)
          bcc ^= bit
        }
        if (bcc != parseInt(_pakectArray[i].slice(-2), 16)) {
          _pakectArray = new Array()
          _packetLength = 0
          clearTimeout(_sendTime)
          if (_sendDataCall) {
            _sendDataCall = false
            typeof _sendCallback == FUNCTION && _sendCallback(new DevResult(4000, "", "BCC校验失败"))
          }
          return
        }
      }
      let completeData = ""
      for (let i = 0; i < _pakectArray.length; i++) {
        if (_pakectArray[i].length >= 10) {
          completeData += _pakectArray[i].slice(8, -2)
        }
      }
      _pakectArray = new Array()
      _packetLength = 0
      clearTimeout(_sendTime)
      if (_sendDataCall) {
        _sendDataCall = false
        typeof _sendCallback == FUNCTION && _sendCallback(new DevResult(1000, completeData, ""))
      }
    }
  }
}



/**
 * 握手指令
 */
var initDevice = function () {
  sendData(ArtcDataUtil.make80SendData(), (res) => {
    if (res.code == 1000) {
      if (res.data.startsWith("9000")) {
        if (_connectCall) {
          _connectCall = false
          clearTimeout(_connectTimer)
          typeof _connectCallBack.success == FUNCTION && _connectCallBack.success(new DevResult(1000, "", "连接且设备初始化成功"))
        }
      } else {
        if (_connectCall) {
          _connectCall = false
          clearTimeout(_connectTimer)
          disconnectBle({
            success: (res) => {
              typeof _connectCallBack.fail == FUNCTION && _connectCallBack.fail(new DevResult(4000, "", "设备初始化失败"))
            },
          })
        }
      }
    } else {
      if (_connectCall) {
        _connectCall = false
        clearTimeout(_connectTimer)
        disconnectBle({
          success: (res) => {
            typeof _connectCallBack.fail == FUNCTION && _connectCallBack.fail(new DevResult(1000, "", "设备初始化失败"))
          },
        })
      }
    }
  })
}

/**
 * 收发 和 指令
 */
var sendAndReceive = function (type, cmd, callBack, cmdTimeout) {
  let tlv = ArtcDataUtil.makeTLV(cmd)
  let sendDatas
  if (type == 0) {
    sendDatas = ArtcDataUtil.make82SendData("10", tlv)
  }else {
    sendDatas = ArtcDataUtil.make82SendData("20", tlv)
  }
  sendData(sendDatas, (res) => {
    if (res.code == 1000) {
      let reapdus = ArtcDataUtil.reTLV(res.data.slice(10))
      typeof callBack.success == FUNCTION && callBack.success(new DevResult(1000, reapdus, "apdu指令执行完成"))
    }else {
      typeof callBack.fail == FUNCTION && callBack.fail(res)
    }
  }, cmdTimeout)
}

var _closeCall = false
var _closeCallBack
/**
 * 关闭盒子
 */
var closeBleDevice = function(callBack) {
  _closeCall = true
  _closeCallBack = callBack
  sendData(ArtcDataUtil.make81SendData("C3"), (res) => {
    if (res.code != 1000) {
      typeof callBack.fail == FUNCTION && callBack.fail(res)
    }
  }, 8000);
}


//接口对象
var ArtcBleUtil = {
  connectAndInit: connectBle,
  disConnect: closeBleDevice,
  sendAndReceive: sendAndReceive,
}


//暴露接口对象
module.exports = ArtcBleUtil