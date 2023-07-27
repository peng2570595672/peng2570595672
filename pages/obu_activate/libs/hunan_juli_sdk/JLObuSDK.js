var JLSDK = require('./JLDeviceWechat+33Protocol.js');
var code = require('./errorCode.js')

/**
 * 扫描设备
 * @param {需要查询的设备名称或部分名称} nameFlag 
 * @param {*} callBack 
 */
export function ScanDevice(nameFlag, callBack) {

  JLSDK.scanDevice(nameFlag,
    (res) => {
      callBack.call(this, res);
    }
  )
}

/**
 * 停止扫描
 * @param {回调} callBack 
 */
export function StopScanDevice(callBack) {

  JLSDK.stopScanDevice(
    (res) => {
      callBack.call(this, res);
    }
  );

}

/**
 * 连接设备
 * @param {设备对象} device 
 * @param {回调} callBack 
 */
export function ConnectDevice(device, callBack) {

  JLSDK.connectDevice(device,
    (res) => {
      callBack.call(this, res);
    }
  )

}

/**
 * 断开连接
 * @param {回调} callBack 
 */
export function DisonnectDevice(callBack) {

  JLSDK.disConnectDevice((res) => {
    callBack.call(this, res);
  })

}

/**
 * 连接监听
 * @param {回调} callBack 
 */
export function OnDeiceConnectStatusChange(callBack) {

  JLSDK.onDisconnet((res) => {
    callBack.call(this, res);
  })

}


/**
 * ICC复位
 * @param {回调方法} callBack 
 */
export function ICCReset(callBack) {

  JLSDK.ICCReset((res) => {
    callBack.call(this, res);
  })
}
/**
 * ICC通道透传
 * @param {透传数据} data 
 * @param {回调方法} callBack 
 */
export function ICCChannel(data, callBack) {

  JLSDK.ICCChannel(data, (res) => {
    callBack.call(this, res);
  })
}


/**
 * ESAM复位
 * @param {透传数据} data 
 * @param {回调方法} callBack 
 */
export function ESAMReset(data, callBack) {

  JLSDK.ESAMRset(data, (res) => {
    callBack.call(this, res);
  })
}


/**
 * ESAM通道透传
 * @param {透传数据} data 
 * @param {回调方法} callBack 
 */
export function ESAMChannel(data, callBack) {

  JLSDK.ESAMChannel(data, (res) => {
    callBack.call(this, res);
  })
}
