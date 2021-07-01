const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		list: []
	},
	async onShow () {
		if (!app.globalData.userInfo.accessToken) {
			// 公众号进入需要登录
			this.login();
			return;
		}
		await this.getPackageList();
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
						await this.getPackageList();
						await this.getStatus();
						util.hideLoading();
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
	// 获取订单信息
	async getStatus () {
		let params = {
			openId: app.globalData.openId
		};
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', params);
		if (result.code === 0) {
			app.globalData.myEtcList = result.data;
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	onClickPay (e) {
		const item = this.data.list[+e.target.dataset.index];
		util.go(`/pages/separate_interest_package/prefer_purchase/prefer_purchase?packageId=${item.packageId}`);
	},
	// 获取权益包列表
	async getPackageList () {
		const result = await util.getDataFromServersV2('consumer/voucher/rights/get-independent-rights-package-list');
		if (!result) return;
		if (result.code === 0) {
			result.data.map(item => {
				let couponType = [];
				item.couponList.map(it => {
					couponType.push(it.couponType);
				});
				item.couponType = couponType.length > 1 ? 3 : parseInt(couponType[0]) === 1 ? 1 : 2;
			});
			this.setData({
				list: result.data
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	goOnlineServer () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	}
});
