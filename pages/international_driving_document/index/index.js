const util = require('../../../utils/util.js');
Page({
	onShow () {
	},
	onClickMyOrder () {
		wx.uma.trackEvent('IDL_for_index_to_my_order');
		wx.setStorageSync('international-create',3);
		util.go(`/pages/international_driving_document/my_order/my_order`);
	},
	onClickCreateOder () {
		wx.uma.trackEvent('IDL_for_index_to_deal_with');
		wx.setStorageSync('international-create',4);
		util.go(`/pages/international_driving_document/upload_license/upload_license`);
	},
	// 监听返回按钮
	onClickBackHandle () {
		if (this.data.isMain) {
			wx.navigateBack({
				delta: 1
			});
		} else {
			wx.reLaunch({
				url: '/pages/Home/Home'
			});
		}
	}
});
