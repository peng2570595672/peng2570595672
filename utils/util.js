/**
 * @author llfob
 * @date 2018/5/16
 * @description 共用函数
 * @version 1.0
 */
import {
  isOpenBluetooth
} from './utils';
const CryptoJS = require('./crypto-js.js');
const QQMapWX = require('../libs/qqmap-wx-jssdk.min.js');
const amapFile = require('./amap-wx.130.js')
let app = getApp();

function setApp(a) {
  app = a;
}

//DES  ECB模式加密
function encryptByDESModeEBC(message) {
  let keyHex = CryptoJS.enc.Utf8.parse(app.globalData.plamKey);
  let encrypted = CryptoJS.DES.encrypt(message, keyHex, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  return encrypted.ciphertext.toString();
}


//DES  ECB模式解密
function decryptByDESModeEBC(ciphertext) {
  let keyHex = CryptoJS.enc.Utf8.parse(app.globalData.plamKey);
  let decrypted = CryptoJS.DES.decrypt({
    ciphertext: CryptoJS.enc.Hex.parse(ciphertext)
  }, keyHex, {
    mode: CryptoJS.mode.ECB,
    padding: CryptoJS.pad.Pkcs7
  });
  let result_value = decrypted.toString(CryptoJS.enc.Utf8);
  return result_value;
}

// md5 加密
function md5Encrypt(message, ) {
  return CryptoJS.MD5(message).toString();
}

// 签名
function sign(obj, ) {
  let str = 'cyzlBeiJ';
  for (let key in obj) {
    str += obj[key];
  }
  obj['Sign'] = md5Encrypt(str);
  return JSON.stringify(obj);
}

// base 64
function base64(message) {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(message));
}

// base64 解码
function parseBase64(message) {
  let result = CryptoJS.enc.Base64.parse(message);
  return JSON.parse(result.toString(CryptoJS.enc.Utf8));
}

/**
 *  计算签名
 * @param params 请求参数
 * @param path 路径
 * @param token token
 */
function signature(params, path, token = '', timestamp, nonceStr) {
  // 先以对象key排序
  let keys = Object.keys(params).sort();
  let sign = '';
  // 顺序遍历
  for (let key of keys) {
    let value = params[key];
    // value是个对象
    if (typeof value === 'object' && value !== null) {
      // 对value为对象的数据进行序列化成字符串，然后按照ascii排序
      let v = JSON.stringify(params[key]);
      // 对value转为字符串进行排序处理
      v = v.split('').sort().join('');
      sign += `${key}=${v}&`;
    } else { // 非对象
      if (value !== 0 && !value) {
        params[key] = '';
        sign += `${key}=&`;
      } else {
        sign += `${key}=${params[key]}&`;
      }
    }
  }
  // 拼接url
  sign += `url=${path}&`;

  // 拼接token
  sign += token ? `accessToken=${token}&` : '';
  sign += `timestamp=${timestamp}&`;
  sign += `nonceStr=${nonceStr}&`;
  // 拼接key
  sign += 'key=' + app.globalData.plamKey;
  return md5Encrypt(sign);
}

// 签名 二发调用
function getSignature(params, path, token = '', timestamp, nonceStr) {
  return signature(params, path, token, timestamp, nonceStr)
}
// js 生成uuid
function getUuid() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0,
      v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
/**
 *  从网络获取数据
 * @param json 请求参数
 * @param success 成功后的回调g
 * @param fail 失败后的回调
 */
async function getDataFromServer(path, params, fail, success, token = '', complete, method = 'POST') {
  // common || public 模块下的不需要 token
  if (!token && !path.includes('common') && !path.includes('public')) {
  	console.log(path)
    showToastNoIcon('获取用户信息失败,请重新进入小程序!');
    return;
  }
  method = method.toUpperCase();
  // 对请求路径是否开头带/进行处理
  path = path.indexOf('/') === 0 ? path : `/${path}`;
  // 封装请求对象
  let obj = {
    url: app.globalData.host + path,
    method: method,
    success: (res) => {
      if (res.data.code === 115 || res.data.code === 117 || res.data.code === 118) { // 在别处登录了 重新自动登录一次
        reAutoLogin(path, params, fail, success, token, complete, method);
      } else if (res.data.code === 444) {
        // 请求已失效
        app.globalData.isSystemTime = false;
        app.globalData.systemTime = undefined;
        reAutoLogin(path, params, fail, success, token, complete, method);
      } else {
        success && success(res.data);
      }
    },
    fail: (res) => {
      fail && fail(res);
    },
    complete: (res) => {
      complete && complete();
    }
  };
  let header = {};
  // timestamp 时间戳  nonceStr随机字符串 uuid
  let timestamp, nonceStr;
  nonceStr = getUuid();
  if (app.globalData.isSystemTime) {
    if (app.globalData.systemTime) {
      timestamp = app.globalData.systemTime
    } else {
      timestamp = parseInt(new Date().getTime() / 1000);
    }
  } else {
    await getSystemTime().then(res => {
      timestamp = res;
    });
  }
  if (!timestamp) {
    timestamp = parseInt(new Date().getTime() / 1000);
  }
  // POST请求
  if (method === 'POST') {
    // 设置签名
    header = {
      sign: getSignature(params, path, token, timestamp, nonceStr),
      timestamp: timestamp,
      nonceStr: nonceStr
    };
    // 设置请求体
    obj['data'] = params;
  } else { // GET请求
    // 拼接请求路径
    let url = obj.url + '?';
    for (let key of Object.keys(params)) {
      url += `${key}=${params[key]}&`
    }
    url = url.substring(0, url.length - 1);
    obj.url = url;
    // 设置签名
    header = {
      sign: getSignature({}, obj.url.replace(app.globalData.host, ''), token, timestamp, nonceStr),
      timestamp: timestamp,
      nonceStr: nonceStr
    };
  }
  // 设置token
  if (token) {
    header.accessToken = token;
  }
  // 设置请求头
  obj.header = header;
  // 执行请求
  wx.request(obj);
}

/**
 * 签名错误 重新登录
 * @param path
 * @param params
 * @param fail
 * @param success
 * @param token
 * @param complete
 */
function reAutoLogin(path, params, fail, success, token = '', complete, method) {
  wx.login({
    success: (r) => {
      // 自动登录
      getDataFromServer('consumer/member/common/applet/code', {
        platformId: app.globalData.platformId,
        code: r.code
      }, () => {
        showToastNoIcon('网络错误，请关闭小程序重新进入！');
      }, (res) => {
        app.globalData.userInfo = res.data;
        app.globalData.openId = res.data.openId;
        app.globalData.memberId = res.data.memberId;
        app.globalData.mobilePhone = res.data.mobilePhone;
        // 重新获取所需数据
        getDataFromServer(path, params, fail, success, res.data.accessToken, complete, method);
      });
    }
  });
}

// 小于10的前补0操作
const formatNumber = (n) => {
  n = n.toString();
  return n[1] ? n : `0${n}`;
};
// 获取系统时间戳
function getSystemTime() {
  return new Promise((resolve, callback) => {
    let obj = {
      url: app.globalData.host + '/consumer/system/public/get-system-second',
      method: 'GET',
      success: (res) => {
        if (res.data.code === 0) {
          app.globalData.isSystemTime = true;
          app.globalData.systemTime = res.data.data;
          setInterval(function () {
            app.globalData.systemTime = app.globalData.systemTime + 1;
          }, 1000);
          resolve(res.data.data);
        } else {
          // 处理接口返回异常提示
          showToastNoIcon('请求异常,请重新进入');
        }
      },
      fail: (res) => {},
      complete: (res) => {}
    };
    // 执行请求
    wx.request(obj);
  }).then(res => {
    return res;
  })
}

/**
 *  格式化时间
 * @param date 日期
 * @returns {string} 返回结果字符串类型
 */
const formatTime = (date) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`;
};

/**
 *  跳转到url
 * @param url
 */
function go(url) {
  wx.navigateTo({
    url: url
  });
}

/**
 *  弹出吐司提示 不带icon 默认停留2秒
 * @param content 提示内容
 */
function showToastNoIcon(content, time = 2000) {
  setTimeout(() => {
    wx.showToast({
      title: content,
      icon: 'none',
      duration: time
    });
  }, 100);
}

// 上传图片 需要识别
function uploadOcrFile(filePath, type, fail, success, complete, onProgressUpdate) {
  let requestTask = wx.uploadFile({
    url: app.globalData.uploadOcrUrl, // 仅为示例，非真实的接口地址
    filePath: filePath,
    name: 'file',
    formData: {
      fileType: type
    },
    header: {
      'Content-Type': 'multipart/form-data'
    },
    success: (res) => {
      console.log(res);
      success && success(res.data);
    },
    fail: (res) => {
      fail && fail(res);
    },
    complete: () => {
      complete && complete();
    }
  });
  requestTask.onProgressUpdate((res) => {
    onProgressUpdate && onProgressUpdate(res);
  });
}

// 上传图片 不需要是被
function uploadFile(filePath, fail, success, complete, onProgressUpdate) {
  let requestTask = wx.uploadFile({
    url: app.globalData.uploadUrl, // 仅为示例，非真实的接口地址
    filePath: filePath,
    name: 'file',
    header: {
      'Content-Type': 'multipart/form-data'
    },
    success: (res) => {
      success && success(res.data);
    },
    fail: (res) => {
      fail && fail(res);
    },
    complete: () => {
      complete && complete();
    }
  });
  requestTask.onProgressUpdate((res) => {
    onProgressUpdate && onProgressUpdate(res);
  });
}

// 是否为json
function isJsonString(str) {
  try {
    if (typeof JSON.parse(str) === 'object') {
      return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

// 弹窗
function alert({
  title = '提示',
  content = '描述信息',
  showCancel = false,
  confirmText = '我知道了',
  cancelText = '取消',
  confirmColor = '#2FB565',
  cancelColor = '#99999D',
  confirm = () => {},
  cancel = () => {}
} = {}) {
  wx.showModal({
    title: title,
    content: content,
    showCancel: showCancel,
    confirmText: confirmText,
    cancelText: cancelText,
    confirmColor: confirmColor,
    cancelColor: cancelColor,
    success(res) {
      if (res.confirm) {
        confirm();
      } else if (res.cancel) {
        cancel();
      }
    },
    fail(res) {
      console.log(res);
    }
  });
}

// 加载中。。。
function showLoading({
  title = '加载中...',
  mask = true
} = {}) {
  wx.showLoading({
    title: title,
    mask: mask
  });
}

function hideLoading() {
  wx.hideLoading();
}

// 根据日期计算汉字
function getDateDiff(dateTimeStamp) {
  let result = '';
  let minute = 1000 * 60;
  let hour = minute * 60;
  let day = hour * 24;
  let halfamonth = day * 15;
  let month = day * 30;
  let now = new Date().getTime();
  let diffValue = now - dateTimeStamp;
  if (diffValue < 0) {
    return;
  }
  let monthC = diffValue / month;
  let weekC = diffValue / (7 * day);
  let dayC = diffValue / day;
  let hourC = diffValue / hour;
  let minC = diffValue / minute;
  if (monthC >= 1) {
    result = "" + parseInt(monthC) + "月前";
  } else if (weekC >= 1) {
    result = "" + parseInt(weekC) + "周前";
  } else if (dayC >= 1) {
    result = "" + parseInt(dayC) + "天前";
  } else if (hourC >= 1) {
    result = "" + parseInt(hourC) + "小时前";
  } else if (minC >= 1) {
    result = "" + parseInt(minC) + "分钟前";
  } else
    result = "刚刚";
  return result;
}

// 将号码中间四位替换为*
function mobilePhoneReplace(res) {
  if (!res) return '';
  let reg = /(\d{3})\d{4}(\d{4})/ig;
  return res.replace(reg, '$1****$2')
}

// 比较微信基础库版本
function compareVersion(v1, v2) {
  v1 = v1.split('.');
  v2 = v2.split('.');
  const len = Math.max(v1.length, v2.length);

  while (v1.length < len) {
    v1.push('0');
  }
  while (v2.length < len) {
    v2.push('0');
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i]);
    const num2 = parseInt(v2[i]);

    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }
  return 0;
}

/**
 *  根据地址查看经纬度等信息
 * @param address 地址
 * @param success 成功的回调
 */
function getInfoByAddress(address, success, fail) {
  let qqMap = new QQMapWX({
    key: app.globalData.mapKey // 必填
  });
  qqMap.geocoder({
    address: address,
    success: function (res) {
      success && success(res);
    },
    fail: function (res) {
      fail && fail(res);
    },
    complete: function (res) {}
  });
}

/**
 *  根据经纬度查询腾讯api 获取地址信息
 * @param lat 经度
 * @param lng 纬度
 * @param callback
 */
function getAddressInfo(lat, lng, success, fail, complete) {
  let qqMap = new QQMapWX({
    key: app.globalData.mapKey // 必填
  });
  qqMap.reverseGeocoder({
    location: {
      latitude: lat,
      longitude: lng
    },
    get_poi: 1,
    success: function (res) {
      success && success(res);
    },
    fail: function (res) {
      fail && fail(res);
    },
    complete: function (res) {
      complete && complete(res);
    }
  });
}
/**
 * @author july_peng
 * @param
 *
 * @returns querykeywords、location、querytypes 字段于 1.1.0 版本新增。
 * @description 高德获取周边poi
 */
function getAddressInfoGD(type, address, latLng, success, fail, complete) {
  let amap = new GDMapWX.AMapWX({
    key: app.globalData.GDmapKey // 必填
  });
  if (type === 1) { //获取周边的POI
    amap.getPoiAround({
      location: `${latLng}`,
      success: function (res) {
        success && success(res);
      },
      fail: function (res) {
        fail && fail(res);
      },
      complete: function (res) {
        complete && complete(res);
      }
    });
  } else if (type === 2) { // 获取地址描述信息
    amap.getRegeo({
      location: `${latLng}`, // 经度在前，纬度在后
      success: function (res) {
        success && success(res);
      },
      fail: function (res) {
        fail && fail(res);
      },
      complete: function (res) {
        complete && complete(res);
      }
    });
  } else { // 根据地址获取数据
    amap.getInputtips({
      keywords: `${address}`,
      // keywords: `贵州省安顺市镇宁县东大街三桥`,
      success: function (res) {
        success && success(res);
      },
      fail: function (res) {
        fail && fail(res);
      },
      complete: function (res) {
        complete && complete(res);
      }
    })
  }
}

/**
 * @author い 狂奔的蜗牛
 * @param bankno 银行卡号
 * @returns {boolean} 是银行卡号返回 true 否则false
 * @description 银行卡号验证
 */
function luhmCheck(bankno) {
  if (bankno.length < 16 || bankno.length > 19) {
    return false;
  }
  // 全数字
  let num = /^\d*$/;
  if (!num.exec(bankno)) {
    return false;
  }
  // 开头6位
  let strBin = '10,18,30,35,37,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,58,60,62,65,68,69,84,87,88,94,95,98,99';
  if (strBin.indexOf(bankno.substring(0, 2)) === -1) {
    return false;
  }
  let lastNum = parseInt(bankno.substr(bankno.length - 1, 1)); // 取出最后一位（与luhm进行比较）

  let first15Num = bankno.substr(0, bankno.length - 1); // 前15或18位
  let newArr = new Array();
  for (let i = first15Num.length - 1; i > -1; i--) { // 前15或18位倒序存进数组
    newArr.push(first15Num.substr(i, 1));
  }
  // 奇数位*2的积 <9
  let arrJiShu = new Array();
  // 奇数位*2的积 >9
  let arrJiShu2 = new Array();
  // 偶数位数组
  let arrOuShu = new Array();
  for (let j = 0; j < newArr.length; j++) {
    if ((j + 1) % 2 === 1) { // 奇数位
      if (parseInt(newArr[j]) * 2 < 9) {
        arrJiShu.push(parseInt(newArr[j]) * 2);
      } else {
        arrJiShu2.push(parseInt(newArr[j]) * 2);
      }
    } else { // 偶数位
      arrOuShu.push(newArr[j]);
    }
  }

  let jishuChild1 = new Array(); // 奇数位*2 >9 的分割之后的数组个位数
  let jishuChild2 = new Array(); // 奇数位*2 >9 的分割之后的数组十位数
  for (let h = 0; h < arrJiShu2.length; h++) {
    jishuChild1.push(parseInt(arrJiShu2[h]) % 10);
    jishuChild2.push(parseInt(arrJiShu2[h]) / 10);
  }

  let sumJiShu = 0; // 奇数位*2 < 9 的数组之和
  let sumOuShu = 0; // 偶数位数组之和
  let sumJiShuChild1 = 0; // 奇数位*2 >9 的分割之后的数组个位数之和
  let sumJiShuChild2 = 0; // 奇数位*2 >9 的分割之后的数组十位数之和
  let sumTotal = 0;
  for (let m = 0; m < arrJiShu.length; m++) {
    sumJiShu = sumJiShu + parseInt(arrJiShu[m]);
  }

  for (let n = 0; n < arrOuShu.length; n++) {
    sumOuShu = sumOuShu + parseInt(arrOuShu[n]);
  }

  for (let p = 0; p < jishuChild1.length; p++) {
    sumJiShuChild1 = sumJiShuChild1 + parseInt(jishuChild1[p]);
    sumJiShuChild2 = sumJiShuChild2 + parseInt(jishuChild2[p]);
  }
  // 计算总和
  sumTotal = parseInt(sumJiShu) + parseInt(sumOuShu) + parseInt(sumJiShuChild1) + parseInt(sumJiShuChild2);

  // 计算Luhm值
  let k = parseInt(sumTotal) % 10 === 0 ? 10 : parseInt(sumTotal) % 10;
  let luhm = 10 - k;

  return lastNum === luhm;
}
/**
 *  获取货车新流程订单办理状态 2.0
 */
function getTruckHandlingStatus(orderInfo) {
  // if (orderInfo.orderType === 31 && orderInfo.protocolStatus === 0) {
  //   // protocolStatus 0未签协议 1签了
  //   return orderInfo.pledgeStatus === 0 ? 3 : orderInfo.etcContractId === -1 ? 9 : 5;
  // }
  // flowVersion 流程版本，1-分对分，2-新版（总对总）,3-选装 4-预充值 5-保证金模式 6-圈存 7-交行二类户
  if (orderInfo.flowVersion === 5 && orderInfo.multiContractList.find(item => item.contractStatus === 2)) {
    return 1; // 货车解约 - 保证金模式
  }
  if (orderInfo.shopProductId === 0) {
    return 2; // 办理中 未选套餐
  }
  if (orderInfo.pledgeStatus === 0) {
    // pledgeStatus 状态，-1 无需支付 0-待支付，1-已支付，2-退款中，3-退款成功，4-退款失败
    return 3; // 待支付
  }
  if (orderInfo.isOwner === 0 || orderInfo.isVehicle === 0 || (orderInfo.isHeadstock === 0 && orderInfo.obuCardType !== 1) || (orderInfo.isTraction === 1 && orderInfo.isTransportLicense !== 1)) {
    return 4; // 办理中 未上传证件
  }


  if (orderInfo.flowVersion === 6 && !app.globalData.bankCardInfo.accountNo) { // 开通II类户预充保证金 - 未开户
    // return 13;
  }
  console.log(orderInfo)
  if (orderInfo.flowVersion === 7) {
    // 交行二类户流程
    let info, checkResults;
    if (app.globalData.memberStatusInfo?.accountList?.length) {
      info = app.globalData.memberStatusInfo.accountList.find(item => item.orderId === orderInfo.id)
    }
    if (app.globalData.memberStatusInfo?.orderBankConfigList?.length) {
      checkResults = app.globalData.memberStatusInfo.orderBankConfigList.find(item => item.orderId === orderInfo.id)
    }
    if (!checkResults?.uploadImageStatus) return 19; // 未影像资料上送
    if (!checkResults?.isTencentVerify) return 20; // 未上送腾讯云活体人脸核身核验成功
    if (!info?.memberBankId) return 13; // 交行 开通II类户预充保证金 - 未开户
    if (!orderInfo.contractStatus) return 21; // 未签约银行
  }
  if (orderInfo.flowVersion === 6 && app.globalData.bankCardInfo.accountNo) { //有二类户-代扣通行费
    //contractStatus :-1 签约失败 0发起签约 1已签约 2解约
    //	app.globalData.bankCardInfo.accountNo = app.globalData.bankCardInfo.accountNo.substr(-4);
    if (orderInfo.contractStatus == -1) { //通行费代扣签约成功
      return 18;
    }
    if (orderInfo.contractStatus == 0) { //充值
      return 15;
    }
    if (orderInfo.contractStatus == 1) { //小额免密签约成功
      return 15;
    }
    if (orderInfo.contractStatus == 1 && orderInfo.serviceFeeContractStatus) { //小额免密签约成功
      return 15;
    }
  }
  if (orderInfo.flowVersion === 7 && orderInfo.multiContractList.filter(item => item.contractStatus === 1).length !== 3) {
    return 5; // 未完全签约 - 或存在解约
  }
  if (orderInfo.flowVersion === 5 && orderInfo.status === 0) {
    // return 14; // 办理中 未授权预充保证金
  }
  if (orderInfo.flowVersion === 4 && orderInfo.status === 0) {
    return 4; // 办理中 已上传证件 待完善
  }
  if (orderInfo.flowVersion === 4 && orderInfo.auditStatus === -1) {
    return 6; // 我方无需审核,待第三方审核
  }
  if (orderInfo.auditStatus === 0 || orderInfo.auditStatus === 3) {
    // auditStatus: -1 无需审核   0 待审核   1 审核失败  2 审核通过  3 预审核通过  9 高速核验不通过
    return 6; // 待审核 预审核通过(待审核)
  }
  if (orderInfo.auditStatus === 1) {
    return 7; // 资料被拒绝 修改资料
  }
  if (orderInfo.auditStatus === 9) {
    return 8; // 高速核验不通过
  }
  if (orderInfo.flowVersion === 5 && orderInfo.auditStatus === 2 && orderInfo.holdStatus === 0) {
    // return 15; // 未冻结保证金成功
  }
  if (orderInfo.flowVersion === 4 && orderInfo.orderType !== 31 && orderInfo.auditStatus === 2 && orderInfo.prechargeFlag === 0) {
    // prechargeFlag 0未预充 1已预充
    // return 17; // 未预充金额
  }
  if ((orderInfo.auditStatus === 2 || (orderInfo.auditStatus === 0 && orderInfo.orderType === 31)) && (orderInfo.flowVersion === 2 || orderInfo.flowVersion === 3) && orderInfo.hwContractStatus !== 1) {
    // hwContractStatus 高速签约状态，0-未签约，1-已签约  2-解约
    return 9; // 审核通过,待签约高速
  }
  if (orderInfo.auditStatus === 2 && orderInfo.logisticsId === 0) {
    return 10; // 审核通过,待发货
  }
  if (orderInfo.obuStatus === 0) {
    return 11; //  待激活
  }
  if (orderInfo.flowVersion === 4 && orderInfo.orderType === 31 && orderInfo.auditStatus === 2 && orderInfo.prechargeFlag === 0) {
    // prechargeFlag 0未预充 1已预充
    // return 17; // 未预充金额
  }
  if (orderInfo.obuStatus === 1 || orderInfo.obuStatus === 5) {
    return 12; // 已激活
  }
  return 0; // 错误状态,未判断到
}
/**
 *  获取订单办理状态 2.0
 */
function getStatus(orderInfo) {
  if (orderInfo.obuCardType === 10 && +orderInfo.orderExtCardType === 2) {
    // 湖南信科   deviceType设备类型 (1:插卡; 0:单片)  orderExtCardType 2代表信科
    if (orderInfo.pledgeStatus === 0) { // 待支付
      return 3;
    }
    if (orderInfo.obuStatus === 0) { // 已支付待激活
      if (orderInfo.status === 0) { // 资未完善
        return 34;
      }
      return 31;
    }
    return 32;
  }
  if (orderInfo.orderType === 81) {
    if (orderInfo.pledgeStatus === 0) { // 设备升级 待支付
      return 24;
    }
    if (orderInfo.status === 0) { // 设备升级  资料待完善  || 审核失败,可以修改资料
      return 25;
    }
    if (orderInfo.status === 2 || orderInfo.status === 1) { // 小程序提交完资料 说明： -1 删除（取消办理），0-资料待完善，1-资料已完善 2-升级订单已确认
      if (orderInfo.auditStatus === 0 || orderInfo.auditStatus === 3) { // 待审核
        return 6
      }
      if (orderInfo.auditStatus === 1) { // 小程序提交完资料,审核失败
        return 27;
      }
      if (orderInfo.auditStatus === 9) {
        // 高速核验不通过
        return 8;
      }
      if (orderInfo.auditStatus === 2 && orderInfo.logisticsId === 0) {
        // 待发货
        return 28;
      }
      if (orderInfo.logisticsId !== 0 && orderInfo.obuStatus === 0) {
        return 11; //  待激活
      }
      if (orderInfo.status === 2) {
        return 26
      }
    }
  }
  if (orderInfo.orderType === 61 && (orderInfo.auditStatus === 9 || orderInfo.auditStatus === 1)) {
    return 8; // 电销模式审核不通过,不允许修改资料
  }
  if (orderInfo.orderType === 61 && orderInfo.status === 0) {
    // 电销办理只让在套餐页完成剩余流程
    if (orderInfo.pledgeStatus === 0) {
      // pledgeStatus 状态，-1 无需支付 0-待支付，1-已支付，2-退款中，3-退款成功，4-退款失败
      return 3; // 待支付
    }
    return 23;
  }
  // if (orderInfo.orderType === 31 && orderInfo.protocolStatus === 0 && orderInfo.isSignTtCoupon !== 1 && orderInfo.platformId !== '568113867222155288' && orderInfo.platformId !== '500338116821778436') {
  // 	// 过滤好车主的
  // 	// protocolStatus 0未签协议 1签了
  // 	return orderInfo.pledgeStatus === 0 ? 3 : orderInfo.etcContractId === -1 ? 9 : 5;
  // }
  if (orderInfo.isNewTrucks === 0 && orderInfo.contractStatus !== 1 && orderInfo.status === 1 && orderInfo.pledgeStatus !== 0) {
    return 1; // 客车解约
  }
  if (orderInfo.status === 1 && orderInfo.isSignTtCoupon === 1 && orderInfo.ttContractStatus !== 1 && orderInfo.pledgeStatus !== 0 && orderInfo.ttCouponPayAmount > 0) {
    // 通通券签约套餐 解约 洛阳工行 通通券金额为 0 时 返回 6 进入办理进度页
    return 22;
  }
  if (orderInfo.shopProductId === 0) {
    return 2; // 办理中 未选套餐
  }
  if (orderInfo.pledgeStatus === 0) {
    // pledgeStatus 状态，-1 无需支付 0-待支付，1-已支付，2-退款中，3-退款成功，4-退款失败
    return 3; // 待支付
  }
  if (orderInfo.status === 0) {
    return 4; // 办理中 未上传证件
  }
  if (!orderInfo.contractStatus && orderInfo.deliveryRule === 0 && orderInfo.etcContractId !== -1) {
    // deliveryRule 先签约后发货-0、先发货后签约-1    etcContractId -1 不需要签约微信
    return 5; // 待微信签约
  }
  if (orderInfo.orderType === 31 && orderInfo.auditStatus === 0) {
    return 6;
  }
  if (orderInfo.auditStatus === 0 || orderInfo.auditStatus === 3) {
    // auditStatus: -1 无需审核   0 待审核   1 审核失败  2 审核通过  3 预审核通过  9 高速核验不通过
    return 6; // 待审核 预审核通过(待审核)
  }
  if (orderInfo.auditStatus === 1) {
    return 7; // 资料被拒绝 修改资料
  }
  if (orderInfo.auditStatus === 9) {
    return 8; // 高速核验不通过
  }
  if ((orderInfo.auditStatus === 2 || (orderInfo.auditStatus === 0 && orderInfo.orderType === 31)) && (orderInfo.flowVersion === 2 || orderInfo.flowVersion === 3) && orderInfo.hwContractStatus === 0) {
    // hwContractStatus 高速签约状态，0-未签约，1-已签约  2-解约
    return 9; // 审核通过,待签约高速
  }
  if (orderInfo.flowVersion === 3 && orderInfo.hwContractStatus !== 3) {
    return 16; // 审核通过,待车辆关联签约支付渠道
  }
  if (orderInfo.auditStatus === 2 && orderInfo.logisticsId === 0) {
    return 10; // 审核通过,待发货
  }
  if (orderInfo.auditStatus === 2 && orderInfo.logisticsId !== 0 && orderInfo.deliveryRule === 1 && orderInfo.etcContractId !== -1 && !orderInfo.contractStatus) {
    return 5; // 审核通过,已发货或无需发货,待微信签约
  }
  if (orderInfo.obuStatus === 0 || orderInfo.obuStatus === 3 || orderInfo.obuStatus === 4 || (orderInfo.status === 1 && orderInfo.obuStatus === 2 && (orderInfo.obuCardType === 23 || orderInfo.obuCardType === 2)) ){//补充河北交投换卡换签
	  // OBU状态:默认0 0-待激活，1-已激活，2-已注销 3-开卡 4-发签 5预激活  (3和4:首次激活未完成)
  	return 11; //  待激活
  }
  if (orderInfo.obuStatus === 1 || orderInfo.obuStatus === 5) {
    if ((app.globalData.cictBankObj.citicBankshopProductIds.includes(orderInfo.shopProductId) || (orderInfo.orderType === 31 && orderInfo.productName?.includes('中信') && orderInfo.pledgeType === 2)) && orderInfo.refundStatus !== 3) {
      if (app.globalData.cictBankObj.guangfaBank === orderInfo.shopProductId) { // 广发订单
        return 33
      }
      return 30
    }
    return 12; // 已激活
  }
  // if (orderInfo.status === 1 && orderInfo.obuStatus === 2) {  // 已注销
  //   return
  // }
  return 0; // 错误状态,未判断到
}
/**
 *  获取订单办理状态 1.0
 */
function getStatusFirstVersion(orderInfo) {
  let status = 0;
  if (orderInfo.status === 0 && orderInfo.logisticsId === 0) {
    status = 1; // 资料未完善
  } else if (orderInfo.contractStatus !== 1 && orderInfo.logisticsId !== 0) {
    // 先发货,后签约  h5
    status = 2; // 待签约
  } else if (orderInfo.contractStatus === 1 && orderInfo.auditStatus === 0) {
    status = 4; // 查看进度 待审核
  } else if (orderInfo.auditStatus === 1) {
    status = 5; // 资料被拒绝 修改资料
  } else if ((orderInfo.obuStatus === 0 || orderInfo.obuStatus === 5) && orderInfo.auditStatus === 2) {
    status = 6; // 审核通过  待激活
  } else if ((orderInfo.obuStatus === 0 || orderInfo.obuStatus === 5) && orderInfo.auditStatus === 3) {
    status = 7; // 预审核通过  待审核
  } else if ((orderInfo.obuStatus === 0 || orderInfo.obuStatus === 5) && orderInfo.auditStatus === 9) {
    status = 8; // 高速核验不通过
  } else if (orderInfo.obuStatus === 1 && orderInfo.auditStatus === 2) {
    status = 9; // 审核通过  已激活
  }
  if (orderInfo.auditStatus === -1 && orderInfo.status === 1) {
    // 不需要审核,为了不改动之前的,所以单独判断
    if (orderInfo.obuStatus !== 1) {
      status = 6; // 待激活
    } else if (orderInfo.obuStatus === 1) {
      status = 9; // 已激活
    }
  }
  return status;
}
/**
 * 返回首页
 */
function goHome(unload) {
  let len = getCurrentPages().length;
  let delta = unload ? len - 2 : len - 1;
  if (delta > 0) {
    wx.navigateBack({
      delta: delta // 默认值是1
    });
  }
}
/**
 * 重置数据,避免小程序未关闭状态从多个渠道进入导致数据错乱
 *  若升级3.0,从其他渠道进入,建议使用object对象,清空对象,2.0已成型,涉及地方太多,暂不修改
 */

function resetData() {
  app.globalData.salesmanMerchant = undefined;
  app.globalData.scanCodeToHandle = undefined;
  app.globalData.isServiceProvidersPackage = true;
  app.globalData.isThirdGeneralize = false;
  app.globalData.isCitiesServices = false;
  app.globalData.isWeChatSudoku = false;
  app.globalData.membershipCoupon = {};
  app.globalData.isContinentInsurance = false;
  app.globalData.isJinYiXing = false;
  app.globalData.belongToPlatform = '500338116821778434';
  app.globalData.salesmanScanCodeToHandleId = undefined;
  app.globalData.isSalesmanPromotion = false;
  app.globalData.isHighSpeedTraffic = undefined;
  app.globalData.isHighSpeedTrafficActivity = false;
  app.globalData.officialChannel = false;
  app.globalData.isSalesmanOrder = false;
  app.globalData.isFaceToFaceCCB = false;
  app.globalData.isFaceToFaceICBC = false;
  app.globalData.isFaceToFaceWeChat = false;
  app.globalData.isToMicroInsurancePromote = false;
  app.globalData.faceToFacePromotionId = undefined;
  app.globalData.activitiesOfDrainage = false;
  app.globalData.isCrowdsourcingPromote = false;
  app.globalData.isSecondSigning = false;
  app.globalData.isSecondSigningInformationPerfect = false;
  app.globalData.isTruckHandling = false;
  app.globalData.MTCChannel = false;
  app.globalData.otherEntrance = {}; // 初始化其它入口
}
/**
 *  获取办理车辆类型  货车/企业车辆限制(1.0)
 */
function getHandlingType(orderInfo) {
  if (orderInfo.isCrop === 1) {
    // 企业车辆
    return true;
  } else {
    return orderInfo.carType === 11 || orderInfo.carType === 12 || orderInfo.carType === 13 ||
      orderInfo.carType === 14 || orderInfo.carType === 15 || orderInfo.carType === 16;
  }
}

/**
 *  获取当前日期是否大于某个日期
 */
function isGreaterThanData(dateStr) {
  const curDate = new Date();
  const dateTimestamp = new Date(dateStr);
  return curDate >= dateTimestamp;
}
/**
 *  获取当前日期是否属于某时间段
 */
function isDuringDate(beginDateStr, endDateStr) {
  const curDate = new Date();
  beginDateStr = beginDateStr.slice(0, 19).replace(new RegExp('-', 'g'), '/'); //转换是为了iPhone
  endDateStr = endDateStr.slice(0, 19).replace(new RegExp('-', 'g'), '/');
  const beginDate = new Date(beginDateStr);
  const endDate = new Date(endDateStr);
  return curDate >= beginDate && curDate < endDate;
}
/**
 *  获取当前日期是否属于某时间段,开始和结束都为闭区间（用于校验身份证的有效期）
 */
function isDuringDateIdCard(beginDateStr, endDateStr) {
  const curDate = new Date();
  beginDateStr = beginDateStr.replace('.', '/').replace('.', '/'); //转换是为了iPhone
  endDateStr = endDateStr.replace('.', '/').replace('.', '/');
  console.log('时间：', beginDateStr, endDateStr);
  const beginDate = new Date(beginDateStr);
  const endDate = new Date(endDateStr);
  return curDate >= beginDate && curDate <= endDate;
}
/**
 *  获取当前日期是在某时间段
 */
function isTimeQuantum(beginDateStr, endDateStr) {
  beginDateStr = beginDateStr.slice(0, 16).replace(new RegExp('-', 'g'), '/');
  endDateStr = endDateStr.slice(0, 16).replace(new RegExp('-', 'g'), '/');
  let curDate;
  if (app.globalData.systemTime) {
    curDate = new Date(app.globalData.systemTime * 1000);
  } else {
    curDate = new Date();
  }
  const beginDate = new Date(beginDateStr);
  const endDate = new Date(endDateStr);
  if (curDate >= beginDate && curDate < endDate) {
    return 1; // 当前时间属于该时间间段
  }
  if (curDate >= beginDate && curDate > endDate) {
    return 0; // 当前时间大于该时间间段
  }
  return 2;
}
/**
 *  订阅消息封装
 */
function subscribe(tmplIds, url) {
  // 判断版本，兼容处理
  let result = compareVersion(app.globalData.SDKVersion, '2.8.2');
  if (result >= 0) {
    showLoading({
      title: '加载中...'
    });
    wx.requestSubscribeMessage({
      tmplIds: tmplIds,
      success: (res) => {
        wx.hideLoading();
        if (res.errMsg === 'requestSubscribeMessage:ok') {
          let keys = Object.keys(res);
          // 是否存在部分未允许的订阅消息
          let isReject = false;
          for (let key of keys) {
            if (res[key] === 'reject') {
              isReject = true;
              break;
            }
          }
          // 有未允许的订阅消息
          if (isReject) {
            alert({
              content: '检查到当前订阅消息未授权接收，请授权',
              showCancel: true,
              confirmText: '授权',
              confirm: () => {
                wx.openSetting({
                  success: (res) => {},
                  fail: () => {
                    showToastNoIcon('打开设置界面失败，请重试！');
                  }
                })
              },
              cancel: () => { // 点击取消按钮
                // if (url === '/pages/default/index/index') {
                if (url === '/pages/Home/Home') {
                  wx.switchTab({
                    url: '/pages/Home/Home'
                  });
                } else {
                  go(url)
                }
              }
            });
          } else {
            if (url === '/pages/Home/Home') {
              // if (url === '/pages/default/index/index') {
              wx.switchTab({
                url: '/pages/Home/Home'
              });
            } else {
              go(url)
            }
          }
        }
      },
      fail: (res) => {
        console.log(res);
        wx.hideLoading();
        // 不是点击的取消按钮
        if (res.errMsg === 'requestSubscribeMessage:fail cancel') {
          // if (url === '/pages/default/index/index') {
          if (url === '/pages/Home/Home') {
            wx.switchTab({
              url: '/pages/Home/Home'
            });
          } else {
            go(url)
          }
        } else {
          alert({
            content: '调起订阅消息失败，是否前往"设置" -> "订阅消息"进行订阅？',
            showCancel: true,
            confirmText: '打开设置',
            confirm: () => {
              wx.openSetting({
                success: (res) => {},
                fail: () => {
                  showToastNoIcon('打开设置界面失败，请重试！');
                }
              })
            },
            cancel: () => {
              // if (url === '/pages/default/index/index') {
              if (url === '/pages/Home/Home') {
                wx.switchTab({
                  url: '/pages/Home/Home'
                });
              } else {
                go(url)
              }
            }
          });
        }
      }
    });
  } else {
    alert({
      title: '微信更新提示',
      content: '检测到当前微信版本过低，可能导致部分功能无法使用；可前往微信“我>设置>关于微信>版本更新”进行升级',
      confirmText: '继续使用',
      showCancel: true,
      confirm: () => {
        // if (url === '/pages/default/index/index') {
        if (url === '/pages/Home/Home') {
          wx.switchTab({
            url: '/pages/Home/Home'
          });
        } else {
          go(url)
        }
      }
    });
  }
}
/**
 *  车险报价
 */
function getInsuranceOffer(orderId, wtagid) {
  const memberId = app.globalData.userInfo.memberId;
  getDataFromServer('consumer/order/insuranceOffer', {
    orderId: orderId
  }, () => {
    hideLoading();
    let url = `outerUserId=${memberId}&outerCarId=${orderId}&companyId=SJHT&configId=sjht&wtagid=${wtagid}`;
    let pageUrl = app.globalData.weiBoUrl + encodeURIComponent(url);
    openWeiBao(pageUrl);
  }, (res) => {
    if (res.code === 0) {
      hideLoading();
      if (res.data && JSON.stringify(res.data) !== '{}') {
        orderId = res.data.orderId;
      } else {
        // showToastNoIcon('暂无报价！');
      }
    } else {
      // showToastNoIcon(res.message);
    }
    let url = `outerUserId=${memberId}&outerCarId=${orderId}&companyId=SJHT&configId=sjht&wtagid=${wtagid}`;
    let pageUrl = app.globalData.weiBoUrl + encodeURIComponent(url);
    openWeiBao(pageUrl);
  }, app.globalData.userInfo.accessToken, () => {});
}
/**
 *  获取用户状态-交行资料信息
 */
async function getMemberStatus() {
  const result = await getDataFromServersV2('consumer/member/bcm/getMemberStatus', {}, 'POST', false);
  app.globalData.memberStatusInfo = result?.data || {};
}
/**
 *  去微保好车主
 */
function goMicroInsuranceVehicleOwner(params, wtagid) {
  wtagid = app.globalData.test ? '104.113.1' : wtagid;
  let pageUrl = `pages/base/redirect/index?routeKey=WEDRIVE_HIGH_JOIN&wtagid=${wtagid}&companyId=SJHT&outerUserId=${app.globalData.userInfo.memberId}&outerData=123`;
  getDataFromServer('consumer/member/thirdBack/dataRecordNew', params, () => {
    hideLoading();
    openWeiBao(pageUrl);
  }, (res) => {
    openWeiBao(pageUrl);
  }, app.globalData.userInfo.accessToken, () => {});
}

function openWeiBao(pageUrl) {
  let appId = app.globalData.test ? 'wx7f3f0032b6e6f0cc' : 'wx06a561655ab8f5b2';
  wx.openEmbeddedMiniProgram({
    appId: appId,
    path: pageUrl,
    envVersion: 'release',
    fail() {
      showToastNoIcon('调起微保小程序失败, 请重试！');
    }
  });
}
// 微信车主服务签约
function weChatSigning(data) {
  if (data.version === 'v1') { // 签约车主服务 1.0
    wx.navigateToMiniProgram({
      appId: 'wxbd687630cd02ce1d',
      path: 'pages/index/index',
      extraData: data.extraData,
      fail() {
        showToastNoIcon('调起车主服务签约失败, 请重试！');
      }
    });
  } else if (data.version === 'v2') { // 签约车主服务 2.0
    wx.navigateToMiniProgram({
      appId: 'wxbcad394b3d99dac9',
      path: 'pages/route/index',
      extraData: data.extraData,
      fail() {
        showToastNoIcon('调起车主服务签约失败, 请重试！');
      }
    });
  } else { // 签约车主服务 3.0
    wx.openBusinessView({
      businessType: 'wxpayVehicleETC',
      extraData: {
        preopen_id: data.extraData.peropen_id
      },
      fail(e) {
        console.log(e)
      }
    })
  }
}
// px转rpx-wxAnimation方法使用的是px
function getPx(size) {
  return size / 750 * wx.getSystemInfoSync().windowWidth;
}
// rpx转px-wxAnimation方法使用的是px
function getRpx(size) {
  return size * 750 / wx.getSystemInfoSync().windowWidth;
}
// 创建动画
function wxAnimation(delay, site, translate, opacity = 1) {
  site = getPx(site);
  let animation = wx.createAnimation({
    delay,
    duration: 300,
    timingFunction: 'ease-in'
  });
  if (translate === 'translateY') {
    animation.translateY(site).opacity(opacity).step();
  } else {
    animation.translateX(site).step();
  }
  return animation.export();
}
// 获取定位数据
let isTruckHandle = true; // 是否是货车办理
function initLocationInfo(orderInfo, isTruck = false) {
  isTruckHandle = isTruck;
  // 是否缓存了定位信息
  // let locationInfo = wx.getStorageSync('location-info');
  // if (locationInfo) {
  // 	let res = JSON.parse(locationInfo);
  // 	let info = res.result.ad_info;
  // 	// 获取区域编码
  // 	let regionCode = [`${info.city_code.substring(3).substring(0, 2)}0000`, info.city_code.substring(3), info.adcode];
  // 	const result = getListOfPackages(orderInfo, regionCode)
  // 	if (result) {
  // 		return result
  // 	}
  // 	return '';
  // }
  // 定位
  return getListOfPackages(orderInfo);
}
// 授权定位
async function getLocationInfo(orderInfo) {
  showLoading();
  let res = await new Promise((resolve, reject) => {
    wx.getLocation({
      type: 'wgs84',
      success: async (res) => {
        getAddressInfoGD(res.latitude, res.longitude, (res) => {
          wx.setStorageSync('location-info', JSON.stringify(res));
          let info = res.result.ad_info;
          let regionCode = [`${info.city_code.substring(3).substring(0, 2)}0000`, info.city_code.substring(3), info.adcode];
          resolve(regionCode)
        }, () => {
          resolve([])
        });
      },
      fail: (res) => {
        hideLoading();
        if (res.errMsg === 'getLocation:fail auth deny' || res.errMsg === 'getLocation:fail authorize no response') {
          alert({
            content: '由于您拒绝了定位授权，导致无法获取扣款方式，请允许定位授权！',
            showCancel: true,
            confirmText: '允许授权',
            confirm: () => {
              wx.openSetting();
            },
            cancel: () => {
              resolve([])
            }
          });
        } else if (res.errMsg === 'getLocation:fail:ERROR_NOCELL&WIFI_LOCATIONSWITCHOFF' || res.errMsg === 'getLocation:fail system permission denied' || res.errMsg === 'getLocation:fail:system permission denied') {
          showToastNoIcon('请开启手机或微信定位功能！');
        }
      }
    });
  })
  return getListOfPackages(orderInfo, res);
}
// 获取套餐列表
async function getListOfPackages(orderInfo, regionCode, notList) {
  showLoading();
  let params = {
    needRightsPackageIds: true,
    areaCode: '',
    productType: 2,
    vehType: 1,
    platformId: app.globalData.platformId,
    shopId: orderInfo.shopId || app.globalData.miniProgramServiceProvidersId
  };
  let isTruckHandle = app.globalData.orderInfo.isTruckHandle; // 是否是货车办理
  if (isTruckHandle) {
    params.vehType = 2;
    params.shopId = app.globalData.miniProgramServiceProvidersId;
  }
  console.log('params',params);
  let result = await getDataFromServersV2('consumer/system/get-usable-product', params);
  if (!result) return '';
  if (result.code) {
    showToastNoIcon(result.message);
    return;
  }
  let [isFaceToFace, isFaceToFaceCCB, isFaceToFaceICBC, isFaceToFaceWeChat] = [false, false, false, false];
  if (orderInfo.thirdGeneralizeNo && orderInfo.thirdGeneralizeNo.indexOf('isFaceToFace') !== -1) {
    isFaceToFace = true;
    if (orderInfo.thirdGeneralizeNo === 'isFaceToFaceCCB') {
      isFaceToFaceCCB = true;
    } else if (orderInfo.thirdGeneralizeNo === 'isFaceToFaceICBC') {
      isFaceToFaceICBC = true;
    } else if (orderInfo.thirdGeneralizeNo === 'isFaceToFaceWeChat') {
      isFaceToFaceWeChat = true;
    }
  }
  if (result.data.length === 0) {
    let arr = [1, 3, 4, 5, 6, 9, 12, 14, 17, 23, 24]; // 推广类型
    if (arr.includes(orderInfo?.promoterType) || orderInfo.shopId === app.globalData.miniProgramServiceProvidersId) {
      showToastNoIcon('未查询到套餐，请联系工作人员处理！');
      return;
    }
    app.globalData.isServiceProvidersPackage = false; // 该服务商没有套餐
    // getListOfPackages(orderInfo, regionCode, true);
  }
  result.data.map(item => {
  	item.shopId = params.shopId;
    try {
      item.descriptionList = JSON.parse(item.description);
    } catch (e) {}
  });
  let list = result.data;
  list = list.filter(item => item.shopProductId !== app.globalData.deviceUpgrade.shopProductId); //过滤掉蒙通卡设备升级套餐，不予以展示
  // 面对面活动过滤套餐
  if (isFaceToFace) {
    let faceToFaceList = [];
    list = [];
    faceToFaceList = result.data.find((item) => {
      if (isFaceToFaceCCB) {
        return item.shopProductId === '746500057456570395';
      } else if (isFaceToFaceICBC) {
        return item.shopProductId === '746500057456570393';
      } else {
        return item.shopProductId === '746500057456570394';
      }
    });
    list.push(faceToFaceList);
  }
  if (!list.length) {
    app.globalData.newPackagePageData = {};
    showToastNoIcon('未查询到套餐，请联系工作人员处理！');
    return;
  }
  const divideAndDivideList = list.filter(item => item.flowVersion === 1); // 分对分套餐
  const alwaysToAlwaysList = list.filter(item => item.flowVersion === 2 || item.flowVersion === 3); // 总对总套餐
  let type = !divideAndDivideList.length ? 2 : !alwaysToAlwaysList.length ? 1 : 0;
  app.globalData.newPackagePageData = {
    shopId: orderInfo.shopId || app.globalData.miniProgramServiceProvidersId, // 避免老流程没上传shopId
    listOfPackages: list,
    areaCode: '0',
    type,
    divideAndDivideList,
    alwaysToAlwaysList
  };
	await getFollowRequestLog({shopId: app.globalData.newPackagePageData.shopId, paramsShopId: params.shopId, orderId: app.globalData.orderInfo?.orderId, source: '根据商户查询套餐'});
  return result;
}
/**
 *  从网络获取数据
 * @param json 请求参数
 * @param success 成功后的回调g
 * @param fail 失败后的回调
 */
async function getDataFromServersV2(path, params = {}, method = 'POST', isLoading = true) {
  if (isLoading) showLoading();
  // common || public 模块下的不需要 token
  const token = app.globalData.userInfo.accessToken;
  if (!token && !path.includes('common') && !path.includes('public')) {
	  console.log(path)
    showToastNoIcon('获取用户信息失败,请重新进入小程序!');
    return;
  }
  method = method.toUpperCase();
  // 对请求路径是否开头带/进行处理
  path = path.indexOf('/') === 0 ? path : `/${path}`;
  // 封装请求对象
  let obj = {
    url: app.globalData.host + path,
    method: method
  };
  let header = {};
  // timestamp 时间戳  nonceStr随机字符串 uuid
  let timestamp, nonceStr;
  nonceStr = getUuid();
  if (app.globalData.isSystemTime) {
    if (app.globalData.systemTime) {
      timestamp = app.globalData.systemTime
    } else {
      timestamp = parseInt(new Date().getTime() / 1000);
    }
  } else {
    await getSystemTime().then(res => {
      timestamp = res;
    });
  }
  if (!timestamp) {
    timestamp = parseInt(new Date().getTime() / 1000);
  }
  if (app.globalData.userInfo?.memberId && !obj.url.includes('consumer/etc/nmg')) {
    params.memberId = app.globalData.userInfo.memberId;
  }
  // POST请求
  if (method === 'POST') {
    // 设置签名
    header = {
      sign: getSignature(params, path, token, timestamp, nonceStr),
      timestamp: timestamp,
      nonceStr: nonceStr
    };
    // 设置请求体
    obj['data'] = params;
  } else { // GET请求
    // 拼接请求路径
    let url = obj.url + '?';
    for (let key of Object.keys(params)) {
      url += `${key}=${params[key]}&`
    }
    url = url.substring(0, url.length - 1);
    obj.url = url;
    // 设置签名
    header = {
      sign: getSignature({}, obj.url.replace(app.globalData.host, ''), token, timestamp, nonceStr),
      timestamp: timestamp,
      nonceStr: nonceStr
    };
  }
  // 设置token
  if (token) {
    header.accessToken = token;
  }
  // 设置请求头
  obj.header = header;
  // 执行请求
  return await new Promise((resolve, reject) => {
    wx.request({
      url: obj.url,
      method: method,
      data: obj.data,
      header: obj.header,
      success: (res) => {
        if (res && res.statusCode === 200) {
          if (res.data.code === 115 || res.data.code === 117 || res.data.code === 118) { // 在别处登录了 重新自动登录一次
            reAutoLoginV2(path, params, method);
            return;
          } else if (res.data.code === 444) {
            // 请求已失效
            app.globalData.isSystemTime = false;
            app.globalData.systemTime = undefined;
            reAutoLoginV2(path, params, method);
            return;
          }
          // console.log(res.data);
          resolve(res.data)
        } else {
          reject(res)
        }
      },
      fail: (err) => {
        reject(err)
      },
      complete: () => {
        if (isLoading) hideLoading();
      }
    })
  });
}
/**
 * 签名错误 重新登录
 * @param path
 * @param params
 * @param fail
 * @param success
 * @param token
 * @param complete
 */
function reAutoLoginV2(path, params, method) {
  wx.login({
    success: async (r) => {
      // 自动登录
      let result = await getDataFromServersV2('consumer/member/common/applet/code', {
        platformId: app.globalData.platformId,
        code: r.code
      });
      if (result.code) {
        showToastNoIcon(result.message);
        return '';
      }
      app.globalData.userInfo = result.data;
      app.globalData.openId = result.data.openId;
      app.globalData.memberId = result.data.memberId;
      app.globalData.mobilePhone = result.data.mobilePhone;
      // 重新获取所需数据
      getDataFromServersV2(path, params, method);
    }
  });
}

// 加载订单详情
async function getETCDetail() {
  const result = await getDataFromServersV2('consumer/order/order-detail', {
    orderId: app.globalData.orderInfo.orderId
  });
  if (!result) return;
  let [contractTollInfo, contractPoundageInfo, contractBondInfo] = [undefined, undefined, undefined];
  if (result.code === 0) {
    result.data.multiContractList.map(item => {
      if (item.contractType === 1) {
        contractTollInfo = item;
      }
      if (item.contractType === 2) {
        contractPoundageInfo = item;
      }
      if (item.contractType === 3) {
        contractBondInfo = item;
      }
    });
  } else {
    showToastNoIcon(result.message);
  }
  return [contractTollInfo, contractPoundageInfo, contractBondInfo];
}
// 二类户绑卡到订单
async function updateOrderContractMappingBankAccountId(info, bankCardInfo) {
  const result = await getDataFromServersV2('consumer/order/updateOrderContractMappingBankAccountId', {
    id: info.id,
    bankAccountId: bankCardInfo.bankAccountId,
  });
  console.log(result);
  if (!result) return;
  let isOk = false;
  if (result.code === 0) {
    isOk = true;
  } else {
    showToastNoIcon(result.message);
  }
  return isOk;
}
// 获取二类户号信息
async function getV2BankId() {
  const result = await getDataFromServersV2('consumer/member/icbcv2/getV2BankId');
  if (!result) return;
  if (result.code) {
    showToastNoIcon(result.message);
    return;
  }
  app.globalData.bankCardInfo = result.data;
  return result.data;
}
// 货车-查询车主服务签约
async function queryContractForTruckHandling() {
  showLoading({
    title: '签约查询中...'
  });
  const result = await getDataFromServersV2('consumer/order/newTrucksContractQuery', {
    orderId: this.globalData.orderInfo.orderId,
    immediately: true
  });
  if (!result) return;
  let isOk = false;
  if (result.code === 0) {
    this.globalData.signAContract = 3;
    // 签约成功 userState: "NORMAL"
    if (result.data.contractStatus === 1) {
      isOk = true;
    } else {
      showToastNoIcon('未签约成功！');
    }
  } else {
    showToastNoIcon(result.message);
  }
  return isOk;
}
// 查询是否存在触发记录
async function queryProtocolRecord(protocolType) {
  const result = await getDataFromServersV2('consumer/member/queryProtocolRecord', {
    platformId: app.globalData.platformId,
    memberId: app.globalData.memberId,
    protocolType: protocolType
  }, 'POST', false);
  if (!result) return;
  let isOk = false;
  if (result.code === 0) {
    isOk = result.data;
  } else {
    showToastNoIcon(result.message);
  }
  return isOk;
}
async function getRightAccount() {
  const result = await getDataFromServersV2('/consumer/member/right/account', {
    page: 1,
    pageSize: 1
  }, 'POST', false);
  if (result.code) {} else {
    app.globalData.accountList = result.data;
    app.globalData.isEquityRights = result.data?.length;
  }
}
// 提交触发记录
async function addProtocolRecord(protocolType) {
  const result = await getDataFromServersV2('consumer/member/addProtocolRecord', {
    platformId: app.globalData.platformId,
    memberId: app.globalData.memberId,
    protocolType: protocolType
  });
  if (!result) return;
  let isOk = false;
  if (result.code === 0) {
    isOk = true;
  } else {
    showToastNoIcon(result.message);
  }
  return isOk;
}
// 获取用户是否欠费
async function getIsArrearage() {
  if (app.globalData.isArrearageData.etcMoney && !app.globalData.isArrearageData.isPayment) {
    // 已有欠款 & 并未补缴
    alertPayment(app.globalData.isArrearageData.etcMoney);
    return;
  }
  if (JSON.stringify(app.globalData.myEtcList) === '{}') {
    await getEtcList();
  } else {
    await getObuCardType();
  }
}
// 获取渠道列表
async function getObuCardType() {
  let obuCardType = [];
  let trucksOrder = [];
  app.globalData.myEtcList.map(item => {
    if (item.obuStatus === 1 || item.obuStatus === 2 || item.obuStatus === 5) {
      if (item.obuCardType !== 21) {
        obuCardType.push(item.obuCardType);
      } else {
        trucksOrder.push(item.id);
      }
    }
  }); // 1 已激活  2 恢复订单  5 预激活
  app.globalData.isArrearageData.trucksOrderList = trucksOrder;
  obuCardType = [...new Set(obuCardType)];
  await getArrearageTheBill(obuCardType, trucksOrder);
}
// 获取用户是否欠费
async function getEtcList() {
  let params = {
    openId: app.globalData.openId
  };
  const result = await getDataFromServersV2('consumer/order/my-etc-list', params);
  if (!result) return;
  if (result.code === 0) {
    app.globalData.myEtcList = result.data;
    await getObuCardType();
  } else {
    showToastNoIcon(result.message);
  }
}
// 查询欠费账单
async function getArrearageTheBill(obuCardType, trucksOrder) {
  if (trucksOrder.length) {
    const info = await getDataFromServersV2('consumer/etc/judge-detail-channels-truck', {
      orderNos: trucksOrder
      // orderNos: ["859745153131220992","859745153131220993"]
    });
    if (!info) return;
    if (info.code) {
      showToastNoIcon(info.message);
      return;
    }
    app.globalData.isArrearageData.isTrucksPayment = false;
    app.globalData.isArrearageData.etcTrucksMoney = info.data.etcMoney;
  }
  if (!obuCardType.length) {
    return;
  }
  const result = await getDataFromServersV2('consumer/etc/judge-detail-channels', {
    channels: obuCardType
  });
  if (!result) return;
  if (result.code) {
    showToastNoIcon(result.message);
    return;
  }
  if (!result.data) return;
  if (result.data.totalAmout) {
    app.globalData.isArrearageData.isPayment = false;
    app.globalData.isArrearageData.etcMoney = result.data.totalAmout;
    alertPayment(result.data.totalAmout, false);
    return;
  }
  if (app.globalData.isArrearageData.etcTrucksMoney) {
    alertPayment(app.globalData.isArrearageData.etcTrucksMoney, true);
  }
}

function alertPayment(etcMoney, isTruck) {
  alert({
    title: `请尽快补缴欠款`,
    content: `你已欠款${etcMoney / 100}元，将影响正常的高速通行`,
    showCancel: true,
    confirmColor: '#576b95',
    cancelText: '取消',
    confirmText: '立刻补缴',
    confirm: () => {
      if (isTruck) {
        go(`/pages/account_management/precharge_account_details/precharge_account_details?Id=${app.globalData.isArrearageData.trucksOrderList[0]}`);
        return;
      }
      go('/pages/personal_center/arrears_bill/arrears_bill');
    }
  });
}
// @cyl 时间比较=》 fixedTime: 固定时间，flexibleTime: 灵活时间。 适用于：根据某个时间前后来判断订单是否为新
function timeComparison(fixedTime, flexibleTime) {
  fixedTime = fixedTime.slice(0, 19).replace(new RegExp('-', 'g'), '/'); //转换是为了iPhone
  flexibleTime = flexibleTime.slice(0, 19).replace(new RegExp('-', 'g'), '/');
  let time = (new Date(fixedTime)).getTime()
  let newTime = (new Date(flexibleTime)).getTime()
  if (time <= newTime) {
    return 1 //新订单
  } else {
    return 2 //旧订单
  }
};
// 自定义tabbar  做唯一标识
function customTabbar(that, num) {
  if (typeof that.getTabBar === 'function' &&
    that.getTabBar()) {
    that.getTabBar().setData({
      // 唯一标识（其它设置不同的整数）
      selected: num,
      index: num
    });
  }
};
// 防止点击重复触发
function fangDou(that, fn, time) {
  return (function () {
    if (that.data.timeout) {
      clearTimeout(that.data.timeout);
    }
    that.data.timeout = setTimeout(() => {
      fn.apply(that, arguments);
    }, time);
  })();
}
// 激活后返回
function returnMiniProgram() {
  wx.reLaunch({
    url: `/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${app.globalData.orderInfo.orderId}`
  })
}
// 获取用户是否 ETC+Plus用户
async function getUserIsVip() {
  const result = await getDataFromServersV2('consumer/order/member/userType', {}, 'POST', false);
  if (!result) return;
  if (result.code === 0) {
    if (result.data.userType === 2) {
      app.globalData.isVip = true
    } else {
      app.globalData.isVip = false
    }
  } else {
    showToastNoIcon(result.message);
  }
}
async function handleBluetoothStatus() {
  return new Promise(async (resolve, callback) => {
    if (!await isOpenBluetooth()) {
      alert({
        title: '蓝牙中断',
        content: '检测到您的蓝牙链接中断\n请重新链接',
        confirmText: '重新连接',
        showCancel: false,
        confirm: () => {
          resolve(true);
        },
        cancel: () => {
          resolve(false);
        }
      });
    } else {
      return false;
    }
  });
}
// channel - 名称 字典
let channelNameMap = {
  1: '黔通卡',
  2: '蒙通卡',
  3: '鲁通卡',
  4: '青通卡',
  5: '速通卡',
  6: '三秦通卡',
  7: '粤通卡',
  8: '辽通卡',
  9: '齐鲁通卡',
  10: '湘通卡',
  11: '龙通卡',
};
// 获取平安绑车车牌列表
async function getBindGuests() {
  let obj = undefined;
  const result = await getDataFromServersV2('consumer/order/pingan/get-bind-veh-keys', {}, 'POST', false);
  if (!result) return;
  if (result.code === 0) {
    obj = result.data;
    const res = await getDataFromServersV2('consumer/order/displayAdvertisingVehplates', {}, 'POST', false);
    if (!res) return;
    if (res.code === 0) {
      obj.pingAnBindVehplates =  res.data.vehplates.join();
      app.globalData.pingAnBindGuests = obj
      return obj
    } else {
      showToastNoIcon(res.message);
    }
  } else {
    showToastNoIcon(result.message);
  }
};
// 日志
async function getFollowRequestLog(params) {
  await getDataFromServersV2('consumer/order/followRequestLog', params, 'POST', false);
}
/**
 * 打开 .pdf 文件
 * @param {*} url 网络文件的地址
 * @param {*} category 协议归类：1-办理协议 2-高速协议 3-隐私协议 4-保理协议 5-通用协议
 */
function openPdf(url, category) {
  const fileExtName = '.pdf';
  let name = ['办理协议', '高速协议', '隐私协议', '保理协议', '通用协议'];
  const randfile = name[category - 1] + fileExtName;
  const newPath = `${wx.env.USER_DATA_PATH}/${randfile}`; // 定义一个临时路径
  deletContract(); // 将本地文件删除
  wx.downloadFile({
    url: url, // 网络文件的地址
    header: {
      'content-type': 'application/pdf'
    },
    filePath: newPath,
    success: function (res) {
      const filePath = res.tempFilePath;
      wx.openDocument({
        filePath: newPath,
        showMenu: true,
        fileType: 'pdf',
        success: function (res) {},
        fail: function (res) {
          showToastNoIcon(res)
        }
      });
    },
    fail: function (res) {
      wx.hideLoading();
      showToastNoIcon(res)
    }
  });
};
// 删除本地文件
function deletContract() {
  try {
    let file = wx.getFileSystemManager();
    file.readdir({
      dirPath: `${wx.env.USER_DATA_PATH}`,
      success: (res) => {
        if (res.files.length > 2) {
          file.unlink({
            filePath: `${wx.env.USER_DATA_PATH}/${res.files[0]}`,
            complete: (res) => {}
          });
        }
      }
    });
  } catch (error) {
    showToastNoIcon(error)
  }
};

function getCurrentDate () {
	const currentDate = new Date();
	// 提取年、月、日信息
	const year = currentDate.getFullYear(); // 四位数表示年份
	const month = (currentDate.getMonth() + 1).toString().padStart(2, '0'); // 两位数表示月份，需要加上1
	const day = currentDate.getDate().toString().padStart(2, '0'); // 两位数表示天数
	// 构建当前日期字符串
	const formattedCurrentDate = `${year}${month}${day}`;
	const nextDate = `${year + 10}${month}${day}`;
	// 判断指定日期是否在当前日期之前或者相同
	return [formattedCurrentDate, nextDate]
}

function getDatanexusAnalysis (actionType) {
	let timestamp, nonceStr;
	nonceStr = getUuid();
	if (!timestamp) {
		timestamp = parseInt(new Date().getTime() / 1000);
	}
	wx.request({
		// https://datanexus.qq.com/doc/develop/guider/interface/action/dmp_actions_add
		// https://developers.e.qq.com/docs/api/user_data/user_action/user_actions_add?version=1.3
		url: `https://api.e.qq.com/v1.3/user_actions/add?access_token=e99dabed71962b695abc2769b1bd97e4&timestamp=${timestamp}&nonce=${nonceStr}`,
		data: {
			account_id: '35362489',
			user_action_set_id: '1202153505',
			'actions': [
				{
					'external_action_id': actionType,
					'action_time': timestamp,
					'action_type': actionType, // 下单  https://datanexus.qq.com/doc/develop/guider/interface/enum#action-type
					'action_param': {
						'claim_type': 0,// 归因方式  https://datanexus.qq.com/doc/develop/guider/interface/enum#claim-type
						'consult_type': 'ONLINE_CONSULT'
					},
					'trace': {
						'click_id': app.globalData.openId // 点击ID，user_id 与 click_id 二选一必填，广点通的click_id长度是20位数字+字母组合；微信的click_id长度是10-50，如wx0im5kwh44gh2yq，字段长度为 64 字节
					},
					'channel': 'TENCENT' // 行为渠道  https://datanexus.qq.com/doc/develop/guider/interface/enum#action-channel
				}
			]
		},
		method: 'POST',
		header: {},
		success (res) {
			console.log(res);
		},
		fail (res) {
			console.log(res);
		}
	});
}
/**
 * 计算卡片有效期
 * @param res 对象
 * @returns {*}
 */
function calculationValidityPeriod (res) {
	let currentTime = Date.now();
	let time = new Date('2020/01/01');
	let date = new Date();
	let fullYear = date.getFullYear();
	let month = date.getMonth() + 1;
	month = month < 10 ? '0' + month : month;
	let day = date.getDate();
	day = day < 10 ? '0' + day : day;
	//  写入卡片的时间都为当前时间
	res.cardEnableTime = `${fullYear}-${month}-${day}`;
	res.cardExpireTime = `${fullYear + 10}-${month}-${day}`;
	// 写入obu时间
	// 2020/01/01之后 或者非货车
	// carType 11 12分别为蓝牌货车 黄牌货车
	if (((res.carType === 11 || res.carType === 12) && currentTime >= time.getTime()) || (res.carType === 1 || res.carType === 2)) {
		res.enableTime = `${fullYear}-${month}-${day}`;
		res.expireTime = `${fullYear + 10}-${month}-${day}`;
	} else {
		// 启用时间为2020年一月一日
		res.enableTime = '2020-01-01';
		res.expireTime = '2030-01-01'
	}
	return res;
}
/**
 *  校验二发订单数据合法性
 * @param info
 * let info = {
			"enableTime": "2019-09-29",
			"expireTime": "2029-09-29",
			"plateNo": "晋JAM087",
			"plateColor": 0,
			"carType": 1,
			"userName": "杨江",
			"userIdNum": "141122198806220013",
			"userIdType": "0",
			"type": 1,
			"outsideDimensions": "4671×1902×1697mm",
			"engineNum": "J100045411111111",
			"approvedCount": "5人"
		}
 * @returns {boolean}
 */
function validateOnlineDistribution(encodeToGb2312, info, self) {
	let isOk = true;
	let msg = '';
	// 姓名是否为空
	if (!info.userName) {
		isOk = false;
		msg = '姓名为空，请检查！';
	} else { //姓名编码校验
		try {
			encodeToGb2312(info.userName);
		} catch (e) {
			// 姓名编码异常
			isOk = false;
			msg = '姓名编码转换出错，请检查！';
		}
	}
	
	// 车牌是否为空
	if (!info.plateNo) {
		isOk = false;
		msg = '车牌为空，请检查！';
	} else { // 车牌编码校验
		try {
			encodeToGb2312(info.plateNo);
		} catch (e) {
			// 车牌编码异常
			isOk = false;
			msg = '车牌编码转换出错，请检查！';
		}
	}
	
	// 轮廓尺寸校验
	if (!info.outsideDimensions) {
		isOk = false;
		msg = '轮廓尺寸为空，请检查！';
	} else {
		let result = info.outsideDimensions.match(/\d{4}/ig);
		if (result.length !== 3) {
			isOk = false;
			msg = '轮廓尺寸有误，请检查！';
		}
	}
	if (!info.engineNum) {
		isOk = false;
		msg = '发动机引擎编号为空，请检查！';
	} else {
		// 发动机长度校验
		if (info.engineNum.length > 16) {
			isOk = false;
			msg = '发动机引擎编号过长，请检查！';
		}
	}
	if (!isOk) {
		self.isOver();
		showToastNoIcon(msg);
	}
	return isOk;
}
/**
 * TODO 暂时没提供2.0接口
 * 发送错误信息到服务器
 * @param area 区域表示 如青海二发金溢
 * @param cosArr 指令数组 如：['00A40000023F00', '0084000004']
 * @param code 执行执行返回的code 如果没有 填-1
 * @param result 指令执行的结果
 */
function sendException2Server(area, cosArr, code, result) {
	return;
}
module.exports = {
  setApp,
  returnMiniProgram,
	calculationValidityPeriod,
	validateOnlineDistribution,
	sendException2Server,
	getDatanexusAnalysis,
  formatNumber,
  addProtocolRecord,
  handleBluetoothStatus,
  queryProtocolRecord,
  getRpx,
	getCurrentDate,
  getPx,
  getMemberStatus,
  goMicroInsuranceVehicleOwner,
  getDataFromServer, // 从服务器上获取数据
  getIsArrearage,
  alertPayment,
  parseBase64,
  formatTime, // 格式化时间
  go, // 常规跳转
  showToastNoIcon,
  isGreaterThanData,
  isDuringDate,
  isDuringDateIdCard,
  isTimeQuantum,
  uploadOcrFile,
  uploadFile,
  isJsonString,
  alert,
  showLoading,
  hideLoading,
  getDateDiff,
  mobilePhoneReplace,
	getFollowRequestLog,
  encryptByDESModeEBC,
  decryptByDESModeEBC,
  compareVersion,
  getInfoByAddress,
  getAddressInfo,
  getSignature,
  luhmCheck,
  resetData,
  getTruckHandlingStatus,
  getStatus,
  subscribe,
  channelNameMap,
  getHandlingType,
  getStatusFirstVersion,
  goHome,
  getInsuranceOffer,
  initLocationInfo,
  getListOfPackages,
  wxAnimation,
  getDataFromServersV2,
  getETCDetail,
  getUuid,
  updateOrderContractMappingBankAccountId,
  queryContractForTruckHandling,
  getV2BankId,
  weChatSigning,
  timeComparison,
  customTabbar,
  fangDou,
  getRightAccount,
  getUserIsVip,
  getBindGuests,
  openPdf,
  getAddressInfoGD
};
