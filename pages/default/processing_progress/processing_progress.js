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
	onLoad (options) {
		if (options.type) {
			this.setData({
				type: options.type
			});
		}
		this.getProcessingProgress();
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
	// 刷新1分钱核验
	refreshCheck () {
		util.showLoading();
		util.getDataFromServer('consumer/order/order-verification-status-refresh', {
			orderVerificationId: this.data.info.orderVerificationId
		}, () => {
		}, (res) => {
			if (res.code === 0) {
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
	// 在线客服
	goOnlineServer () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	onUnload () {
		if (this.data.type === 'main_process') {
			util.goHome(true);
		}
	}
});
