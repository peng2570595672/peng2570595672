const util = require('../../../utils/util.js');
Page({
	data: {
	},
	async onLoad () {
		// 查询是否欠款
		await util.getIsArrearage();
	},
	online () {
		wx.uma.trackEvent('characteristic_service_for_server');
		util.go(`/pages/web/web/web?type=online_customer_service`);
	}
});
