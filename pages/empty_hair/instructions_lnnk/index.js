const util = require('../../../utils/util.js');
Page({
	data: {
		auditStatus: 0
	},
	onLoad (options) {
		this.setData({
			auditStatus: +options.auditStatus
		});
		wx.canIUse('setBackgroundColor') && wx.setBackgroundColor({
			backgroundColor: '#fff',
			backgroundColorBottom: '#f6f7f8'
		});
	},
	onShow () {
	},
	next () {
		if (this.data.auditStatus !== 2) {
			util.showToastNoIcon('审核通过后才能激活');
			return;
		}
		wx.navigateToMiniProgram({
			appId: 'wx11015f60a39985eb',
			extraData: {},
			envVersion: 'release',
			fail: () => {
				util.showToastNoIcon('打开激活小程序失败');
			}
		});
	},
	showService () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	}
});
