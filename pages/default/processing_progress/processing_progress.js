/**
 * @author 狂奔的蜗牛
 * @desc 办理进度
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		dashedHeight: 0,
		info: undefined
	},
	onLoad () {
		this.getProcessingProgress();
		console.log(getCurrentPages());
	},
	// 获取办理进度
	getProcessingProgress () {
		util.showLoading();
		util.getDataFromServer('consumer/order/transact-schedule', {
			orderId: app.globalData.orderInfo.orderId
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					info: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 下一步
	next () {
		util.go('/pages/default/payment_way/payment_way');
	},
	// 上传行驶证
	onClickUploadDrivingLicenseHandle () {
		util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license?type=0');
	},
	onUnload () {
		// 在C页面内 navigateBack，将返回A页面
		wx.navigateBack({
			delta: getCurrentPages().length
		});
	}
});
