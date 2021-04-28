const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		details: {}
	},
	onLoad () {
		// serviceCardVoucherDetails
		wx.setNavigationBarColor({
			frontColor: '#000000',
			backgroundColor: '#50DC92'
		});
		this.setData({
			backgroundColor: '#50DC92',
			details: app.globalData.serviceCardVoucherDetails
		});
	}
});
