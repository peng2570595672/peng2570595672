const util = require('../../../utils/util.js');
Page({
	data: {
		auditStatus: 0
	},
	onLoad (options) {
		this.setData({
			auditStatus: options.auditStatus
		});
		wx.canIUse('setBackgroundColor') && wx.setBackgroundColor({
			backgroundColor: '#fff',
			backgroundColorBottom: '#f6f7f8'
		});
	},
	onShow () {
	},
	showService () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	}
});
