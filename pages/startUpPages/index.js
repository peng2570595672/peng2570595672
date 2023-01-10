// pages/startUpPages/index.js
const util = require('../../utils/util.js');
const app = getApp();
Page({
	data: {

	},

	onLoad (options) {
		this.login();
	},

	onShow () {

	},

	// 自动登录
	login () {
		// 调用微信接口获取code
		wx.login({
			success: async (res) => {
				const result = await util.getDataFromServersV2(
					'consumer/member/common/applet/code', {
						platformId: app.globalData.platformId, // 平台id
						code: res.code // 从微信获取的code
					});
				if (!result) return;
				if (result.code === 0) {
					result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data
						.mobilePhone);
					// 已经绑定了手机号
					if (result.data.needBindingPhone !== 1) {
						app.globalData.userInfo = result.data;
						app.globalData.openId = result.data.openId;
						app.globalData.memberId = result.data.memberId;
						app.globalData.mobilePhone = result.data.mobilePhone;
						this.getOrderList();
					} else {
// ----差东西---------------------------
					}
				} else {
					util.showToastNoIcon(result.message);
				}
			},
			fail: () => {
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	// 查询订单列表
	async getOrderList () {
		let params = { openId: app.globalData.openId };
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', params);
		if (result.code === 0) {
			if (result.data.length > 0) {
				wx.switchTab({
					url: '/pages/Home/Home'
				});
			} else {
				wx.switchTab({
					url: '/pages/default/index/index'
				});
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},

	onUnload () {

	}
});
