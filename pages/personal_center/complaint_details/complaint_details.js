const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		complaintDetails: '',
		details: ''
	},
	onLoad (options) {
		this.setData({
			details: JSON.parse(options.details)
		});
		this.getComplaintDetails();
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
