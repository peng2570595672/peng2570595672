const mServiceId = '0000FEE7-0000-1000-8000-00805F9B34FB';
const mWriteUUID = '0000FEC7-0000-1000-8000-00805F9B34FB';
const mReadUUID = '0000FEC7-0000-1000-8000-00805F9B34FB';
const mNotifyUUID = '0000FEC8-0000-1000-8000-00805F9B34FB';
const mActiviceReadUUID = '0000FEC9-0000-1000-8000-00805F9B34FB';
const WECHAT_PRO_HEAD_MAGIC_NUMBER = 0xFE;
const WECHAT_PRO_HEAD_PACK_VERSION = 0x01;
const WECHAT_CMD_ECI_REQ_AUTH = 0x2711; //握手数据（设备--->手机）
const WECHAT_CMD_ECI_REQ_SEND_DATA = 0x2712;
const WECHAT_CMD_ECI_REQ_INIT = 0x2713; //初始化 (设备--->手机)
const WECHAT_CMD_ECI_RESP_AUTH = 0x4E21; //握手数据 （手机--->设备）
const WECHAT_CMD_ECI_RESP_INIT = 0x4E23; //初始化 (手机--->设备)
const WECHAT_CMD_ECI_PUSH_RECV_DATA = 0x7531; //发送指令数据(手机--->设备)
const ETC_PRO_SINGLE_PACK_SIZE = 105; /* ETC–≠“È∑÷∞¸≥§∂» */
const BLE_CTL_START_BIT = 0x80; //分包后，此包是否为起始包
const BLE_ETC_PRO_HEAD_ST = 0x33; /* ETC（33协议头标识） */
const MAX_WECHAT_SEND_LEN = 255;
const MAX_BLE_SIZE = 20;
const KYunNanObuMultiplePackages = 1;

let mDeviceId = 0;
let service = {}; //服务
let writeCharVal = {}; //写入特征值
let readCharVal = {}; //读取特征值
let notifyCharVal = {}; //通知特征值
let activiceReadCharVal = {}; //读取特征值
let mPacketLen = 0;
let mRecvDataCache = [];
let mUnpacketDataCache = [];
let mIsInitCmdSend = false;
let mEtcRawData = [];
let mEtcRawDataLen = 0;
let maxLenPerPacket = 0;
let mReturnedRawCmdData = [];
let mAbCmdBuf = [];
let mnCmdBufLen = 0;
let mTransData = [];
let mSingleEtcProtoData = [];
let mLenBuf = [];
let mBytesNumOfDataLen = 0;
let receiveDataCallBack = null;
let m_isConn = false;
let mCurrentPacketNum = 0;
let mConnCount = 2;
let beginTime = 0;
let mCmdTimeout = 0
let mIsRecv = false;
let mIsSendTap = false;

/**
 通过蓝牙，连接OBU设备

 @param device 需要连接的蓝牙外围设备
 @param callBack：结果回调。
 @param connectTimeout(number)：连接超时时间，单位毫秒(超过该时间，
        终止连接操作，回调fail，code 为2002)。
 */
function connectAndInit(device, callBack, connectTimeout) {
  beginTime = +new Date();
  let deviceId = device.deviceId
  // if (m_isConn && mDeviceId == deviceId) {
  //   return;
  // }
  // if (mDeviceId == 0) {
    conn(device, callBack, connectTimeout)
  // } else {
  //   wx.closeBLEConnection({
  //     deviceId: mDeviceId,
  //     complete: function(e) {
  //       conn(device, callBack, connectTimeout)
  //     }
  //   })
  // }
}

function conn(device, callBack, connectTimeout) {
  let deviceId = device.deviceId
  wx.createBLEConnection({
    deviceId: deviceId,
    timeout: connectTimeout,
    success: function(res) {
      mDeviceId = deviceId;
      wx.getBLEDeviceServices({
        deviceId: deviceId,
        success: function(res) {
          var isExistsService = false
          for (var i = 0; i < res.services.length; i++) {
            if (res.services[i].uuid == mServiceId) {
              service: res.services[i]
              isExistsService = true;
              break;
            }
          }
          if (isExistsService) {
            wx.getBLEDeviceCharacteristics({
              deviceId: deviceId,
              serviceId: mServiceId,
              success: function(res) {
                for (var i = 0; i < res.characteristics.length; i++) {
                  if (res.characteristics[i].uuid == mWriteUUID) {
                    writeCharVal: res.characteristics[i]
                  }
                  if (res.characteristics[i].uuid == mReadUUID) {
                    readCharVal: res.characteristics[i]
                  }
                  if (res.characteristics[i].uuid == mNotifyUUID) {
                    notifyCharVal: res.characteristics[i]
                  }
                  if (res.characteristics[i].uuid == mActiviceReadUUID) {
                    activiceReadCharVal: res.characteristics[i]
                  }
                }

                wx.onBLEConnectionStateChange(function(res) {
                  // 该方法回调中可以用于处理连接意外断开等异常情况
                  console.log('改变onBLEConnectionStateChange');
                  if (res.connected) {
                    console.log('connected true')
                    m_isConn = true;
                  } else {
                    console.log('connected false')
                    var endTime = +new Date();
                    if ((endTime - beginTime) >= 3000) {
                      mIsInitCmdSend = false;
                      m_isConn = false;
                    }
                  }
                })

                wx.notifyBLECharacteristicValueChange({
                  deviceId: deviceId,
                  serviceId: mServiceId,
                  characteristicId: mNotifyUUID,
                  state: true,
                  success: function(res) {
                    wx.onBLECharacteristicValueChange(function(res) {
                      console.log('收到数据:' + ab2hex(res.value))
                      let pRead = ab2DecArr(res.value)
                      if (pRead.length > 0 && pRead != null) {
                        if (pRead[0] == WECHAT_PRO_HEAD_MAGIC_NUMBER &&
                          pRead[1] == WECHAT_PRO_HEAD_PACK_VERSION) {
                          mPacketLen = (pRead[2] << 8) | pRead[3];
                        }

                        mRecvDataCache.push.apply(mRecvDataCache, pRead)
                        if (mRecvDataCache.length == mPacketLen) {
                          let pData = mRecvDataCache
                          let nCmdID = (pData[4] << 8) | pData[5]

                          switch (nCmdID) {
                            case WECHAT_CMD_ECI_REQ_AUTH:
                              {
                                console.log('WECHAT_CMD_ECI_REQ_AUTH')
                                let data = makeHandShakeStep1WithETC()
                                mRecvDataCache = []

                                write(data)
                              }
                              break;
                            case WECHAT_CMD_ECI_REQ_INIT:
                              {
                                console.log('WECHAT_CMD_ECI_REQ_INIT')
                                let data = makeHandShakeStep2WithETC()
                                write(data)

                                setTimeout(function() {
                                  let dataInit = makeInitWithETC()
                                  mRecvDataCache = []
                                  write(dataInit)
                                  mIsInitCmdSend = true
                                }, 20)
                              }
                              break;
                            case WECHAT_CMD_ECI_REQ_SEND_DATA:
                              {
                                console.log('WECHAT_CMD_ECI_REQ_SEND_DATA')
                                if (mIsInitCmdSend) {
                                  console.log('连接成功,握手成功')
                                  m_isConn = true
                                  callBack.success(makeRes(1000, '连接成功,握手成功'))
                                  mIsInitCmdSend = false
                                } else {
                                  mIsRecv = true
                                }

                                mEtcRawData = []
                                mEtcRawDataLen = 0
                                let op = unpaketProto(mRecvDataCache)
                                if (!op) {
                                  if (mEtcRawData[0] == 0xB2) {
                                    maxLenPerPacket = mEtcRawData[3];
                                  } else {
                                    mUnpacketDataCache.push.apply(mUnpacketDataCache, mEtcRawData)
                                    console.log('******返回未解析的指令数据包为(' + mUnpacketDataCache.length + '):' + ab2hexArr(mUnpacketDataCache))

                                    if (mCurrentPacketNum == 0) {
                                      mReturnedRawCmdData = []
                                      let errorcode = unpackXXCmdPacket(mUnpacketDataCache)
                                      console.log('******解析后的指令数据为(' + mReturnedRawCmdData.length + '):' + mReturnedRawCmdData)
                                      if (receiveDataCallBack) {
                                        if (errorcode == 0) {
                                          receiveDataCallBack.success(makeRes(1000, '数据透传成功', mReturnedRawCmdData))
                                        } else {
                                          receiveDataCallBack.fail(makeRes(4000, '数据透传失败'))
                                        }
                                      }
                                      mUnpacketDataCache = []
                                    }
                                  }
                                } else {
                                  mUnpacketDataCache.push.apply(mUnpacketDataCache, mEtcRawData)
                                }
                                mRecvDataCache = []
                              }
                              break;
                            default:
                              break;
                          }
                        }
                      }
                    })
                  },
                  fail: function(e) {
                    console.log('notifyBLECharacteristicValueChange fail')
                    callBack.fail(makeRes(4000, '连接失败'))
                  }
                })
              },
              fail: function(res) {
                console.log('getBLEDeviceCharacteristics fail')
                callBack.fail(makeRes(4000, '连接失败'))
              }
            })
          }
        },
        fail: function(res) {
          callBack.fail(makeRes(4000, '连接失败'))
        }
      })
    },
    fail: function(res) {
      // console.log('createBLEConnection fail')
      // if (mConnCount > 0) {
      //   console.log(mConnCount)
      //   mConnCount--
      //   connectDevice(device, callback_1, callback_2)
      // } else {
      //   console.log(mConnCount)
      //   mConnCount = 2
      //   m_isConn = false;
      //   callback_1(-1, [] , '连接失败')
      // }
      callBack.fail(makeRes(2002, '连接超时'))
    }
  })
}

//断开与OBU设备的蓝牙连接
function disConnect(callBack) {
  if (!m_isConn) {
    return;
  }

  let data = makeDisconnectWithETC();
  mIsInitCmdSend = false;
  mRecvDataCache = []
  write(data)

  wx.closeBLEConnection({
    deviceId: mDeviceId,
    success: function(res) {
      m_isConn = false;
      callBack.success(makeRes(1000, '断开连接成功'))
    },
    fail: function(e) {
      console.log('error:' + e.errMsg)
      callBack.fail(makeRes(4000, '断开连接失败'))
    }
  })
}

/**
 数据透传

 @param type： 0(number):ICC 指令，1(number):ESAM 指令
 @param cmd：16 进制字符串指令数组。
 @param callBack：结果回调。
 @param cmdTimeout(number)：指令超时时间。超过时间回调fail，code
    为2000。

 */
function sendAndReceive(type, cmd, callBack, cmdTimeout) {
  if (callBack) {
    receiveDataCallBack = callBack;
  }

  if (!m_isConn) {
    receiveDataCallBack.fail(makeRes(4000, '连接失败'))
    return;
  }

  if (!mIsRecv && mIsSendTap){
    console.log('重复点击')
    return;
  }
  mIsSendTap = true;
  mIsRecv = false;

  setTimeout(function () {
    console.log('setTimeout')
    console.log('mIsRecv:' + mIsRecv)
    if (!mIsRecv) {
      receiveDataCallBack.fail(makeRes(2000, '发送指令超时'))
      receiveDataCallBack = null
    }
    mIsSendTap = false;
  }, cmdTimeout)

  let cmdType = 0;
  if (type == '0') {
    cmdType = 0xA3;
  } else if (type == '1') {
    cmdType = 0xA7;
  }

  let totalMutableData = []
  for (var i = 0; i < cmd.length; i++) {
    let obj = str2Bytes(cmd[i]);
    console.log('##### cmd_:' + ab2hexArr(obj))
    let oneData = makeMutiPackageData(obj, i + 1)
    console.log('##### oneData:' + ab2hexArr(oneData))
    totalMutableData.push.apply(totalMutableData, oneData);
  }
  console.log('totalMutableData:' + ab2hexArr(totalMutableData))
  let totalChar = totalMutableData;
  let pbChar = [];
  pbChar[0] = 0x80;
  let index = 0;
  if (totalMutableData.length < 0x80) {
    pbChar[1] = totalMutableData.length;
    index += 1;
  } else if (totalMutableData.length > 0x80 && totalMutableData.length <= 0xFF) {
    pbChar[1] = 0x81;
    pbChar[2] = totalMutableData.length;
    index += 2;
  } else {
    pbChar[1] = 0x82;
    pbChar[2] = (totalMutableData.length >> 8) & 0xFF00;
    pbChar[3] = totalMutableData.length & 0x00FF;
    index += 3;
  }
  
  pbChar.push.apply(pbChar, totalChar);
  let reallyData = pbChar;
  console.log('reallyData:' + ab2hexArr(reallyData))

  mTransData = []
  if (!makeXXCmdPacket(cmdType, reallyData)) {
    subReqDataAndMakeEtcProtoPacket(mTransData)
  }
}

function makeMutiPackageData(xxCmdData, dataIndex) {
  let index = 0;
  let cmdDataLen = xxCmdData.length;
  let cmdPacketDataLen = cmdDataLen + 12;
  let pbData = []
  pbData[index++] = dataIndex; //1
  pbData[index++] = cmdDataLen;  //Len  单tpdu指令长度
  pbData.push.apply(pbData, xxCmdData);
  index += cmdDataLen;

  return pbData;
}

function subReqDataAndMakeEtcProtoPacket(etcProtoData) {
  let hr = 0;
  let totalDataLen = etcProtoData.length;
  console.log('**** maxLenPerPacket:' + maxLenPerPacket)
  let blockSize = maxLenPerPacket;
  let offset = 0
  if (blockSize == undefined) {
    blockSize = 100
  }

  let YuShu = totalDataLen % blockSize;

  let PackNumOffset = 0;
  let PackNum = (YuShu == 0) ? (totalDataLen / blockSize) : (parseInt(totalDataLen / blockSize) + 1);
  let LastPackSize = (YuShu == 0) ? ETC_PRO_SINGLE_PACK_SIZE : YuShu;

  let pSendBuf = etcProtoData;
  let sendBuff = [];
  mSingleEtcProtoData = [];

  let _pack = {}
  _pack.perPackSize = blockSize
  _pack.finalPackSize = LastPackSize
  _pack.packNum = PackNum

  if (totalDataLen > blockSize) {
    for (; offset < (totalDataLen - blockSize); offset += blockSize) {
      _pack.packNumOffset = PackNumOffset;
      sendBuff.push.apply(sendBuff, pSendBuf.slice(offset, offset + blockSize))
      hr = makeSingleEtcProtocolPaket(sendBuff, _pack)
      if (hr != 0) {
        return hr;
      }
      PackNumOffset++;
      hr = tranmitBleBlock()
      if (hr != 0) {
        return hr;
      }
      sendBuff = []
    }
  }
  _pack.packNumOffset = PackNumOffset;

  sendBuff.push.apply(sendBuff, pSendBuf.slice(offset, totalDataLen))
  let data = sendBuff.slice(0, totalDataLen - offset)
  hr = makeSingleEtcProtocolPaket(data, _pack)
  if (hr != 0) {
    return hr;
  }

  console.log('tranmitBleBlock（' + mSingleEtcProtoData.length + '）:' + ab2hexArr(mSingleEtcProtoData))
  return tranmitBleBlock()
}

function makeSingleEtcProtocolPaket(ectCmdRawData, sPack) {
  let SendCTL = sPack.packNum - sPack.packNumOffset - 1;
  let IsLastPack = ((sPack.packNumOffset + 1) == sPack.packNum) ? 1 : 0;
  let DataLen = 0;
  let SendLen = 0;

  let etcCmdRawDataLen = ectCmdRawData.length;
  let etcCmdRawBufLen = etcCmdRawDataLen + 5;
  let etcCmdRawBuf = [];
  SendCTL = (sPack.packNumOffset == 0) ? (BLE_CTL_START_BIT | SendCTL) : SendCTL;

  DataLen = IsLastPack ? sPack.finalPackSize : sPack.perPackSize; //ETC_PRO_SINGLE_PACK_SIZE;

  /* 33协议组包*/
  etcCmdRawBuf[SendLen++] = BLE_ETC_PRO_HEAD_ST; //ST
  etcCmdRawBuf[SendLen++] = 0x00; //sPack.packNumOffset+1;//0x00;
  etcCmdRawBuf[SendLen++] = SendCTL; //CTL
  etcCmdRawBuf[SendLen++] = etcCmdRawDataLen; //LEN
  etcCmdRawBuf.push.apply(etcCmdRawBuf, ectCmdRawData);
  SendLen += ectCmdRawData.length;
  etcCmdRawBuf[SendLen++] = XorVerify(etcCmdRawBuf.slice(1), (ectCmdRawData.length + 3)); //BCC校验，从SN到DATA

  console.log('*****makeSingleEtcPacket : ' + ab2hexArr(etcCmdRawBuf))
  return makeSingleProtoPacket(etcCmdRawBuf)
}

function XorVerify(buf, len) {
  let TempVerify = 0x00;
  let i = 0;
  for (i = 0; i < len; i++) {
    TempVerify ^= buf[i];
  }
  return TempVerify
}

function AppSetVarints(inValue) {
  if (inValue < 128) {
    mLenBuf[0] = inValue;
    mBytesNumOfDataLen = 1;
  } else {
    mLenBuf[0] = (inValue & 0x7F) | 0x80;
    mLenBuf[1] = (inValue >> 7) & 0x7F;
    mBytesNumOfDataLen = 2;
  }
}

function makeSingleProtoPacket(etcEnclosurBuf) {
  let index = 0;
  let ManufactoryDefineKeyValue = 0; //厂商自定义数据长度，根据不同值设置不同数据

  let sDataLen = etcEnclosurBuf.length;
  if (sDataLen == 0 || sDataLen > (MAX_WECHAT_SEND_LEN - 12)) {
    console.log('[ERROR] Wechat send len error, return!')
    return 1;
  }
  mLenBuf = []
  mBytesNumOfDataLen = 0;
  AppSetVarints(sDataLen)
  let protoBufLen = sDataLen + 11 + mBytesNumOfDataLen + ManufactoryDefineKeyValue;
  let protoBuf = [];

  protoBuf[index++] = WECHAT_PRO_HEAD_MAGIC_NUMBER;
  protoBuf[index++] = WECHAT_PRO_HEAD_PACK_VERSION;
  protoBuf[index++] = (protoBufLen >> 8) & 0xff;
  protoBuf[index++] = (protoBufLen) & 0xff;
  protoBuf[index++] = (WECHAT_CMD_ECI_PUSH_RECV_DATA >> 8) & 0xff;
  protoBuf[index++] = (WECHAT_CMD_ECI_PUSH_RECV_DATA) & 0xff;
  protoBuf[index++] = 0x00;
  protoBuf[index++] = 0x00;

  /* 变长包体，key1-value1 - key2-value2 - key3-value3... ,value=len+data 具体可参考protobuf协议*/
  protoBuf[index++] = 0x0A; //可认为固定值
  protoBuf[index++] = 0x00;

  protoBuf[index++] = 0x12; //data域key值;
  protoBuf[index++] = mLenBuf[0]; //data域lenth
  if (mBytesNumOfDataLen == 2) {
    protoBuf[index++] = mLenBuf[1];
  }
  protoBuf.push.apply(protoBuf, etcEnclosurBuf)
  index += sDataLen;

  if (ManufactoryDefineKeyValue == 2) //暂时未用到
  {
    protoBuf[index++] = 0x18;
    protoBuf[index++] = 0x00;
  }

  if (ManufactoryDefineKeyValue == 3) //暂时未用到
  {
    protoBuf[index++] = 0x18;
    protoBuf[index++] = 0x91;
    protoBuf[index++] = 0x4e;
  }
  mSingleEtcProtoData = []
  mSingleEtcProtoData.push.apply(mSingleEtcProtoData, protoBuf.slice(0, index))
  console.log('*****makeSingleProtoPacket : ' + ab2hexArr(mSingleEtcProtoData))
  return 0;
}

function tranmitBleBlock() {
  let totalDataLen = mSingleEtcProtoData.length;
  let blockSize = MAX_BLE_SIZE;
  let offset = 0;
  if (blockSize <= 0) {
    return 1;
  }

  let pSendBuf = mSingleEtcProtoData;
  let sendBuff = [];
  if (totalDataLen > blockSize) {
    for (; offset < totalDataLen - blockSize; offset += blockSize) {
      sendBuff.push.apply(sendBuff, pSendBuf.slice(offset, blockSize + offset))
      let data = sendBuff.slice(0, blockSize)

      console.log('tranmitBleBlock part:(' + blockSize + '),data:' + ab2hexArr(data))
      writeData(data)
      sendBuff = []
    }
  }

  sendBuff.push.apply(sendBuff, pSendBuf.slice(offset, totalDataLen))
  let data = sendBuff.slice(0, totalDataLen - offset)
  console.log('tranmitBleBlock part:(' + (totalDataLen - offset) + '),data:' + ab2hexArr(data))
  writeData(data)
  return 0;
}

function write(arrayBuffer) {
  wx.writeBLECharacteristicValue({
    deviceId: mDeviceId,
    serviceId: mServiceId,
    characteristicId: mWriteUUID,
    value: arrayBuffer,
    success: function(res) {
      console.log('发送成功')
    },
    fail: function(e) {}
  })
}

function writeData(data) {
  let arrayBuffer = new Uint8Array(data).buffer;
  wx.writeBLECharacteristicValue({
    deviceId: mDeviceId,
    serviceId: mServiceId,
    characteristicId: mWriteUUID,
    value: arrayBuffer,
    success: function(res) {
      console.log('发送成功')
    },
  })
}

function ab2hex(buffer) {
  let hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function(bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr.join('');
}

function ab2DecArr(buffer) {
  return new Uint8Array(buffer);
}

function ab2hexArr(arr) {
  let hexArr = Array.prototype.map.call(
    arr,
    function(bit) {
      return ('00' + bit.toString(16)).slice(-2)
    }
  )
  return hexArr;
}

function makeHandShakeStep1WithETC() {
  let cBuff = []
  let index = 0
  cBuff[index++] = 0xFE;
  cBuff[index++] = 0x01;
  cBuff[index++] = 0x00;
  cBuff[index++] = 0x0E;
  cBuff[index++] = 0x4E;
  cBuff[index++] = 0x21;
  cBuff[index++] = 0x00;
  cBuff[index++] = 0x01;
  cBuff[index++] = 0x0A;
  cBuff[index++] = 0x02;
  cBuff[index++] = 0x08;
  cBuff[index++] = 0x00;
  cBuff[index++] = 0x12;
  cBuff[index] = 0x00;
  return new Uint8Array(cBuff).buffer;
}

function makeHandShakeStep2WithETC() {
  let cBuff = []
  let index = 0
  cBuff[index++] = 0xFE;
  cBuff[index++] = 0x01;
  cBuff[index++] = 0x00;
  cBuff[index++] = 0x13;
  cBuff[index++] = 0x4E;
  cBuff[index++] = 0x23;
  cBuff[index++] = 0x00;
  cBuff[index++] = 0x02;
  cBuff[index++] = 0x0A;
  cBuff[index++] = 0x02;
  cBuff[index++] = 0x08;
  cBuff[index++] = 0x00;
  cBuff[index++] = 0x10;
  cBuff[index++] = 0xB4;
  cBuff[index++] = 0x24;
  cBuff[index++] = 0x18;
  cBuff[index++] = 0xF8;
  cBuff[index++] = 0xAC;
  cBuff[index] = 0x01;
  return new Uint8Array(cBuff).buffer;
}

function makeInitWithETC() {
  let cBuff = []
  let index = 0
  cBuff[index++] = 0xFE;
  cBuff[index++] = 0x01;
  cBuff[index++] = 0x00;
  cBuff[index++] = 0x14;
  cBuff[index++] = 0x75;
  cBuff[index++] = 0x31;
  cBuff[index++] = 0x00;
  cBuff[index++] = 0x02;
  cBuff[index++] = 0x0A;
  cBuff[index++] = 0x00;
  cBuff[index++] = 0x12;
  cBuff[index++] = 0x06;
  cBuff[index++] = 0x33;
  cBuff[index++] = 0x0A;
  cBuff[index++] = 0x80;
  cBuff[index++] = 0x01;
  cBuff[index++] = 0xA2;
  cBuff[index++] = 0x29;
  cBuff[index++] = 0x18;
  cBuff[index] = 0x00;
  return new Uint8Array(cBuff).buffer;
}

function makeDisconnectWithETC() {
  let cBuff = []
  let index = 0
  cBuff[index++] = 0xFE;
  cBuff[index++] = 0x01;
  cBuff[index++] = 0x00;
  cBuff[index++] = 0x14;
  cBuff[index++] = 0x75;
  cBuff[index++] = 0x31;
  cBuff[index++] = 0x00;
  cBuff[index++] = 0x02;
  cBuff[index++] = 0x0A;
  cBuff[index++] = 0x00;
  cBuff[index++] = 0x12;
  cBuff[index++] = 0x06;
  cBuff[index++] = 0x33;
  cBuff[index++] = 0x0A;
  cBuff[index++] = 0x80;
  cBuff[index++] = 0x01;
  cBuff[index++] = 0xAE;
  cBuff[index] = 0x25;
  return new Uint8Array(cBuff).buffer;
}

function unpaketProto(recvDataCache) {
  let data = recvDataCache.slice(12)
  let dataLen = recvDataCache[13]

  let st = data[0];
  let ctl = data[2];
  let dataLet = data[3];
  let ndata = data.slice(4);
  let StartPackFlag = ((ctl & 0x80) > 0) ? true : false
  let CurrentPackNum = ctl & 0x7F;
  mCurrentPacketNum = CurrentPackNum;

  let operatorStatus = 0;
  if (st != 0x33) {
    return -1;
    console.log('[ERROR] The received data head ST is not right!')
  }

  if (StartPackFlag) {
    operatorStatus = 1;
  }

  mEtcRawData = ndata.slice(0, dataLen - 1)
  mEtcRawDataLen = dataLen
  return operatorStatus & CurrentPackNum;
}

function unpaketProto_1(recvDataCache) {
  console.log('***** recvDataCache:' + ab2hexArr(recvDataCache))
  let data = recvDataCache.slice(12)
  let dataLen = recvDataCache[13]

  let st = data[0];
  let ctl = data[2];
  let dataLet = data[3];
  let ndata = data.slice(4);
  let StartPackFlag = ((ctl & 0x80) > 0) ? true : false
  let CurrentPackNum = ctl & 0x7F;

  let operatorStatus = 0;
  if (st != 0x33) {
    return -1;
    console.log('[ERROR] The received data head ST is not right!')
  }

  if (StartPackFlag) {
    operatorStatus = 1;
  }

  mAbCmdBuf = ndata.slice(0, dataLen - 1)
  mnCmdBufLen = dataLen
  return operatorStatus & CurrentPackNum;
}

function unpackXXCmdPacket(recvDataCache) {
  mAbCmdBuf = recvDataCache;
  mnCmdBufLen = 0
  // unpaketProto_1(recvDataCache)
  // let cmdStatus = mAbCmdBuf[1];
  // if (cmdStatus != 0) {
  //   return 4;
  // }

  let abCmdTLVLen = (mAbCmdBuf[4] << 8) + mAbCmdBuf[3];
  if (abCmdTLVLen <= 0) {
    receiveDataCallBack.fail(makeRes(4000, '未插卡'))
    return
  }

  console.log('mAbCmdBuf[4]' + mAbCmdBuf[4] + ',mAbCmdBuf[3]:' + mAbCmdBuf[3])
  console.log('mAbCmdBuf:' + ab2hexArr(mAbCmdBuf))

  let abCmdTLVBuf = mAbCmdBuf.slice(5, abCmdTLVLen + 5)

  console.log('abCmdTLVLen' + abCmdTLVLen)
  console.log('abCmdTLVBuf:' + ab2hexArr(abCmdTLVBuf))
  if (((mAbCmdBuf[0] == 0xB2) && mAbCmdBuf[1] == 0x00)
    || ((mAbCmdBuf[0] == 0xB3) && mAbCmdBuf[1] == 0x00)
    || ((mAbCmdBuf[0] == 0xB7) && mAbCmdBuf[1] == 0x00)) {
    let responseCmdByte = 0;
    let responsePacketLen = (mAbCmdBuf[4] << 8) + mAbCmdBuf[3] - 2; //-2 标识后面纯指令返回数据
    if (responsePacketLen < 0x80)
      responseCmdByte = 1;
    else if ((responsePacketLen >= 0x80) && responsePacketLen <= 0xFF)
      responseCmdByte = 2;
    else
      responseCmdByte = 3;

    let partDataLen = 0;
    let abTempBuf = [], abTempPartBuf = []
    abTempBuf.push.apply(abTempBuf, mAbCmdBuf.slice(5 + 1 + responseCmdByte, responsePacketLen + 5 + 1 + responseCmdByte))
    for (let index = 0; index < responsePacketLen - 1;) {
      index += 1;
      partDataLen = abTempBuf[index]
      abTempPartBuf.push.apply(abTempPartBuf, abTempBuf.slice(index + 1, partDataLen + index + 1))
      mReturnedRawCmdData.push(bytes2Str(abTempPartBuf))
      index = index + partDataLen + 1; //  1标识一个字节长度，partDataLen数据长度
      abTempPartBuf = []
    }
  } else {
    return 5;
  }
  return 0;
}

function makeXXCmdPacket(cmdType, reqData) {
  let index = 0;
  let cmdDataLen = reqData.length
  let cmdPacketDataLen = cmdDataLen + 10;
  let pbData = [];

  if (KYunNanObuMultiplePackages == 0) {
    pbData[index++] = ((cmdType == 0xA3) ? cmdType : 0xA7); // PICC 通道            0
    pbData[index++] = 0x00; // 明文数据    01 加密数据                     1
    pbData[index++] = 0x00; //总长度                                       2
    pbData[index++] = 0x00; //总长度，后续代码会算                            3

    pbData[index++] = 0xA1; //4
    pbData[index++] = 0x00; //Len1  1字节长度，真实数值后续代码算                5
    pbData[index++] = 0xA4; //6
    pbData[index++] = 0x00; //Len2  1字节长度，真实数值后续代码算            7

    //stable data
    pbData[index++] = 0x38; //8
    pbData[index++] = 0x01; //9
    pbData[index++] = 0x01; //10
    pbData[index++] = 0x39; //11

    pbData[index++] = cmdDataLen; //Len3
    pbData.push.apply(pbData, reqData)
    index += cmdDataLen;
    //stable data
    pbData[index++] = 0x3C;
    pbData[index++] = 0x03;
    pbData[index++] = 0x90;
    pbData[index++] = 0x00;
    pbData[index] = 0x00;

    pbData[7] = cmdDataLen + 1 + 9; //Len2长度 = 指令数据长度+两组固定数据长度+cmdDatalen自身长度标识1字节
    pbData[5] = pbData[7] + 2; //2包含固定数据0xA4与 pbData[7]本身长度标识1字节

    pbData[2] = ((pbData[5] + 2) & 0xff);
    pbData[3] = ((pbData[5]) >> 8) & 0xff; //总长度 小端模式
  } else {
    pbData[index++] = ((cmdType == 0xA3) ? cmdType : 0xA7);
    pbData[index++] = 0x00; //0 明文 1密文
    pbData[index++] = (cmdDataLen & 0xff); //总长度
    pbData[index++] = (cmdDataLen >> 8) & 0xff; //总长度，后续代码会算
    pbData.push.apply(pbData, reqData)
  }

  mTransData.push.apply(mTransData, pbData.slice(0, pbData[5] + 6))
  return 0;
}

function str2Bytes(str) {
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

function bytes2Str(arr) {
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

function makeRes(code, msg, data) {
  if (data == undefined) {
    return { code: code, msg: msg }
  } else {
    return { code: code, msg: msg, data: data }
  }
}

module.exports = {
  connectAndInit: connectAndInit,
  sendAndReceive: sendAndReceive,
  disConnect: disConnect
}