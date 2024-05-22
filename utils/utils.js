import { IS_TEST } from "../app";

export function initProductName(orderInfo) {
	// productProcess 套餐流程 1-微信 2-绑定银行 3-存量卡 4-三类户 5-信用卡
	if (orderInfo.flowVersion === 4) return 'ETC货车账户'
	if (orderInfo.productProcess === 1) return '微信支付'
	return orderInfo.productName || '';
}
export function checkVehicleType(vehicleType) {
	let flag;
	const vehicleList = ['中型普通客车', '小型专用客车', '小型轿车', '小型普通客车', '小型面包车', '小型旅居车', '小型客车',
		'微型越野客车', '微型普通客车', '微型轿车', '轻型客车', '普通客车', '大型轿车', '小型越野客车', '轿车'];
	for (let name of vehicleList) {
		if (vehicleType === name) {
			flag = true;
		}
	}
	return flag;
}
// 签约通通券
export function thirdContractSigning(data) {
	wx.navigateToMiniProgram({
		appId: 'wxbd687630cd02ce1d',
		path: 'pages/index/index',
		extraData: data,
		fail() {
			showToastNoIcon('调起通通券签约失败, 请重试！');
		}
	});
}
// 跳转通通券小程序
export function jumpCouponMini() {
	wx.navigateToMiniProgram({
		appId: 'wx7e5d0f72c61b0c17',
		path: 'pages/index/index',
		fail() {
			showToastNoIcon('跳转通通券小程序失败, 请重试！');
		}
	});
}
// 比较两个日期
export function compareDate(date1, date2) {
	date1 = date1.slice(0, 16).replace(new RegExp('-', 'g'), '/');
	date2 = date2.slice(0, 16).replace(new RegExp('-', 'g'), '/');
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
	confirmColor = '#576B95',
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
		target(params, ...args);
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
		target(params, ...args);
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
export function isOpenBluetooth() {
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
// 将url路径转成json a=1&=2 => {a: 1,b: 2}
export function path2json(scene) {
	let arr = scene.split('&');
	let obj = {};
	let temp;
	for (let i = 0; i < arr.length; i++) {
		temp = arr[i].split('=');
		if (temp.length > 1) {
			obj[temp[0]] = temp[1];
		}
	}
	return obj;
}
// 排序
export function compare(prop) {
	return function (obj1, obj2) {
		const val1 = +obj1[prop];
		const val2 = +obj2[prop];
		if (val1 < val2) {
			return -1;
		} else if (val1 > val2) {
			return 1;
		} else {
			return 0;
		}
	};
}
// 跳转到湖南高速ETC小程序
export function handleJumpHunanMini(orderId, outTradeNo, selfStatus) {
	// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
	// /myPackage/service/newMineIssure/router/router?processCode=SJHT&promotionCode=推广码&accessNo=外部订单号&outTradeNo=微信支付单号
	let url = selfStatus === 32 ? encodeURIComponent(`/pages/homePage/Service/Service`) : encodeURIComponent(`/packageA/new-mineIssure/routerGo/routerGo?processCode=SJHT&accessNo=${orderId}&promotionCode=88880123&outTradeNo=${outTradeNo}`);
	// let url = selfStatus === 32 ? `/pages/service/index/index` : `/myPackage/service/newMineIssure/router/router?processCode=SJHT&promotionCode=88880123&accessNo=${orderId}&outTradeNo=${outTradeNo}`;
	console.log(`/pages/homePage/Index/Index?type=redirect&url=${url}`);
	wx.navigateToMiniProgram({
		appId: 'wxf546f6c7ccd8fbfe',
		path: `/pages/homePage/Index/Index?type=redirect&url=${url}`,
		envVersion: IS_TEST ? 'trial' : 'release',
		fail() {
			showToastNoIcon('调起小程序失败, 请重试！');
		}
	});
}
// 获取移动营业厅地址
export function getServiceHall(shopId) {
	let url = '';
	switch (shopId) {
		case '1214877114216488960':// 河南移动测试商户
		case '1214873729308827648':// 河南移动生产商户
			if (IS_TEST) {
				url = `https://hsh${IS_TEST ? '-pre' : ''}.cyzl.com/henan_cloud/index.html#/meng-dian-daohang?brandId=${IS_TEST ? '1178718844162678784' : '1219605507881312256'}`;
			} else {
				url = `https://hsh.cyzl.com/mendian_daohang/index.html#/index?brandId=1219605507881312256`;
			}
			break;
		default:
			break;
	}
	return url;
}
