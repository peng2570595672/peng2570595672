const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		details: {}
	},
	onLoad () {
		this.setData({
			details: app.globalData.serviceCardVoucherDetails
		});
	}
});
