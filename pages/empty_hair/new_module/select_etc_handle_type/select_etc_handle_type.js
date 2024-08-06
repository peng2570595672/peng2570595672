const app = getApp();
const util = require('../../../../utils/util.js');
Page({

	data: {
		isNewTrucks: undefined	// 0：客车; 1：货车
	},

	onLoad (options) {
		console.log(options);
		this.setData({
			isNewTrucks: +options.isNewTrucks,
			shopId: options.shopId
		});
	},

	onShow () {
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		}
	},

	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: async (res) => {
				const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				});
				if (!result) return;
				if (result.code) {
					util.showToastNoIcon(result.message);
					return;
				}
				result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
				this.setData({
					loginInfo: result.data
				});
				// 已经绑定了手机号
				if (result.data.needBindingPhone !== 1) {
					app.globalData.userInfo = result.data;
					app.globalData.openId = result.data.openId;
					app.globalData.memberId = result.data.memberId;
					app.globalData.mobilePhone = result.data.mobilePhone;
				} else {
					wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
					util.go('/pages/login/login/login');
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	// 跳转
	go (e) {
		let type = +e.currentTarget.dataset['type'];
		util.go(`/pages/empty_hair/new_module/input_obu_card_number/input_obu_card_number?isNewTrucks=${this.data.isNewTrucks}&shopId=${this.data.shopId}`);
	},

	onUnload () {

	}

});
