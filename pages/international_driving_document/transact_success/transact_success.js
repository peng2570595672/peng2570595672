const util = require('../../../utils/util.js');
Page({
	async onLoad () {
		// 查询是否欠款
		await util.getIsArrearage();
	},
	onClickMyOrder () {
		wx.uma.trackEvent('IDL_for_transact_success_to_my_order');
		let page = wx.getStorageSync('international-create');
		if (page === 3) {
			wx.navigateBack({
				delta: 3
			});
		} else {
			util.go(`/pages/international_driving_document/my_order/my_order`);
		}
	},
	onClickReturn () {
		wx.uma.trackEvent('IDL_for_transact_success_to_return_home');
		// 返回首页
		wx.switchTab({
			url: '/pages/Home/Home'
		});
	},
	// 订单咨询客服
	customerService () {
		wx.uma.trackEvent('IDL_for_transact_success_to_server');
		wx.makePhoneCall({
			phoneNumber: '10101020'
		});
	}
});
