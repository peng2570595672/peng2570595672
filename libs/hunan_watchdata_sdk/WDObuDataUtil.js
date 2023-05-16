/*!
 * WATCHDATA OBU Ble Javascript Library
 * @author  Mi.Li on 2018/11/14
 * @version - v1.0.0
 */
var dataArrayTopacg = [];
var mExpLength = 0;
var mExpPackets = 0;
var delayTimer; //停止循环获取tag
var sendTimeout = 0;
var isFound = false
var isConnected = 1 //1 是未连接 0是链接 -1连接失败
var isResponse = false // 发送失败  0 发送成功  -1 发送断开
var isConnecting = false
var expPktNum = 0;
var expPktLen = 0;
var recBuffer = [];
var currentDevice = {}; //ble设备
var currentService = {}; //写入服务
var currentCharacteristic = {}; //特征值
var currentDeviceService = {}; //服务
var writeCharacteristic = {}; //写入特征值
var indicateCharacteristic = {}; //indicate特征值
var readCharacteristic = {}; //读取特征值
var onSendSuccessCallBack = undefined; //发送成功回调
var onSendFailCallBack = undefined; //发送失败回调
var lastErrorCode = 0; //default ok
var sendTO; //send timeout
var isTimeOut = false;//是否链接超时
var setTimeCreat;
var retDeivces ={
  name:"",
  deviceId:"",
  RSSI:0,
  localName:"",
  services:null,
  characteristics:null,
}
var defaultRes = {
  errMsg: "ok",
  errCode: 0
};

const ERROR_CONNECT_FAIL = 80000;
const ERROR_SERACH_TIMEOUT = 80001;
const ERROR_CONNECT_TIMEOUT = 80002;
const ERROR_SEND_TIMEOUT = 80003;
const ERROR_DATA_ERROR = 80004;

const LENGTH_PER_PACKET = 95; //TODO:?92
const LENGTH_HEADER = 5; //skip st

module.exports = {
  startConnectDevice: startConnectDevice,
  disconnectBleDevice: disconnectBleDevice,
  transCmd: transCmd,
  packPkt: packPkt,
  unpackPkt: unpackPkt,
  bytes2HexStr: bytes2HexStr,
  hexStr2Bytes: hexStr2Bytes,
  sync_transCmd: sync_transCmd,
  isConnectionStateChange: isConnectionStateChange,
  isConnectingStateChange: isConnectingStateChange,
  setConnectingState: setConnectingState,
  arrayBuffer2HexString: arrayBuffer2HexString,
  createBLEConnection: createBLEConnection
}

/**
 * @method startConnectDevice
 * @param {params}
 * @desc 开始连接WATCHDATA低功耗蓝⽛设备
 */
function startConnectDevice(params,callback_0) {
  console.log('start connect>>>');
  console.log("connecting === " + isConnecting);
  isConnecting = true;
  console.log("connecting1111 === " + isConnecting);
  openBluetoothAdapter(params, callback_0);
}

/**
 * @desc 断开连接WATCHDATA低功耗蓝⽛设备
 */
function disconnectBleDevice(params) {
  if (isConnectionStateChange()==0) {
    closeBLEConnection(params);
  } else {
    params.success({
      code: 1000,
      msg: "断开连接成功"
    })
  }
}

/**
 * @method isConnectionStateChange
 * @param
 * @desc 查询蓝牙是否正处于链接状态
 */
function isConnectionStateChange() {
  return isConnected;
}

/**
 * 获取当前是否处于连接中
 */
function isConnectingStateChange() {
  return isConnecting;
}

function setConnectingState(state) {
  isConnecting = state;
}


/**
 * @desc 初始化蓝牙适配器
 */
function openBluetoothAdapter(params,callback_0) {
  //reset bt adapter

  clearInterval(delayTimer);

  wx.closeBluetoothAdapter({
    success: function(res) {
      console.log("复位蓝牙适配器成功")
      console.log(res)
      params.success({
        code:1000,
        msg: "复位蓝牙适配器成功",
      })
    },
    fail: function(res) {
      console.log("复位蓝牙适配器失败")
      console.log(res)
      params.fail({
        errMsg: "复位蓝牙适配器失败",
        errCode: res.errCode
      })
      return
    }
  })

  wx.openBluetoothAdapter({
    success: function(res) {
      console.log("初始化蓝牙适配器成功")
      console.log(res)
      wx.getBluetoothAdapterState({
        success(res) {
          console.log('getBluetoothAdapterState success' + res)
        },
        fail(res) {
          console.log('getBluetoothAdapterState fail' + res)
        }
      })
      startBluetoothDevicesDiscovery(params,callback_0)
    },
    fail: function(res) {
      console.log("初始化蓝牙适配器失败" + res.errMsg)
      params.fail({
        errMsg: "初始化蓝牙适配器失败",
        errCode: res.errCode
      })
      return
    },
    complete: function(res) {
      console.log(res);
    }
  })
}
/**
 * @desc 开始搜寻附近的蓝牙外围设备。注意，该操作比较耗费系统资源，在搜索并连接到设备后调用 stop 方法停止搜索。
 */
function startBluetoothDevicesDiscovery(params,callback_0) {
  console.log(params);
  setTimeout(function() {
    if (isFound) {
      return;
    } else {
      defaultRes.errCode = ERROR_SERACH_TIMEOUT;
      defaultRes.errMsg = "搜索设备超时";
      console.log("搜索设备超时");
      stopBluetoothDevicesDiscovery();
      clearInterval(delayTimer)
      params.fail({
        code :2002,
        msg:"搜索设备超时"
      });
      return
    }
  }, params.discoveryTimeout);

  wx.startBluetoothDevicesDiscovery({
    services: ['0000fee7-0000-1000-8000-00805f9b34fb'],
    success: function(res) {
      console.log("开启搜索成功")
      console.log(res)
      getBluetoothDevices(params,callback_0)
    },
    fail: function(res) {
      console.log("开启搜索失败")
      params.fail({
        msg: "开启搜索失败",
        code: res.errCode
      })
      return
    }
  })

  //每隔delayTime获取一次
  delayTimer = setInterval(function() {
    if (!isFound)
      getBluetoothDevices(params,callback_0)
  }, params.delayTime)

}

/**
 * @desc 获取所有已发现的蓝牙设备，包括已经和本机处于连接状态的设备
 */
function getBluetoothDevices(params,callback_0) {
  wx.getBluetoothDevices({
    success: function(res) {
      console.log("getBluetoothDevices 扫描成功");
      console.log(res.devices);
      for (var i = 0; i < res.devices.length; i++) {
        var obuNameFinal = removeBytes(params.adviceId, ":")
        if (isContains(res.devices[i].name, obuNameFinal)) {
          console.log("搜索到要链接的设备....")
          console.log(res)
          stopBluetoothDevicesDiscovery();
          isFound = true
          clearInterval(delayTimer)
          currentDevice = res.devices[i]
          console.log(currentDevice)
        }
      }
    },
    fail: function(res) {
      clearInterval(delayTimer)
      console.log("没有搜索到OBU设备")
      console.log(res)
      params.fail({
        errMsg: "没有搜索到OBU设备",
        errCode: res.errCode
      })
      stopBluetoothDevicesDiscovery();
      return
    }
  })
}

/**
 *@desc 停止搜寻附近的蓝牙外围设备。请在确保找到需要连接的设备后调用该方法停止搜索。
 */
function stopBluetoothDevicesDiscovery() {
  wx.stopBluetoothDevicesDiscovery({
    success: function(res) {
      console.log("停止搜索设备")
      console.log(res)
    }
  })
}


/**
 *@desc 连接低功耗蓝牙设备
 */
function createBLEConnection(params) {
  isTimeOut = false
   setTimeCreat=setTimeout(function() {
    console.log("连接状态", isConnected)
    if (isConnected == 0) return;
    defaultRes.errCode = ERROR_CONNECT_TIMEOUT;
    defaultRes.errMsg = "连接设备超时";
    params.fail({
      code :2002,
      msg : "连接设备超时"
    })
    isTimeOut = true
    clearTimeout(setTimeCreat)
    return
  }, params.connectTimeout)
  wx.createBLEConnection({
    deviceId: params.adviceId,
    timeout :1000,
    success: function(res) {
      clearTimeout(setTimeCreat)
      if (isTimeOut) {
        return
      }

      isConnected = 0
      sendTimeout = params.sendTimeout;
      getBLEDeviceServices(params);
    },
    fail: function(res) {
      isTimeOut = true
      //isConnected = -1
      // params.fail({
      //   msg: "连接OBU失败",
      //   code: 4000
      // })
      return null
    }
  })
}
/**
 *@desc 断开与低功耗蓝牙设备的连接
 */
function closeBLEConnection(params) {
  wx.closeBLEConnection({
    deviceId: currentDevice.deviceId + "",
    success: function(res) {
      isConnected = 1
      isFound = false
      params.success({
        code: 1000,
        msg: "断开连接成功。"
      })
      lastErrorCode = undefined
      retDeivces.name = undefined
      retDeivces.deviceId = undefined
      retDeivces.RSSI = undefined
      retDeivces.localName = undefined
      retDeivces.services = undefined
      retDeivces.characteristics = undefined
      currentDevice.deviceId = undefined
    },
    fail: function(res) {
      params.fail({
        msg: "断开连接失败",
        code: 4000
      })
    }
  })
}





/**
 *@desc 获取蓝牙设备所有 service（服务）
 */

function getBLEDeviceServices(params) {
  wx.onBLEConnectionStateChange(function(res) {
    if (isTimeOut) return
    // 该方法回调中可以用于处理连接意外断开等异常情况
    console.log("链接状态",isConnected,"回调状态",res.connected)
    if (isConnected == 0 && res.connected==false){
      isConnected = -1
      return
    }
    if (res.connected){
      isConnected = 0
    }else
    {
      isConnected = 1
      lastErrorCode = undefined
      retDeivces.name = undefined
      retDeivces.deviceId = undefined
      retDeivces.RSSI = undefined
      retDeivces.localName = undefined
      retDeivces.services = undefined
      retDeivces.characteristics = undefined
      currentDevice.deviceId = undefined
    }
    //if (res.connected == false) isFound = res.connected;
    return ;
  });

  wx.getBLEDeviceServices({
    // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
    deviceId: params.adviceId + "",
    success: function(res) {
      for (var i = 0; i < res.services.length; i++) {
        if (res.services[i].uuid.toUpperCase() === params.srv_uuid.toUpperCase()) {
          currentService = res.services[i]
          break;
        }
      }
      currentDeviceService = res.services;
      //获取Characteristics
      getBLEDeviceCharacteristics(params);

    },
    fail: function(res) {
      params.fail({
        msg: "获取服务失败",
        code: 4000
      })
    }
  })
}

/**
 *@desc 获取蓝牙设备唤醒characteristic（特征值）
 */
function getBLEDeviceCharacteristics(params) {
  wx.getBLEDeviceCharacteristics({
    // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
    deviceId: params.adviceId + "",
    // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
    serviceId: params.srv_uuid + "",
    success: function(res) {
      for (var i = 0; i < res.characteristics.length; i++) {
        if (res.characteristics[i].uuid.toUpperCase() === params.chr_read_uuid.toUpperCase()) {
          readCharacteristic = res.characteristics[i];
        }
        if (res.characteristics[i].uuid.toUpperCase() === params.chr_write_uuid.toUpperCase()) {
          writeCharacteristic = res.characteristics[i];
        }
        if (res.characteristics[i].uuid.toUpperCase() === params.chr_indicate_uuid.toUpperCase()) {
          indicateCharacteristic = res.characteristics[i];
        }
      }
      currentCharacteristic = res.characteristics;
     // console.log("读=唤醒特征值 read_uuid:", readCharacteristic)
      // initNotifyListener(params);
      subscribeIndicateCharacteristic(params);
    },
    fail: function(res) {
      params.fail({
        msg: "唤醒特征值获取失败",
        code: 4000
      })
    }
  })
}

/**
 *
 * @desc 连接成功后，初始化回调监听
 */
function initNotifyListener(params) {
  wx.readBLECharacteristicValue({
    deviceId: params.adviceId + "",
    serviceId: params.srv_uuid + "",
    characteristicId: readCharacteristic.uuid + "",
    success: function (res) {

      subscribeIndicateCharacteristic(params)
    },
    fail: function (res) {

      params.fail({
        msg: "开启监听失败",
        code: 4000
      })
    }
  })
}

function subscribeIndicateCharacteristic (params) {
  wx.notifyBLECharacteristicValueChange({
    deviceId: params.adviceId + "",
    serviceId: params.srv_uuid + "",
    characteristicId: indicateCharacteristic.uuid + "",
    state: true,
    success: function (res) {
    let setTime = setTimeout(function () {
        //连接成功
        lastErrorCode = res.errCode;
        retDeivces.name = currentDevice.name;
        retDeivces.deviceId = currentDevice.deviceId;
        retDeivces.RSSI = currentDevice.RSSI;
        retDeivces.localName = currentDevice.localName;
        retDeivces.services = currentDeviceService;
        retDeivces.characteristics = currentCharacteristic;
        currentDevice.deviceId = params.adviceId
        clearTimeout(setTimeCreat)
        params.success({
          code: 1000,
          msg: "连接成功",
        })
      }, params.accTimeout);

      onBLECharacteristicValueChange(params);
    },
    fail: function (res) {

      params.fail({
        msg: "开启监听失败",
        code: 4000
      })
    }
  });
}



/**
 *@desc 启用低功耗蓝牙设备特征值变化时的 notify
 */
function onBLECharacteristicValueChange(params) {
  wx.onBLECharacteristicValueChange(function (res) {
    //check pkt
    //每次发送可能多次触发此通知，检查返回包的完整性，否则触发接收等待超时
    let rValue = new Uint8Array(res.value);
    let pktArray = Array.prototype.slice.call(new Uint8Array(res.value));
    if ((expPktLen <= 0) && (pktArray.length < 4)) {
      //丢弃无效包
      console.log('incomplete data:expPktLen=${expPktLen},pktArray.length=${pktArray.lengths}');
      return false;
    }
    if (expPktLen <= 0) {
      expPktLen = pktArray[3] /*+ LENGTH_HEADER  3*/;
      expPktNum = pktArray[2] & 0x7F;
    }
    recBuffer = recBuffer.concat(pktArray.slice(0));
    //console.log("recbuffer", arrayBuffer2HexString(new Uint8Array(recBuffer).buffer))
    expPktLen -= pktArray.length;
    if (expPktLen <= 0 && expPktNum <= 0) {
      //所有帧都收到了
      //console.log("所有帧都收到了");
      // //接收成功，关闭接收等待超时
      //console.log('接收成功，关闭接收等待超时');
      //console.log(arrayBuffer2HexString(new Uint8Array(recBuffer).buffer));
      //接收的所有数据
      let allCmd = arrayBuffer2HexString(new Uint8Array(recBuffer).buffer);

      //得到有用的数据长度
      let dLen = allCmd.substring(22, 24);
      let rCommand = allCmd.substring(24, (24 + parseInt(dLen, 16)) * 2);
      console.log("rCommand", rCommand)
      let bufferArrs = hexStr2Bytes(rCommand);
      console.log("bufferArrs", bufferArrs)
      isResponse = true;
      clearTimeout(sendTO);
      //unpack
      // let retbuf = unpackPkt(recBuffer);
      let retbuf =[]
      if (bufferArrs[2]==128){
        retbuf = unpackPkt(bufferArrs);
      }else{
        retbuf =  bye2to(bufferArrs)
      }
      if (allCmd != null) {
        //console.log("连接指令不返回", arrayBuffer2HexString(bufferArrs))
        if (bufferArrs[0] == 40 && bufferArrs[1] == 2 && bufferArrs[2] == 58 && bufferArrs[3] == 6){
                return
        }
        if (onSendSuccessCallBack != undefined) {
          onSendSuccessCallBack(retbuf);
        }
      } else {
        defaultRes.errCode = ERROR_DATA_ERROR;
        defaultRes.errMsg = "接收失败";
        onSendFailCallBack(defaultRes);
      }
      recBuffer = []
      return;
    }
  })
}


/**
 *@desc sync_delay 阻塞
 */
function sync_delay(ms) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, ms);
  });
}


function sync_transCmd(cmd){
  return new Promise((resolve, reject) => {
    transCmd({ data: cmd, success:resolve,fail:reject});
  });
}


/**
 *@desc 收发ble通道数据
 */
function transCmd(data, success, fail, cmdTimeout) {
  if (isConnectionStateChange()!=0) {
    defaultRes.errCode = ERROR_CONNECT_FAIL;
    defaultRes.errMsg = "连接断开，发送失败";
    fail(defaultRes);
  } else {
    //pack
    let cmd = packPkt(data).toUpperCase();
    sendCmd(cmd, success, fail, cmdTimeout);
  }
}



/**
 * @desc  发送指令，不关心指令具体长度,从第一个字节开始
 */
function sendCmd(cmd, successCb, failCb, cmdTimeout) {
  //清空接收buf
  isResponse = false;
  expPktLen = 0;
  expPktNum = 0;
  recBuffer = [];
  sendTimeout = cmdTimeout
  //设置发送超时
  sendTO = setTimeout(function() {
    if (isResponse) {
      return;
    } else {
      failCb.errCode = ERROR_SEND_TIMEOUT;
      failCb.errMsg = "接收超时";
      failCb({
        code : 4000,
        msg :"接收超时"
      })
      onSendSuccessCallBack = undefined;
      onSendFailCallBack = undefined;
      isResponse = true;
      //failCb(defaultRes);
      return
    }
  }, sendTimeout);

  //接收ble返回数据
  onSendSuccessCallBack = successCb;
  onSendFailCallBack = failCb;
  //递归发送
  sendCmds(cmd, 0, failCb);
}

/**
 *
 * @desc 逐条发送指令,小程序不会对写入数据包大小做限制，但系统与蓝牙设备会限制蓝牙4.0单次传输的数据大小，超过最大字节数后会发生写入错误，建议每次写入不超过20字节。
 */
function sendCmds(command, index, onFailCallback) {
  var itemCmd;
  var isLast = false; // 判断是否是最后一条
  if (command.length > index + 40) {
    itemCmd = command.substr(index, 40);
  } else {
    isLast = true;
    itemCmd = command.substr(index);
  }
  writeCommandToBle(itemCmd, function(errMsg) {
      if (errMsg == 'ok' && !isLast) { // 发送成功并且不是最后一条时，执行下一条
        sendCmds(command, index + 40);
      }
    },
    onFailCallback)
}
/**
 *
 * @desc 向蓝牙中写入数据（ble蓝牙）
 */
function writeCommandToBle(commonds, onSendCallback, onFailCallback) {
  var commond = commonds;
  let buffer = hexString2ArrayBuffer(commond);
  // console.log(`发送指令:${arrayBuffer2HexString(buffer)}`);
  // console.log(writeCharacteristic);
  wx.writeBLECharacteristicValue({
    deviceId: currentDevice.deviceId + "",
    serviceId: currentService.uuid + '',
    characteristicId: writeCharacteristic.uuid + '',
    // 这里的value是ArrayBuffer类型
    value: buffer,
    success: function(res) {
      //console.log('发送指令成功')
      // console.log('writeBLECharacteristicValue success', res.errMsg)
      onSendCallback('ok');
    },
    fail: function(res) {
      if (onFailCallback==undefined) return
      onFailCallback({
        msg: "发送指令失败",
        code: 4000
      })
      clearTimeout(sendTO);
    }
  })
}

/**
 * @desc 打包16进制字符帧
 * @return Hex string packet
 */
function packPkt(hexStr) {
  let dataArrayBuf = hexString2ArrayBuffer(hexStr);
  let dataArray = Array.prototype.slice.call(new Uint8Array(dataArrayBuf));
  let pkt = [];
  let buf = [];
  let pktSN = 0;
  let pktNum = Math.ceil(dataArray.length / LENGTH_PER_PACKET);
  let dataLen = 0;
  let offset = 0;

  //console.log('CMD:' + hexStr);
  if (dataArray.length <= 0) {
    console.log('Hex string pack fail:', hexStr);
    return null;
  }
  for (var i = 0; i < pktNum; i++) {
    buf = [];
    //ST:0x33
    buf.push(0x33);
    //SN
    pktSN++;
    buf.push(pktSN);
    //CTL
    if (pktNum > 1) {
      if (i == 0) {
        buf.push(0x80 | (pktNum - 1));
      } else {
        buf.push(pktNum - 1 - i);
      }
    } else {
      buf.push(0);
    }

    //LEN
    if (i == (pktNum - 1)) {
      dataLen = dataArray.length - offset;
    } else {
      dataLen = LENGTH_PER_PACKET;
    }
    buf.push(dataLen);
    //DATA
    buf = buf.concat(dataArray.slice(offset, offset + dataLen));
    offset += dataLen;
    //BCC: xor From SN to Data
    let xor = calXor(buf, 1, buf.length - 1);
    buf.push(xor);
    pkt = pkt.concat(buf);
  }


  let pktArrayBuffer = new Uint8Array(pkt).buffer;
  //console.log('packed cmd:' + arrayBuffer2HexString(pktArrayBuffer));
  //头
  let header = "FE01";
  //命令代码
  let cmdCode = "753100000A0012";
  //发送的数据
  let dataCmd = arrayBuffer2HexString(pktArrayBuffer);
  //发送数据的长度
  let cLen = wxNumberToHexString(dataCmd.length / 2, 1, true);
  //尾
  let footer = "1800";
  //总数据
  let ddd = header + cmdCode + cLen + footer + dataCmd;
 //总长度
   let cmdLen = wxNumberToHexString(ddd.length / 2, 2, true);
  let rCmd1 = header + cmdLen + cmdCode + cLen + arrayBuffer2HexString(pktArrayBuffer) + footer;
  let cmdLen1 = wxNumberToHexString(rCmd1.length / 2, 2, true);
  let rCmd = header + cmdLen1 + cmdCode + cLen + arrayBuffer2HexString(pktArrayBuffer) + footer;
  // return arrayBuffer2HexString(pktArrayBuffer);
  return rCmd;
}

// number转换成指定字节数的hexString
// num：要转换的数(number)    bitNum：转换后的字节数(number)   isBig:是不是大端模式(boolean)
function wxNumberToHexString(num, bitNum, isBig) {
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

/**
 * @desc 解包16进制字符帧
 * @return Hex string data
 */
function unpackPkt(pktArray) {
  let buf = [];
    let pktNum = Math.ceil(pktArray.length / (LENGTH_PER_PACKET + LENGTH_HEADER));
    let dataLen = 0;
    let offset = 0;
    for (var i = 0; i < pktNum; i++) {
      //head
      offset += 3; //skip ST,SN,CTL
      dataLen = pktArray[offset];
      offset++;

      //data
      if (offset + dataLen >= pktArray.length) {
        //Incomplete data
        console.log('unpack length fail');
        return null
      }
      buf = buf.concat(pktArray.slice(offset, offset + dataLen));

      //xor
      var xor = calXor(pktArray, offset - 3, dataLen + 3);
      offset += dataLen;
      if (xor != pktArray[offset]) {
        console.log('unpack fail xor:', xor);
        return null;
      }
      offset++;
    }
    return buf;
}


/**
 * @desc 异或运算
 */
function calXor(dataArray, offset, len) {
  var ret = 0;
  for (var i = 0; i < len; i++) {
    ret ^= dataArray[offset + i];
  }
  return ret;
}
/**
 * ArrayBuffer转16进制字符串
 */
function arrayBuffer2HexString(buf) {
  var out = "";
  var u8a = new Uint8Array(buf);
  var single;
  for (var i = 0; i < u8a.length; i++) {
    single = u8a[i].toString(16)
    while (single.length < 2) single = "0".concat(single);
    out += single;
  }
  return out;
}


/**
 * 1、字符串转换为十六进制
 * 主要使用 charCodeAt()方法，此方法返回一个字符的 Unicode 值，该字符位于指定索引位置。
 */
function stringToHex(str) {
  var val = "";
  for (var i = 0; i < str.length; i++) {
    val += str.charCodeAt(i).toString(16);
  }
  return val;
}

/**
 * 16进制字符串转ArrayBuffer
 */
function hexString2ArrayBuffer(hexStr) {
  var count = hexStr.length / 2;
  let buffer = new ArrayBuffer(count);
  let dataView = new DataView(buffer);
  for (var i = 0; i < count; i++) {
    var curCharCode = parseInt(hexStr.substr(i * 2, 2), 16);
    dataView.setUint8(i, curCharCode);
  }
  return buffer;
}


/**
 * 字符串转为ArrayBuffer对象，参数为字符串
 */
function string2ArrayBuffer(str) {
  var buf = new ArrayBuffer(str.length * 2); // 每个字符占用2个字节
  var bufView = new Uint8Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function isArray(arr) {
  return Object.prototype.toString.call(arr) === '[object Array]';
};

function strToByte(str) {
  var tmp = str.split(''),
    arr = [];
  for (var i = 0, c = tmp.length; i < c; i++) {
    var j = encodeURI(tmp[i]);
    if (j.length == 1) {
      arr.push(j.charCodeAt());
    } else {
      var b = j.split('%');
      for (var m = 1; m < b.length; m++) {
        arr.push(parseInt('0x' + b[m]));
      }
    }
  }
  return arr;
};

function convertChinese(str) {
  var tmp = str.split(''),
    arr = [];
  for (var i = 0, c = tmp.length; i < c; i++) {
    var s = tmp[i].charCodeAt();
    if (s <= 0 || s >= 127) {
      arr.push(s.toString(16));
    } else {
      arr.push(tmp[i]);
    }
  }
  return arr;
};

function filterChinese(str) {
  var tmp = str.split(''),
    arr = [];
  for (var i = 0, c = tmp.length; i < c; i++) {
    var s = tmp[i].charCodeAt();
    if (s > 0 && s < 127) {
      arr.push(tmp[i]);
    }
  }
  return arr;
};

function strToHex(hex, isFilterChinese) {
  hex = isFilterChinese ? filterChinese(hex).join('') : convertChinese(hex).join('');

  //清除所有空格
  hex = hex.replace(/\s/g, "");
  //若字符个数为奇数，补一个空格
  hex += hex.length % 2 != 0 ? " " : "";

  var c = hex.length / 2,
    arr = [];
  for (var i = 0; i < c; i++) {
    arr.push(parseInt(hex.substr(i * 2, 2), 16));
  }
  return arr;
};

function padLeft(s, w, pc) {
  if (pc == undefined) {
    pc = '0';
  }
  for (var i = 0, c = w - s.length; i < c; i++) {
    s = pc + s;
  }
  return s;
};

function toString(arr, isReverse) {
  if (typeof isReverse == 'undefined') {
    isReverse = true;
  }
  var hi = arr[0],
    lo = arr[1];
  return padLeft((isReverse ? hi + lo * 0x100 : hi * 0x100 + lo).toString(16).toUpperCase(), 4, '0');
};


/**
 * 16进制字符串异或处理
 *
 * @param str1
 * @param str2
 * @return
 */
function stringXor(str1, str2) {
  if (!str1 && !str2) {
    return "";
  }
  if (!str1 && str2) {
    return str2;
  }
  if (str1 && !str2) {
    return str1;
  }
  var longStr;
  var shortStr;
  if (str1.length >= str2.length) {
    longStr = str1;
    shortStr = str2;
  } else {
    longStr = str2;
    shortStr = str1;
  }
  var count = parseInt(shortStr.length / 2);
  var leftCount = longStr.length - shortStr.length;
  var resultStr = "";
  if (leftCount > 0) {
    resultStr += longStr.substr(0, leftCount);
  }
  for (var i = 0; i < count; i++) {
    var shortCharCode = parseInt(shortStr.substr(i * 2, 2), 16);
    var longCharCode = parseInt(longStr.substr(leftCount + i * 2, 2), 16);
    var resultCode = shortCharCode ^ longCharCode;
    var single = resultCode.toString(16);
    while (single.length < 2) single = "0".concat(single);
    resultStr += single;
  }
  return resultStr.toUpperCase();
}


/**
 * 指令两个16进制字符串异或处理
 *
 * @param command
 * @param secretKey
 * @return
 */
function getSecretEncoding(command, secretKey) {
  if (!command || !secretKey) {
    return "";
  }
  var secretLength = secretKey.length;
  var length = parseInt(command.length / secretLength);
  console.log(`command(${command.length})/secretLength(${secretLength}) = ${length}`);
  var resultCmd = "";
  console.log(`secretKey(${secretKey.length}):${secretKey}`);
  for (var i = 0; i < length; i++) {
    var part = command.substr(i * secretLength, secretLength);
    resultCmd += stringXor(part, secretKey);
    console.log(`part${i}:${stringXor(part, secretKey)}`);
  }
  var lastLen = command.length % secretLength;
  if (lastLen > 0) {
    console.log(`lastCMD:${command.substr(command.length - lastLen, lastLen)}`);
    console.log(`lastSecretKey:${secretKey.substr(0, lastLen)}`);
    var lastPart = command.substr(command.length - lastLen, lastLen);
    var lastCmd = stringXor(lastPart, secretKey.substr(0, lastLen));
    resultCmd += lastCmd;
    console.log(`lastPart:${lastCmd}`);
  }
  return resultCmd;
}
/**
 * 2、十六进制转换为字符串
 *主要使用 fromCharCode()方法，此方法将 Unicode 码转换为与之对应的字符。
 */
function hexToString(str) {
  var val = "";
  var arr = str.split(",");
  for (var i = 0; i < arr.length; i++) {
    val += arr[i].fromCharCode(i);

  }
  return val;
}

/**
 * 获取随机长度16进制字符串
 */
function getRamNumber(length) {
  var result = '';
  for (var i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 16).toString(16); //获取0-15并通过toString转16进制
  }
  //默认字母小写，手动转大写
  return result.toUpperCase(); //另toLowerCase()转小写
}


/**
 * 得到BCD码时间字符串
 *
 * @param datetime
 * @return
 */
function getBCDTime(datetime, needWeek) {
  if (typeof datetime == 'undefined') {
    datetime = new Date();
  }
  if (typeof needWeek == 'undefined') {
    needWeek = true;
  }
  var year = datetime.getFullYear() - 2000; //获取年份,从2000年开始计算
  if (year < 0) year = 0; // 不允许小于2000年的年份出现
  var month = datetime.getMonth() + 1; //获取月份 0-11 所以需要加1
  var day = datetime.getDate(); //获取日
  var hour = datetime.getHours(); //小时
  var minute = datetime.getMinutes(); //分
  var second = datetime.getSeconds(); //秒
  if (needWeek) {
    var dayOfWeek = datetime.getDay(); //一周的第几天 0-6
    return formatNumber(year) + formatNumber(month) + formatNumber(day) + formatNumber(dayOfWeek) +
      formatNumber(hour) + formatNumber(minute) + formatNumber(second); // 得到BCD码的时间字符串
  } else {
    return formatNumber(year) + formatNumber(month) + formatNumber(day) +
      formatNumber(hour) + formatNumber(minute) + formatNumber(second); // 得到BCD码的时间字符串
  }
}

function formatNumber(n) {
  n = n.toString()
  return (n[1] ? n : '0' + n) + "";
}



/**
 * 判断一个字符串是否包含子串
 */
function isContains(str, substr) {

  var strUp = str.toUpperCase();
  var substrUp = substr.toUpperCase()

  return new RegExp(substrUp).test(strUp);
}

/**
 * 去除字符串中特定的字符
 */


function removeBytes(str, substr) {
  var items = str.split(substr)
  // 会得到一个数组，数组中包括利用o分割后的多个字符串（不包括o）
  var newStr = items.join("");
  return newStr
  // }
}


//十六进制字符串转字节数组
function hexStr2Bytes(str) {
  var pos = 0;
  var len = str.length;
  if (len % 2 != 0) {
    return null;
  }
  len /= 2;
  var hexA = new Array();
  for (var i = 0; i < len; i++) {
    var s = str.substr(pos, 2);
    var v = parseInt(s, 16);
    hexA.push(v);
    pos += 2;
  }
  return hexA;
}

//字节数组转十六进制字符串
function bytes2HexStr(arr) {
  var str = "";
  for (var i = 0; i < arr.length; i++) {
    var tmp = arr[i].toString(16);
    if (tmp.length == 1) {
      tmp = "0" + tmp;
    }
    str += tmp;
  }
  return str;
}

function bye2to(byte){
  if (byte[2]!=129){
    //console.log("第二包", arrayBuffer2HexString(byte))
    byte.splice(0,4)
    dataArrayTopacg = dataArrayTopacg.concat(byte.slice(0));
    dataArrayTopacg.splice(3, 1, dataArrayTopacg.length-7);
    //console.log("第二包", arrayBuffer2HexString(byte), dataArrayTopacg)
    let retbuf = unpackPktTo(dataArrayTopacg)
    return retbuf
  }else{
    dataArrayTopacg = []
    byte.splice(byte.length - 3, byte.length)
    dataArrayTopacg = dataArrayTopacg.concat(byte.slice(0));
  }


  /**
  * @desc 解包16进制字符帧
  * @return Hex string data
  */
  function unpackPktTo(pktArray) {
    pktArray.splice(0, 4)
    pktArray.splice(pktArray.length - 3, pktArray.length)
    return pktArray

  }
}

