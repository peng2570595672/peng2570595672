export function initProductName (orderInfo) {
	// productProcess 套餐流程 1-微信 2-绑定银行 3-存量卡 4-三类户 5-信用卡
	if (orderInfo.flowVersion === 4) return 'ETC货车账户'
	if (orderInfo.productProcess === 1) return '微信支付'
	return orderInfo.productName || '';
}

// 比较两个日期
export function compareDate (date1, date2) {
	date1 = date1.slice(0, 16).replace(new RegExp('-','g'), '/');
	date2 = date2.slice(0, 16).replace(new RegExp('-','g'), '/');
	const newDate1 = new Date(date1);
	const newDate2 = new Date(date2);
	return newDate1 < newDate2;
}
// 弹窗
export function alert({
						  title = '提示',
						  content = '描述信息',
						  showCancel = false,
						  confirmText = '我知道了',
						  cancelText = '取消',
						  confirmColor = '$fontColor',
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
		}
	});
}
/**
 * 微信api回调形式转为promise调用形式
 * @param target
 * @param params
 * @param args
 */
export function wxApi2Promise(target, params = {}, ...args) {
	return new Promise((resolve, reject) => {
		params['success'] = (res) => {
			resolve(res);
		};
		params['fail'] = (error) => {
			reject(error);
		};
		target(params,...args);
	});
}
/**
 *  获取微信api返回
 *  @param target
 *  @param scope
 *  @param args
 */
export function wxApiPromise(target, scope = '', ...args) {
	const params = {};
	return new Promise((resolve, reject) => {
		params['success'] = (res) => {
			args.length && args[0].setData({
				showLoading: false
			});
			resolve(res);
		};
		params['fail'] = async (error) => {
			if (scope && !await haveAuth(`scope.${scope}`)) {
				authorizationUserInfo(scope, args);
				return;
			}
			args.length && args[0].setData({
				showLoading: false
			});
			reject(error);
		};
		target(params,...args);
	});
}
/**
 * 判断用户是否进行授权
 * @param scope
 */
export async function haveAuth(scope) {
	let haveAuth = false;
	const res = await getSetting();
	if (res.errMsg === 'getSetting:ok' && res.authSetting) {
		if (res.authSetting[scope] === true) {
			haveAuth = true;
		}
	}
	return haveAuth;
}
/**
 * 打开微信小程序设置界面
 */
export function openSetting() {
	return wxApiPromise(wx.openSetting);
}
/**
 * 获取小程序授权
 */
export function getSetting() {
	return wxApiPromise(wx.getSetting);
}
/**
 *  弹出吐司提示 不带icon
 * @param content 提示内容
 */
export function showToastNoIcon(content) {
	setTimeout(() => {
		wx.showToast({
			title: content,
			icon: 'none',
			duration: 2000
		});
	}, 100);
}
// 判断是否开启蓝牙
export function isOpenBluetooth () {
	return new Promise(function (resolve) {
		wx.openBluetoothAdapter({
			success: () => {
				resolve(true);
			},
			fail: () => {
				resolve(false);
			}
		});
	})
}
