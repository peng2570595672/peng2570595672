const util = require('../../../utils/util.js');
Page({
	data: {
		orderInfo: {} // 订单详情
	},
	onLoad () {
		let orderInfo = wx.getStorageSync('international-order_detail');
		orderInfo = JSON.parse(orderInfo);
		this.setData({
			orderInfo
		});
	},
	// 继续办理
	onClickContinueHandle () {
		wx.uma.trackEvent('IDL_for_order_detail_to_continue_deal_with');
		util.go(`/pages/international_driving_document/express_information/express_information?orderInfo=${JSON.stringify(this.data.orderInfo)}`);
	},
	// 订单咨询客服
	customerService () {
		wx.uma.trackEvent('IDL_for_order_detail_to_server');
		wx.makePhoneCall({
			phoneNumber: '10101020'
		});
	}
});
