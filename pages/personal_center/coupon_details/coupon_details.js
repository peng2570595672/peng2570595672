const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		details: {}
	},
	async onLoad () {
		this.setData({
			details: app.globalData.serviceCardVoucherDetails
		});
		// 查询是否欠款
		await util.getIsArrearage();
	}
});
