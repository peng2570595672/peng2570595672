var JLSDK = require('./JLDeviceWechat+33Protocol.js');
/**
 * 扫描设备
 * @param {需要查询的设备名称或部分名称} nameFlag 
 * @param {*} callBack 
 */
export function ScanDevice(nameFlag, timeOut, callBack) {
  JLSDK.scanDevice(nameFlag, timeOut,
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
export function connectDevice(device, callBack1, callBack2) {

  JLSDK.connect(device,
    (res) => {
      callBack1.call(this, res);
    }
  )
  JLSDK.onDisconnet((res) => {
    callBack2.call(this, res);
  })

}

/**
 * 断开连接
 * @param {回调} callBack 
 */
export function disconnectDevice(callBack) {

  JLSDK.disConnectDevice((res) => {
    callBack.call(this, res);
  })

}

export function transCmd(cmdArray, cmdtype, callback) {
  if (cmdtype == '10') {
    JLSDK.ICCChannel_CmdArray(cmdArray, (res) => {
      callback.call(this, res);
    })
  }
  if (cmdtype == '20') {
    JLSDK.ESAMChannel_CmdArray(cmdArray, (res) => {
      callback.call(this, res);
    })
  }
}
