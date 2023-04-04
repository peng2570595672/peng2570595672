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
		} else if (options.type === 'CPC_hospitality') {
			url = decodeURIComponent(options.url);
		} else if (options.type === 'weiBao') {
			let wtagid;
			if (options.entrance && options.entrance === 'bill') {
				wtagid = '116.115.44';// 账单详情页进入微保
			} else {
				wtagid = '104.210.3';
			}
			if (app.globalData.host.includes('etctest')) {
				// 测试
				url = `https://static-dsu.wesure.cn/sitapp/app2/h5-mobile/home?wtagid=${wtagid}&companyId=SJHT&outerUserId=${app.globalData.memberId}`;
			} else {
				// 正式
				url = `https://static.wesure.cn/app2/h5-mobile/home?wtagid=${wtagid}&companyId=SJHT&outerUserId=${app.globalData.memberId}`;
			}
			// url = `https://api.wesure.cn/app/carinsure-new/driving/home/index.html?companyId=SJHT&wtagid=104.210.4`;
			// url = `https://api.wesure.cn/app/carinsure-new/driving/home/index.html?companyId=SJHT&outerUserId=${app.globalData.memberId}&wtagid=104.210.3`;
			// url = `https://static.wesure.cn/app2/h5-mobile/home?companyId=ETC&outerUserId=${app.globalData.memberId}&wtagid=${wtagid}`;
		} else if (options.type === 'online_customer_service') {
			url = `https://wpa1.qq.com/GhL5oRJ0?_type=wpa&qidian=true`;
		} else if (options.type === 'heaiche') {
			url = `https://dhwap.mlocso.com/haccarwash/html/carwash.html?app=07200053&p=cwash_game&mobile=${app.globalData.activityUrl}`;
			this.setData({
				url: url
			});
			return;
		} else if (options.type === 'moving_integral') {
			url = `https://h5.couponto.cn/jf_exchange/?activityListId=159294188336701440`;
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
