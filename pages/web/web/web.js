const app = getApp();
const util = require('../../../utils/util.js');
Page({
	data: {
		url: ''
	},
	onLoad (options) {
		let url = '';
		console.log(options);
		if (options.type === 'violation_enquiry') {
			// url = `https://api.wesure.cn/app/h5-app-wedrive/index.html?checkIllegal=true&wtagid=116.75.3`;
			url = `https://api.wesure.cn/app/h5-app-wedrive/index.html?checkIllegal=true&wtagid=116.115.10`;
		} else if (options.type === 'banner') {
			url = decodeURIComponent(options.url);
		} else if (options.type === 'weiBao') {
			let wtagid;
			if (options.entrance && options.entrance === 'bill') {
				wtagid = '116.115.43';// 账单详情页进入微保
			} else {
				wtagid = '104.210.3';
			}
			// url = `https://api.wesure.cn/app/carinsure-new/driving/home/index.html?companyId=SJHT&wtagid=104.210.4`;
			// url = `https://api.wesure.cn/app/carinsure-new/driving/home/index.html?companyId=SJHT&outerUserId=${app.globalData.memberId}&wtagid=104.210.3`;
			url = `https://api.wesure.cn/app/carinsure-new/driving/home/index.html?companyId=SJHT&outerUserId=${app.globalData.memberId}&wtagid=${wtagid}`;
		} else if (options.type === 'online_customer_service') {
			let businessType = encodeURIComponent('ETC+在线客服');
			let cars = wx.getStorageSync('cars');
			let carStr = '';
			if (cars) {
				let reg = /([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9])([A-Z0-9]{2})([A-Z0-9]{2})/ig;
				if (cars.indexOf('、') !== -1) {
					cars = cars.split('、');
					for (let car of cars) {
						carStr += car.replace(reg, '$1**$3') + '_';
					}
					carStr = carStr.substring(0, carStr.length - 1);
				} else {
					carStr = cars.replace(reg, '$1**$3');
				}
				carStr = encodeURIComponent(carStr);
			}
			url = `https://jimi3-chat.jd.com/bot?venderId=1563354131534&BusinessType=${businessType}&RegStatus=1&UserId=${app.globalData.memberId}&PlateNo=${carStr}&userPin=${app.globalData.memberId}&UserTel=${app.globalData.mobilePhone}`;
		} else if (options.type === 'heaiche') {
			url = `https://dhwap.mlocso.com/haccarwash/html/carwash.html?app=07200053&p=cwash_game&mobile=${app.globalData.activityUrl}`;
			this.setData({
				url: url
			});
			return;
		} else {
		}
		this.setData({
			url: options.url ? decodeURIComponent(options.url) : encodeURI(url)
		});
	},
	loadHandle () {
		wx.setNavigationBarTitle({
			title: 'ETC+'
		});
	},
	getMessage (e) {
		console.log(e);
	}
});
