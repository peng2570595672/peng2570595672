const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		rightsPackageCouponList: []
	},
	onLoad () {
		let rightsPackageCouponList = [];
		app.globalData.rightsPackageBuyRecords.map(item => {
			item.rightsPackageCouponList.map(it => {
				it.vehPlates = item.vehPlates;
				it.payTime = item.payTime;
				it.packageStatus = parseInt(item.packageStatus);
				rightsPackageCouponList.push(it);
			});
		});
		this.setData({rightsPackageCouponList});
	}
});
