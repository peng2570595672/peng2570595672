const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		tabIndex: 0,
		vehicleList: []
	},
	onLoad (options) {
		this.getRightsPackageBuyRecords();
	},
	getRightsPackageBuyRecords () {
		util.showLoading();
		util.getDataFromServer('consumer/order/rightsPackageBuyRecords', {
		}, () => {
			util.showToastNoIcon('获取权益列表失败！');
		}, (res) => {
			if (res.code === 0 && res.data) {
				let result = res.data;
				let rightsAndInterestsVehicleList = [];
				for (let item of result) {
					rightsAndInterestsVehicleList.push(item.vehPlates);
				}
				this.setData({
					vehicleList: rightsAndInterestsVehicleList
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// tab切换
	onClickTab (e) {
		let index = e.currentTarget.dataset['index'];
		index = parseInt(index);
		this.setData({
			tabIndex: index
		});
	}
});
