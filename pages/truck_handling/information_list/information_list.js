const util = require('../../../utils/util.js');
const app = getApp();
Page({
  data: {
  },
  onShow () {
	this.getETCDetail();
  },
	// 加载订单详情
	getETCDetail () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: 6,
			needAllInfo: true
		}, () => {
			util.showToastNoIcon('获取设备详情失败！');
		}, (res) => {
			if (res.code === 0) {
				let orderInfo = res.data;
				if (orderInfo.remark && orderInfo.remark.indexOf('迁移订单数据') !== -1) {
					orderInfo['selfStatus'] = util.getStatusFirstVersion(orderInfo);
				} else {
					orderInfo['selfStatus'] = util.getStatus(orderInfo);
				}
				this.setData({
					orderInfo
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	uploadIdCard () {
	},
	uploadLicense () {
	},
	uploadCar () {
	},
	uploadTransport () {
	}
});
