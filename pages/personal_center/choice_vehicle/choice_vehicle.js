/**
 * @author 老刘
 * @desc 账户管理
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		navbarHeight: app.globalData.navbarHeight,
		equityList: []
	},
	async onLoad (options) {
	},
	async onShow () {
		if (app.globalData.userInfo.accessToken) {
			await this.getRightAccount();
		} else {
			// 公众号进入需要登录
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
				if (result.code === 0) {
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
						this.setData({
							mobilePhone: result.data.mobilePhone
						});
						this.getRightAccount();
					} else {
						wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
						util.go('/pages/login/login/login');
						util.hideLoading();
					}
				} else {
					util.showToastNoIcon(result.message);
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	async getRightAccount () {
		const result = await util.getDataFromServersV2('/consumer/member/right/account', {
			page: 1,
			pageSize: 1
		});
		if (result.code) {
			util.showToastNoIcon(result.message);
		} else {
			this.setData({
				equityList: result.data
			});
		}
	},
	async handleAccount (e) {
		const index = e.target.dataset.index;
		const item = this.data.equityList[index];
		const result = await util.getDataFromServersV2('/consumer/order/walfare/noPassLogin', {
			accountId: item.id
		});
		console.log(result);
		if (result.code) {
			util.showToastNoIcon(result.message);
		} else {
			if (result.data?.data?.path) {
				util.go(`/pages/web/web/web?url=${encodeURIComponent(result.data.data.path)}`);
			} else {
				util.showToastNoIcon(result.data?.message || '未获取到跳转地址');
			}
		}
	}
});
