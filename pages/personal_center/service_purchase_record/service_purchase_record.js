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
	onClickItem (e) {
		console.log(e);
		console.log(e.currentTarget.dataset['item']);
		const item = e.currentTarget.dataset['item'];
		util.go(`/pages/separate_interest_package/prefer_purchase/prefer_purchase?packageId=${item.packageId}&entrance=details`);
		// pages/separate_interest_package/prefer_purchase/prefer_purchase?packageId=XXX&userId=业务员id
	}
});
