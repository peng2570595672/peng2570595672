const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		complaintDetails: '',
		details: ''
	},
	onLoad (options) {
		this.setData({
			details: options
		});
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		} else {
			this.getComplaintDetails();
		}
	},
	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: (res) => {
				util.getDataFromServer('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				}, () => {
					util.hideLoading();
					util.showToastNoIcon('登录失败！');
				}, (res) => {
					if (res.code === 0) {
						res.data['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
						this.setData({
							loginInfo: res.data
						});
						// 已经绑定了手机号
						if (res.data.needBindingPhone !== 1) {
							app.globalData.userInfo = res.data;
							app.globalData.openId = res.data.openId;
							app.globalData.memberId = res.data.memberId;
							app.globalData.mobilePhone = res.data.mobilePhone;
							// 查询最后一笔订单状态
							this.getComplaintDetails();
						} else {
							util.hideLoading();
						}
					} else {
						util.hideLoading();
						util.showToastNoIcon(res.message);
					}
				});
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	// 查询账单详情
	getBillDetail () {
		util.showLoading();
		let params = {
			channel: this.data.details.channel,
			id: this.data.details.id,
			month: this.data.details.month
		};
		util.getDataFromServer('consumer/etc/get-bill-by-id', params, () => {
			util.showToastNoIcon('获取账单详情失败！');
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				this.setData({details: res.data});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 通过账单id获取账单申诉详情
	getComplaintDetails () {
		util.showLoading();
		let params = {
			billId: this.data.details.id
		};
		util.getDataFromServer('consumer/etc/get-bill-complain-by-bill-id', params, () => {
			util.showToastNoIcon('获取账单申诉详情失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					complaintDetails: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	}
});
