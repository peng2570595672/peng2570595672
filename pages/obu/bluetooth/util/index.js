import wjApi from './../../etc/WJAPI/wjBleAPI.js';
import jyApi from './../../etc/JYAPI/GenvictBleUtil.js';

const atApi = require('./../../etc/ATAPI/ArtcBleUtil.js');
const cgApi = require('./../../etc/CGAPI/cguBle.js');
const jlApi = require('./../../etc/JLAPI/JLObuSDK.js');
const jtApi = require('./../../etc/JTAPI/BleUtil.js');
const jlQZApi = require('./../../etc/JLQZAPI/JLObuSDK.js');
const wqApi = require('./../../etc/WQAPI/WCDObuSdk.js');
const tdApi = require('./../../etc/TDAPI/TDRObuSDK.js');
const zzApi = require('./../../etc/WJAPI/wjBleAPI.js');

const app = getApp();
let scanTimeout;
const BluetoothInfo = { // 设备信息
    connectPrefixName: '', // 名称
    state: 1 // 1连接中、2成功可写入、3未找到设备
  };

/***
 * 初始化蓝牙模块。iOS 上开启主机/从机（外围设备）模式时需分别调用一次，并指定对应的 mode
 */
const openBluetoothAdapter = function (callback) {
    this.BluetoothInfo.state = 1;
    this.BluetoothInfo.connectPrefixName = '';
    wx.openBluetoothAdapter({
      success: (res) => {
        this.startBluetoothDevicesDiscovery(data => { // 开始扫瞄
          return callback(data);
        });
      },
      fail: (res) => {
        wx.showToast({
          title: res.errMsg,
          icon: 'none'
        });
        this.listenStatus(res);
      }
    });
};

/**
 * 开始搜寻附近的蓝牙外围设备
 */
const startBluetoothDevicesDiscovery = function (callback) {
   wx.startBluetoothDevicesDiscovery({
    services: [],
    success: (res) => {
      if (res.errCode == 0 || res.errCode == -1) {
        this.onBluetoothDeviceFound(data => { // 扫描结果的监听
         return callback(data);
        });
      }
    },
    fail: function (res) {
      console.log(res);
      // return callback(res);
    }
  });
};

/**
 *  //扫描结果的监听
 * @param {*} callback
 */
const onBluetoothDeviceFound = function (callback) {
  let foundDevices = [];
  let prefixName;
  let device;
  console.log('===================开始监听====================');
  scanTimeout = setTimeout(() => {
    wx.closeBluetoothAdapter();
   let res = {code: 10320, msg: '扫描蓝牙超时，未找到设备，请打开设备蓝牙'};
    this.listenStatus(res);
    console.log('scan timeout');
   }, 15000);
  //  wx.showLoading({
  //    title: '扫描蓝牙中...',
  //  })
   wx.onBluetoothDeviceFound((res) => {
          let name1 = [];
          for (let i = 0; i < res.devices.length; i++) {
            let name = res.devices[i]['name'];
                name1.push(res.devices[i]['name']);
            let deviceId = res.devices[i]['deviceId'];
            if (name != '' && name != undefined && name != 'undefined') {
                if (name.indexOf('G-WJ') != -1 || name.indexOf('ETC') != -1 || name.indexOf('G-JL') != -1) {
                  // 前装设备
                  prefixName = 'ETC';
                } else {
                  // 聚力临时设备
                  if (name.indexOf('5201121') != -1) {
                    prefixName = 'JL';
                  } else {
                    prefixName = name.substring(0, 2);
                  }
                }
                  prefixName = prefixName.toUpperCase();
                  if (prefixName == 'WJ' || prefixName == 'JL' || prefixName == 'JY' || prefixName == 'AT' || prefixName == 'JT' || prefixName == 'WQ' || prefixName == 'CG' || prefixName == 'TD' || prefixName == 'ZZ' || prefixName == 'ETC') {
                    clearTimeout(scanTimeout);
                          device = {};
                          device.name = name;
                          device.deviceId = deviceId;
                          device.prefixName = prefixName;
                          var _name = '';
                          switch (prefixName) {
                            case 'WJ':
                              _name = '万集';
                              break;
                            case 'JL':
                              _name = '聚利';
                              break;
                            case 'JY':
                              _name = '金溢';
                              break;
                            case 'AT':
                              _name = '埃特斯';
                              break;
                            case 'JT':
                              _name = '建投';
                              break;
                            case 'WQ':
                              _name = '握奇';
                              break;
                            case 'CG':
                              _name = '成谷';
                              break;
                            case 'TD':
                              _name = '天地融';
                              break;
                            case 'ZZ':
                              _name = '智载';
                              break;
                            case 'ETC':
                              _name = '前装';
                              break;
                            default:
                              _name = '未知';
                              break;
                          }
                          device._name = _name;
                          if (foundDevices.length == 0) {
                            foundDevices.push(device);
                          } else {
                            let isHave = false;
                            for (let j = 0; j < foundDevices.length; j++) {
                              if (name == foundDevices[j].name) {
                                isHave = true;
                                break;
                              }
                            }
                            if (!isHave) {
                              foundDevices.push(device);
                            }
                          }
                  }
            }
          }
       if (foundDevices.length > 0) {
         this.connectDevice(foundDevices[0],res => {
            return callback(res);
          });
       }
     });
};

/***
 * 连接蓝牙
 */
const connectDevice = function (foundDevices,callback) {
  let device = foundDevices;
  this.BluetoothInfo.connectPrefixName = foundDevices.prefixName;
  this.BluetoothInfo.state = 2;
  wx.stopBluetoothDevicesDiscovery({
     success: (res) => {
      switch (foundDevices.prefixName) {
        case 'WJ':
          wjApi.connectDevice(device,(res) => {
            console.log(res,'--------------------连接蓝牙');
            if (res.code == 0) {
              this.BluetoothInfo.state = 2;
              return callback(this.BluetoothInfo.state);
            } else {
              this.listenStatus(res);
            }
          }, (res) => {
             this.listenStatus(res);
          });
          break;
        case 'JL':
          jlApi.connectDevice(device,(res) => {
            if (res.code == 0) {
              this.BluetoothInfo.state = 2;
              return callback(this.BluetoothInfo.state);
            } else {
              this.listenStatus(res);
            }
          },(res) => {
            this.listenStatus(res);
          });
          break;
        case 'ETC':
          jlQZApi.connectDevice(device,(res) => {
            if (res.code == 0) {
              this.BluetoothInfo.state = 2;
              return callback(this.BluetoothInfo.state);
            } else {
              this.listenStatus(res);
            }
          },(res) => {
            this.listenStatus(res);
          });
          break;
        case 'JY':
          jyApi.connectDevice(device,(res) => {
            if (res.code == 0) {
              this.BluetoothInfo.state = 2;
              return callback(this.BluetoothInfo.state);
            } else {
              this.listenStatus(res);
            }
          },(res) => {
            console.log(res,'--------------------连接蓝牙');
            this.listenStatus(res);
          });
          break;
        case 'AT':
          atApi.connectDevice(device,(res) => {
            if (res.code == 0) {
              this.BluetoothInfo.state = 2;
              return callback(this.BluetoothInfo.state);
            } else {
              this.listenStatus(res);
            }
          },(res) => {
            this.listenStatus(res);
          });
          break;
        case 'JT':
          jtApi.connectDevice(device,(res) => {
            if (res.code == 0) {
              this.BluetoothInfo.state = 2;
              return callback(this.BluetoothInfo.state);
            } else {
              this.listenStatus(res);
            }
          },(res) => {
            this.listenStatus(res);
          });
          break;
        case 'WQ':
          wqApi.connectDevice(device,(res) => {
            if (res.code == 0) {
              this.BluetoothInfo.state = 2;
              return callback(this.BluetoothInfo.state);
            } else {
              this.listenStatus(res);
            }
          },(res) => {
            this.listenStatus(res);
          });
          break;
        case 'CG':
          cgApi.connectDevice(device,(res) => {
            if (res.code == 0) {
              this.BluetoothInfo.state = 2;
              return callback(this.BluetoothInfo.state);
            } else {
              this.listenStatus(res);
            }
          },(res) => {
            this.listenStatus(res);
          });
          break;

        case 'TD':
          tdApi.connectDevice(device, (res) => {
            if (res.code == 0) {
              this.BluetoothInfo.state = 2;
              return callback(this.BluetoothInfo.state);
            } else {
               this.alertF(res.msg);
            }
          }, (res) => {
            this.listenStatus(res);
          });
          break;
        case 'ZZ':
          zzApi.connectDevice(device, (res) => {
            if (res.code == 0) {
              this.BluetoothInfo.state = 2;
              return callback(this.BluetoothInfo.state);
            } else {
              this.listenStatus(res);
            }
          }, (res) => {
            this.listenStatus(res);
          });
          break;
        default:
          this.listenStatus(res);
          break;
      }
     },
     fail: (res) => {
       console.log(res,'--------------------连接蓝牙');
        this.BluetoothInfo.state = 3;
        return callback(this.BluetoothInfo.state); // 未找到设备, 请重新搜索
     }
   });
};

/**
   * 监听蓝牙状态
   */
  const listenStatus = function (res) {
    console.log(res,'---------------监听蓝牙状态------------------');
    if (res.code == 0) {
      this.BluetoothInfo.state = 2;
    } else if (res.code == 10320) {
      console.log('扫描蓝牙超时，未找到设备，请打开设备蓝牙');
      this.alertF(res.msg);
      this.BluetoothInfo.state = 3;
    } else {
       this.BluetoothInfo.state = 3;
       this.BluetoothInfo.connectPrefixName = '';
        this.disconnectDevice();// 断开蓝牙
    }
  };

/**
 * 断开蓝牙
 */
const disconnectDevice = function () {
  let connectPrefixName = this.BluetoothInfo.connectPrefixName;
  switch (connectPrefixName) {
    case 'WJ':
      wjApi.disconnectDevice((res) => {
        console.log(res,'---------------------断开蓝牙------------------------');
        this.alertF(res.msg);
      });
      break;
    case 'JL':
      jlApi.disconnectDevice((res) => {
        console.log(res,'---------------------断开蓝牙------------------------');
        this.alertF(res.msg);
      });
      break;
    case 'ETC':
      jlQZApi.disconnectDevice((res) => {
        console.log(res,'---------------------断开蓝牙------------------------');
        this.alertF(res.msg);
      });
      break;
    case 'JY':
      jyApi.disconnectDevice((res) => {
        console.log(res,'---------------------断开蓝牙------------------------');
        this.alertF(res.msg);
      });
      break;
    case 'AT':
      atApi.disconnectDevice((res) => {
        console.log(res,'---------------------断开蓝牙------------------------');
        this.alertF(res.msg);
      });
      break;
    case 'JT':
      jtApi.disconnectDevice((res) => {
        console.log(res,'---------------------断开蓝牙------------------------');
        this.alertF(res.msg);
      });
      break;
    case 'WQ':
      wqApi.disconnectDevice((res) => {
        console.log(res,'---------------------断开蓝牙------------------------');
        this.alertF(res.msg);
      });
      break;
    case 'CG':
      cgApi.disconnectDevice((res) => {
        console.log(res,'---------------------断开蓝牙------------------------');
        this.alertF(res.msg);
      });
      break;
    case 'TD':
      tdApi.disConnectDevice((res) => {
        console.log(res,'---------------------断开蓝牙------------------------');
        this.alertF(res.msg);
      });
      break;
    case 'ZZ':
      zzApi.disconnectDevice((res) => {
        console.log(res,'---------------------断开蓝牙------------------------');
        this.alertF(res.msg);
      });
      break;
    default:
      break;
  }
};

/**
 *  透传--读写卡  //"00A40000023F00";//选择主目录 "00A40000021001";//选择文件100E "00B0950000";//0015文件
 * @cmdArr 参数是指令
 * @type 10是卡 20是签
 * @func 回调方法
 */
const transCmd = function (cmdArr, type, func) {
  switch (this.BluetoothInfo.connectPrefixName) {
    case 'WJ':
      wjApi.transCmd(cmdArr, type,(res) => {
        // console.log(res)
        if (res.code == 0) {
         return func(res.data);
        } else {
          this.alertF(res.msg);
        }
      });
      break;
    case 'JL':
      jlApi.transCmd(cmdArr, type,(res) => {
        // console.log(res)
        if (res.code == 0) {
          return func(res.data);
        } else {
          this.alertF(res.msg);
        }
      });
      break;
    case 'ETC':
      jlQZApi.transCmd(cmdArr, type,(res) => {
        if (res.code == 0) {
          return func(res.data);
        } else {
          this.alertF(res.msg);
        }
      });
      break;
    case 'JY':

      jyApi.transCmd(cmdArr, type,(res) => {
        // console.log(res)
        if (res.code == 0) {
          return func(res.data);
        } else {
          this.alertF(res.msg);
        }
      });
      break;
    case 'AT':
      atApi.transCmd(cmdArr, type,(res) => {
        // console.log(res)
        if (res.code == 0) {
          return func(res.data);
        } else {
          this.alertF(res.msg);
        }
      });
      break;
    case 'JT':
      jtApi.transCmd(cmdArr, type, (res) => {
        // console.log(res)
        if (res.code == 0) {
          return func(res.data);
        } else {
          this.alertF(res.msg);
        }
      });
      break;
    case 'WQ':
      wqApi.transCmd(cmdArr, type, (res) => {
        // console.log(res)
        if (res.code == 0) {
          return func(res.data);
        } else {
          this.alertF(res.msg);
        }
      });
      break;
    case 'CG':
      cgApi.transCmd(cmdArr, type, (res) => {
        // console.log(res)
        if (res.code == 0) {
          return func(res.data);
        } else {
          this.alertF(res.msg);
        }
      });
      break;
    case 'TD':
      tdApi.transCmd(cmdArr, type, (res) => {
        // console.log(res)
        if (res.code == 0) {
          return func(res.data);
        } else {
          this.alertF(res.msg);
        }
      });
      break;
    case 'ZZ':
      zzApi.transCmd(cmdArr, type, (res) => {
        // console.log(res)
        if (res.code == 0) {
          return func(res.data);
        } else {
          this.alertF(res.msg);
        }
      });
      break;
    default:
      this.BluetoothInfo.state = 3;
      this.alertF('没有找到设备');
      break;
  }
};

  /***
   * 车例信息
   * @cmdArr [] 指令信息
   */
 const getVehicleInfo = function (cmdArr,func) {
    this.transCmd(cmdArr,'10',res => {
      let vehicleStr = res[2];
      let vehiclePlates = vehicleStr.substring(56,80);
      console.log(vehiclePlates,'=========车牌信息=========');
    });
 };

   /***
   * 获取OUB号20
   * @cmdArr ["00B0950000"]
   */
  const getObuId = function (obuStr) {
      if (obuStr == undefined || obuStr == 'undefined' || obuStr == '' || obuStr == null) {
        this.alertF(`OBU指令不符${obuStr}`);
        return;
      }
      if (obuStr.length < 36) {
        this.alertF(`OBU指令长度不符${obuStr}`);
        return;
      }
      let obuId = obuStr.substring(20,36);
      return obuId;
 };

   /***
   * 获取卡号是10
   * @cmdArr ["00A40000023F00"]
   */
  const getCardId = function (cardStr) {
      if (cardStr == undefined || cardStr == 'undefined' || cardStr == '' || cardStr == null) {
        this.alertF(`卡号指令不符${cardStr}`);
        return;
      }
      if (cardStr.length < 40) {
        this.alertF(`卡号长度不符${cardStr}`);
        return;
      }
      let cardId = cardStr.substring(20,40);
      return cardId;
 };

 /***
  * 圈存初始化指令结果
  */
 const getCosResponse = function (cmdArr,func) {
   console.log(cmdArr,'----------------');
    var len = cmdArr.length;
    let cosResponse = [];
    function getResult (i) { // 外层
      if (i < len) {
        console.log(i);
        this.transCmd([cmdArr[i]],10,res => {
          cosResponse.push(res);
          i++;
          getResult(i);
        });
      }
    }
    getResult(0);
   return func(cosResponse);
 };

/**
 * 提示加关蓝牙
 */
const alertF = function (msg) {
    // 隐藏加载框
    wx.hideToast;
    // 提示对话框
    wx.showToast({
      title: msg,
      icon: 'none',
      duration: 2000
    });
};

const Bluetooth = {
  openBluetoothAdapter: openBluetoothAdapter,
  startBluetoothDevicesDiscovery: startBluetoothDevicesDiscovery,
  onBluetoothDeviceFound: onBluetoothDeviceFound,
  connectDevice: connectDevice,
  disconnectDevice: disconnectDevice,
  listenStatus: listenStatus,
  transCmd: transCmd,
  alertF: alertF,
  BluetoothInfo: BluetoothInfo,
  getVehicleInfo: getVehicleInfo,
  getObuId: getObuId,
  getCardId: getCardId,
  getCosResponse: getCosResponse
};

module.exports = Bluetooth;
