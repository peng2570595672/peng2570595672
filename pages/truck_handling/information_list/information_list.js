const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		orderInfo: undefined
	},
	onShow () {
		app.globalData.truckHandlingOCRType = 0;
		this.getETCDetail();
	},
	// 加载订单详情
	getETCDetail () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '16',
			needAllInfo: true
		}, () => {
			util.showToastNoIcon('获取订单详情失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					orderInfo: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 跳转
	go (e) {
		let url = e.currentTarget.dataset['url'];
		util.go(`/pages/truck_handling/${url}/${url}?vehPlates=${this.data.orderInfo.base.vehPlates}&vehColor=${this.data.orderInfo.base.vehColor}`);
	}
});
