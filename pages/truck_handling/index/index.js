/**
 * @author 老刘
 * @desc 签约成功
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
	},
	onLoad () {
		this.setData({
			mobilePhoneSystem: app.globalData.mobilePhoneSystem,
			mobilePhone: app.globalData.mobilePhone,
			screenHeight: wx.getSystemInfoSync().windowHeight
		});
	},
	onClickHandle () {
		util.go('/pages/truck_handling/truck_receiving_address/truck_receiving_address');
	},
	onclickDetail () {
		this.selectComponent('#passTheDiscount').show();
	},
	goOnlineServer () {
		// 未登录
		if (!app.globalData.userInfo.accessToken) {
			wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
			util.go('/pages/login/login/login');
			return;
		}
		util.go(`/pages/web/web/web?type=online_customer_service`);
	}
});
