/**
 * @author llfob
 * @date 2018/5/16
 * @description 共用函数
 * @version 1.0
 */
const CryptoJS = require('./crypto-js.js');
let app;

function setApp(a) {
	app = a;
}

// DES 加密
function desEncrypt(message) {
	let keyHex = CryptoJS.enc.Utf8.parse('&*^%(IU1');
	let encrypted = CryptoJS.DES.encrypt(message, keyHex, {
		mode: CryptoJS.mode.ECB,
		padding: CryptoJS.pad.Pkcs7
	});
	return encrypted.toString();
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
 * @param token token
 * @param online 是否为二发签名 plamKey不一样
 */
function signature(params, token = '', online) {
	// 先以对象key排序
	let keys = Object.keys(params).sort();
	let sign = '';
	// 顺序遍历
	for (let key of keys) {
		let value = params[key];
		// value是个对象
		if (typeof value === 'object') {
			// 对value为对象的数据进行序列化成字符串，然后按照ascii排序
			let v = JSON.stringify(params[key]);
			v = v.split('').sort().join('');
			sign += `${key}=${v}&`;
		} else { // 非对象
			if (value === undefined) {
				params[key] = '';
				sign += `${key}=&`;
			} else {
				sign += `${key}=${params[key]}&`;
			}
		}
	}
	let plamKey = online ? app.globalData.plamKey : app.globalData.plamSelfKey
	sign += token === '' ? `key=${plamKey}` : `key=${plamKey}&token=${token}`;
	return md5Encrypt(sign);
}
// 签名 二发调用
function getSignature(params, token = '') {
	return signature(params, token, true)
}

// 签名 小程序正常接口调用
function getSignatureForSelf(params, token = '') {
	return signature(params, token, true);
}

/**
 *  从网络获取数据
 * @param json 请求参数
 * @param success 成功后的回调g
 * @param fail 失败后的回调
 */
function getDataFromServer(path, params, fail, success, token = '', complete) {
	if (path.indexOf('consumer-etc') === -1) {
		path = path.replace('consumer', 'consumer-etc');
	}
	// 移除sign属性
	delete params.sign;
	params['sign'] = getSignatureForSelf(params, token);
	wx.request({
		url: app.globalData.host + path,
		method: 'POST',
		data: params,
		success: (res) => {
				// 做一次拦截
			if (res.data.code === 112) {
				showToastNoIcon('当前账户已在其他地方登录，请重新登录！');
				setTimeout(() => {
					wx.redirectTo({
						url: '/pages/login/login'
					});
				}, 3000);
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
	});
}

// 小于10的前补0操作
const formatNumber = (n) => {
	n = n.toString();
	return n[1] ? n : `0${n}`;
};

const format = (date) => {
	const year = date.getFullYear();
	const month = date.getMonth() + 1;
	const day = date.getDate();
	const hour = date.getHours();
	const minute = date.getMinutes();
	const second = date.getSeconds();
	if (date.getMilliseconds().toString().length === 3) {
		return [year, month, day].map(formatNumber).join('') + [hour, minute, second].map(formatNumber).join('') + date.getMilliseconds();
	}
	if (date.getMilliseconds().toString().length === 2) {
		return `${[year, month, day].map(formatNumber).join('') + [hour, minute, second].map(formatNumber).join('') + date.getMilliseconds()}0`;
	} else {
		return `${[year, month, day].map(formatNumber).join('') + [hour, minute, second].map(formatNumber).join('') + date.getMilliseconds()}00`;
	}
};
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
 *  拨打电话
 */
function phoneCall(phoneNumber) {
	wx.makePhoneCall({
		phoneNumber: phoneNumber
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
	               confirmColor = '#1FD1B1',
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
		success(res) {
			if (res.confirm) {
				confirm();
			} else if (res.cancel) {
				cancel();
			}
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
	return res.replace(reg,'$1****$2')
}


/**
 *  发送错误信息到服务器
 * @param area 区域表示 如青海二发金溢
 * @param cosArr 指令数组 如：['00A40000023F00', '0084000004']
 * @param code 执行执行返回的code 如果没有 填-1
 * @param result 指令执行的结果
 */
function sendException2Server(area, cosArr, code, result) {
	try {
		try {
			let r = JSON.stringify(result);
			result = r
		} catch (e) {
		}
		let msg = `【${area}】指令：=》 ${JSON.stringify(cosArr)} =》 code：${code} =》 执行结果：${result}`;
		getDataFromServer('consumer/etc/public/w_logger', {msg: msg}, () => {
			console.log('发送异常到服务器失败！');
		}, () => {
			console.log('发送异常到服务器成功！');
		});
	} catch (e) {
		console.log(e);
	}
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

module.exports = {
	setApp,
	getDataFromServer, // 从服务器上获取数据
	parseBase64,
	formatTime, // 格式化时间
	go, // 常规跳转
	phoneCall, // 拨打电话
	showToastNoIcon,
	uploadOcrFile,
	uploadFile,
	isJsonString,
	getSignature,
	alert,
	showLoading,
	getDateDiff,
	mobilePhoneReplace,
	sendException2Server,
	validateOnlineDistribution,
	calculationValidityPeriod
};
