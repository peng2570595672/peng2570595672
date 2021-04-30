/**
 * @author llfob
 * @date 2018/5/16
 * @description 共用函数
 * @version 1.0
 */
const CryptoJS = require('./crypto-js.js');
const QQMapWX = require('../libs/qqmap-wx-jssdk.min.js');
let app = getApp();

function setApp(a) {
	console.log(1);
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
function md5Encrypt(message,) {
	return CryptoJS.MD5(message).toString();
}

// 签名
function sign(obj,) {
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
function signature(params, path, token = '',  timestamp, nonceStr) {
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
	let timestamp,nonceStr;
	nonceStr = getUuid();
	if (app.globalData.isSystemTime) {
		if (app.globalData.systemTime) {
			timestamp = app.globalData.systemTime
		} else{
			timestamp = parseInt(new Date().getTime() /1000);
		}
	} else {
		await getSystemTime().then(res => {
			timestamp = res;
		});
	}
	if (!timestamp) {
		timestamp = parseInt(new Date().getTime() /1000);
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
			timestamp:timestamp,
			nonceStr:nonceStr
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
function getSystemTime () {
	return new Promise((resolve, callback ) => {
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
			fail: (res) => {
			},
			complete: (res) => {
			}
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
 *  弹出吐司提示 不带icon
 * @param content 提示内容
 */
function showToastNoIcon(content) {
	setTimeout(() => {
		wx.showToast({
			title: content,
			icon: 'none',
			duration: 2000
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
	               confirm = () => {
	               },
	               cancel = () => {
	               }
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
		complete: function (res) {
		}
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

	if (lastNum === luhm) {
		return true;
	} else {
		return false;
	}
};
/**
 *  获取货车新流程订单办理状态 2.0
 */
function getTruckHandlingStatus(orderInfo) {
	let status = 0;
	if (orderInfo.shopProductId === 0) {
		status = 1;// 办理中 未选套餐
	} else if (orderInfo.shopProductId !== 0 && orderInfo.status === 0) {
		status = 3; // 办理中 已选套餐
	} else if (orderInfo.status === 1 && orderInfo.contractStatus !== 1) {
		status = 2; // 待签约
	} else if (orderInfo.contractStatus === 1 && orderInfo.auditStatus === 0) {
		status = 4; // 查看进度 待审核
	} else if (orderInfo.status === 1 && orderInfo.auditStatus === 1) {
		status = 5; // 资料被拒绝 修改资料
	} else if (orderInfo.auditStatus === 2 && (orderInfo.obuStatus === 0 || orderInfo.obuStatus === 5)) {
		status = 6; // 审核通过  待激活
	} else if ((orderInfo.obuStatus === 0 || orderInfo.obuStatus === 5)  && orderInfo.auditStatus === 3) {
		status = 7; // 预审核通过  待审核
	} else if ((orderInfo.obuStatus === 0 || orderInfo.obuStatus === 5)  && orderInfo.auditStatus === 9) {
		status = 8; // 高速核验不通过
	} else if (orderInfo.obuStatus === 1 && orderInfo.auditStatus === 2) {
		status = 9; // 审核通过  已激活
	}
	if (orderInfo.status === 0 && orderInfo.isOwner === 1 && orderInfo.isVehicle === 1 && orderInfo.isHeadstock === 1) {
		if (orderInfo.isTraction === 0 || (orderInfo.isTraction === 1 && orderInfo.isTransportLicense === 1)) {
			if (orderInfo.pledgeStatus === 0) {
				// pledgeStatus 状态，-1 无需支付 0-待支付，1-已支付，2-退款中，3-退款成功，4-退款失败
				status = 11; // 待支付
			} else {
				status = 2;
			}
		}
	}
	return status;
}
/**
 *  获取订单办理状态 2.0
 */
function getStatus(orderInfo) {
	let status = 0;
	// deliveryRule 先签约后发货-0、先发货后签约-1
	if (orderInfo.deliveryRule === 1 && orderInfo.status === 1) {
		const statusObj = {
			0: 4,// 查看进度 待审核
			1: 5,// 资料被拒绝 修改资料
			// 审核通过   签约状态不为1,去签约 : obu状态为1 已激活 :  待激活
			2: orderInfo.contractStatus !== 1 ? 2 : orderInfo.obuStatus === 1 ? 9 : 6,
			3: 4,// 查看进度 预审核
		};
		status = statusObj[orderInfo.auditStatus] ? statusObj[orderInfo.auditStatus] : 8;
	} else {
		if (orderInfo.shopProductId === 0) {
			status = 1;// 办理中 未选套餐 || 待支付
		} else if (orderInfo.status === 0 && orderInfo.shopProductId !== 0 && (orderInfo.pledgeStatus === -1 || orderInfo.pledgeStatus === 1)) {
			status = 3; // 办理中 已选套餐 && (无需支付  ||  已经支付)
		} else if (orderInfo.status === 1 && orderInfo.contractStatus !== 1) {
			status = 2; // 待签约
		} else if (orderInfo.contractStatus === 1 && orderInfo.auditStatus === 0) {
			status = 4; // 查看进度 待审核
		} else if (orderInfo.status === 1 && orderInfo.auditStatus === 1) {
			status = 5; // 资料被拒绝 修改资料
		} else if (orderInfo.auditStatus === 2 && (orderInfo.obuStatus === 0 || orderInfo.obuStatus === 5)) {
			status = 6; // 审核通过  待激活
		} else if ((orderInfo.obuStatus === 0 || orderInfo.obuStatus === 5)  && orderInfo.auditStatus === 3) {
			status = 7; // 预审核通过  待审核
		} else if ((orderInfo.obuStatus === 0 || orderInfo.obuStatus === 5)  && orderInfo.auditStatus === 9) {
			status = 8; // 高速核验不通过
		} else if (orderInfo.obuStatus === 1 && orderInfo.auditStatus === 2) {
			status = 9; // 审核通过  已激活
		}
	}
	// 审核通过  未高速签约
	// hwContractStatus 高速签约状态，0-未签约，1-已签约  2-解约
	if (orderInfo.auditStatus === 2 && orderInfo.flowVersion === 2 && orderInfo.hwContractStatus !== 1) status = 10; // 待签约高速
	// 不需要审核,为了不改动之前的,所以单独判断
	if (orderInfo.auditStatus === -1 && orderInfo.status === 1) status = orderInfo.contractStatus !== 1 ? 2 : orderInfo.obuStatus !== 1 ? 6 : 9;
	// pledgeStatus 状态，-1 无需支付 0-待支付，1-已支付，2-退款中，3-退款成功，4-退款失败
	status = orderInfo.pledgeStatus === 0 ? 11 : status
	return status;
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
	} else if ((orderInfo.obuStatus === 0 || orderInfo.obuStatus === 5)  && orderInfo.auditStatus === 2) {
		status = 6; // 审核通过  待激活
	} else if ((orderInfo.obuStatus === 0 || orderInfo.obuStatus === 5)  && orderInfo.auditStatus === 3) {
		status = 7; // 预审核通过  待审核
	} else if ((orderInfo.obuStatus === 0 || orderInfo.obuStatus === 5)  && orderInfo.auditStatus === 9) {
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
	app.globalData.otherPlatformsServiceProvidersId = undefined;
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
	app.globalData.otherEntrance = {};// 初始化其它入口
}
/**
 *  获取办理车辆类型  货车/企业车辆限制(1.0)
 */
function getHandlingType(orderInfo) {
	if (orderInfo.isCrop === 1) {
		// 企业车辆
		return true;
	} else {
		if (orderInfo.carType === 11 || orderInfo.carType === 12 || orderInfo.carType === 13 ||
			orderInfo.carType === 14 || orderInfo.carType === 15 || orderInfo.carType === 16
		) {
			// carType：车辆归类：1,一型客车 2,二型客车   3,三型客车   4,四型客车   11,一型货车  12,二型货车  13,三型货车
			//14,四型货车  15,五型货车  16,六型货车  21,一型专项作业车  22,二型专项作业车  23,三型专项作业车  24,四型专项作业车  25,五型专项作业车  26,六型专业作业车
			return true;
		} else {
			return false;
		}
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
	const beginDate = new Date(beginDateStr);
	const endDate = new Date(endDateStr);
	if (curDate >= beginDate && curDate < endDate) {
		return true;
	}
	return false;
}
/**
 *  获取当前日期是在某时间段
 */
function isTimeQuantum(beginDateStr, endDateStr) {
	beginDateStr = beginDateStr.slice(0, 16).replace(new RegExp('-','g'), '/');
	endDateStr = endDateStr.slice(0, 16).replace(new RegExp('-','g'), '/');
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
				console.log(res);
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
									success: (res) => {
									},
									fail: () => {
										showToastNoIcon('打开设置界面失败，请重试！');
									}
								})
							},
							cancel: () => { // 点击取消按钮
								// if (url === '/pages/default/index/index') {
								if (url === '/pages/Home/Home') {
									wx.reLaunch({
										url: url
									});
								} else {
									go(url)
								}
							}
						});
					} else {
						if (url === '/pages/Home/Home') {
							// if (url === '/pages/default/index/index') {
							wx.reLaunch({
								url: url
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
						wx.reLaunch({
							url: url
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
								success: (res) => {
								},
								fail: () => {
									showToastNoIcon('打开设置界面失败，请重试！');
								}
							})
						},
						cancel: () => {
							// if (url === '/pages/default/index/index') {
							if (url === '/pages/Home/Home') {
								wx.reLaunch({
									url: url
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
					wx.reLaunch({
						url: url
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
	}, app.globalData.userInfo.accessToken, () => {
	});
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
	}, app.globalData.userInfo.accessToken, () => {
	});
}
function openWeiBao (pageUrl) {
	console.log(pageUrl);
	let appId = app.globalData.test ? 'wx7f3f0032b6e6f0cc':'wx06a561655ab8f5b2';
	wx.navigateToMiniProgram({
		appId: appId,
		path: pageUrl,
		envVersion: 'release',
		fail () {
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
			fail () {
				showToastNoIcon('调起车主服务签约失败, 请重试！');
			}
		});
	} else if (data.version === 'v2') { // 签约车主服务 2.0
		wx.navigateToMiniProgram({
			appId: 'wxbcad394b3d99dac9',
			path: 'pages/route/index',
			extraData: data.extraData,
			fail () {
				showToastNoIcon('调起车主服务签约失败, 请重试！');
			}
		});
	} else { // 签约车主服务 3.0
		wx.navigateToMiniProgram({
			appId: 'wxbcad394b3d99dac9',
			path: 'pages/etc/index',
			extraData: {
				preopen_id: data.extraData.peropen_id
			},
			fail () {
				showToastNoIcon('调起车主服务签约失败, 请重试！');
			}
		});
	}
}

// 创建动画
function wxAnimation(delay, site, translate) {
	let animation = wx.createAnimation({
		delay,
		duration: 500,
		timingFunction: 'ease'
	});
	if (translate === 'translateY') {
		animation.translateY(site).step();
	} else {
		animation.translateX(site).step();
	}
	return animation.export();
}
// 获取定位数据
function initLocationInfo (orderInfo) {
	// 是否缓存了定位信息
	let locationInfo = wx.getStorageSync('location-info');
	if (locationInfo) {
		let res = JSON.parse(locationInfo);
		let info = res.result.ad_info;
		// 获取区域编码
		let regionCode = [`${info.city_code.substring(3).substring(0, 2)}0000`, info.city_code.substring(3), info.adcode];
		const result = getListOfPackages(orderInfo, regionCode)
		if (result) {
			return result
		}
		return '';
	}
	// 定位
	return getLocationInfo(orderInfo);
}
// 授权定位
async function getLocationInfo (orderInfo) {
	showLoading();
	let res = await new Promise((resolve, reject) => {
		wx.getLocation({
			type: 'wgs84',
			success: async (res) => {
				getAddressInfo(res.latitude, res.longitude,  (res) => {
					wx.setStorageSync('location-info',JSON.stringify(res));
					let info = res.result.ad_info;
					let regionCode = [`${info.city_code.substring(3).substring(0, 2)}0000`, info.city_code.substring(3), info.adcode];
					resolve(regionCode)
				},  () => {
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
				} else if (res.errMsg === 'getLocation:fail:ERROR_NOCELL&WIFI_LOCATIONSWITCHOFF' || res.errMsg === 'getLocation:fail system permission denied') {
					showToastNoIcon('请开启手机或微信定位功能！');
				}
			}
		});
	})
	return getListOfPackages(orderInfo, res);
}
// 获取套餐列表
async function getListOfPackages (orderInfo, regionCode, notList) {
	showLoading();
	let params = {
		needRightsPackageIds: true,
		areaCode: regionCode[0] || 0,
		productType: 2,
		vehType: 1,
		platformId: app.globalData.platformId,
		shopId: orderInfo.shopId || app.globalData.miniProgramServiceProvidersId
	};
	let result = await getDataFromServersV2('consumer/system/get-usable-product', params);
	if (!result) return '';
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
		let arr = [1, 3, 4, 5, 6, 9, 12, 14, 17];// 推广类型
		if (arr.includes(orderInfo?.promoterType) || orderInfo.shopId === app.globalData.miniProgramServiceProvidersId) {
			showToastNoIcon('未查询到套餐，请联系工作人员处理！');
			return;
		}
		app.globalData.isServiceProvidersPackage = false; // 该服务商没有套餐
		getListOfPackages(orderInfo, regionCode, true);
	}
	let list = result.data;
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
	const divideAndDivideList = list.filter(item => item.flowVersion === 1);// 分对分套餐
	const alwaysToAlwaysList = list.filter(item => item.flowVersion === 2);// 总对总套餐
	let type = !divideAndDivideList.length ? 2 : !alwaysToAlwaysList.length ? 1 : 0;
	app.globalData.newPackagePageData = {
		shopId: orderInfo.shopId || app.globalData.miniProgramServiceProvidersId,// 避免老流程没上传shopId
		listOfPackages: list,
		areaCode: regionCode[0] || 0,
		type,
		divideAndDivideList,
		alwaysToAlwaysList
	};
	return result;
}
/**
 *  从网络获取数据
 * @param json 请求参数
 * @param success 成功后的回调g
 * @param fail 失败后的回调
 */
async function getDataFromServersV2(path, params, method = 'POST') {
	showLoading();
	// common || public 模块下的不需要 token
	const token = app.globalData.userInfo.accessToken;
	if (!token && !path.includes('common') && !path.includes('public')) {
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
	let timestamp,nonceStr;
	nonceStr = getUuid();
	if (app.globalData.isSystemTime) {
		if (app.globalData.systemTime) {
			timestamp = app.globalData.systemTime
		} else{
			timestamp = parseInt(new Date().getTime() /1000);
		}
	} else {
		await getSystemTime().then(res => {
			timestamp = res;
		});
	}
	if (!timestamp) {
		timestamp = parseInt(new Date().getTime() /1000);
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
			timestamp:timestamp,
			nonceStr:nonceStr
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
				if (res && res.statusCode == 200) {
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
					console.log(res.data);
					resolve(res.data)
				} else {
					reject(res)
				}
			},
			fail: (err) => {
				reject(err)
			},
			complete: () => {
				hideLoading();
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
module.exports = {
	setApp,
	formatNumber,
	goMicroInsuranceVehicleOwner,
	getDataFromServer, // 从服务器上获取数据
	parseBase64,
	formatTime, // 格式化时间
	go, // 常规跳转
	showToastNoIcon,
	isGreaterThanData,
	isDuringDate,
	isTimeQuantum,
	uploadOcrFile,
	uploadFile,
	isJsonString,
	alert,
	showLoading,
	hideLoading,
	getDateDiff,
	mobilePhoneReplace,
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
	getHandlingType,
	getStatusFirstVersion,
	goHome,
	getInsuranceOffer,
	initLocationInfo,
	getListOfPackages,
	wxAnimation,
	getDataFromServersV2,
	weChatSigning
};
