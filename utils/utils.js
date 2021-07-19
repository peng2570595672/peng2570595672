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
