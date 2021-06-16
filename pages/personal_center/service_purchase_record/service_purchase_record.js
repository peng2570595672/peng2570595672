const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		rightsPackageCouponList: []
	},
	async onLoad () {
		if (!app.globalData.rightsPackageBuyRecords) {
			await this.getRightsPackageBuyRecords();
		}
		this.setData({rightsPackageCouponList: app.globalData.rightsPackageBuyRecords});
	},
	// 获取加购权益包订单列表
	async getRightsPackageBuyRecords () {
		const result = await util.getDataFromServersV2('consumer/voucher/rights/add-buy-record', {
			platformId: app.globalData.platformId
		});
		if (result.code === 0) {
			if (result?.data) {
				let res = result?.data;
				this.setData({
					rightsPackageCouponList: res
				});
				app.globalData.rightsPackageBuyRecords = res;
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
});
