/**
 * @author 狂奔的蜗牛
 * @desc 取消订单成功
 */
const util = require('../../../utils/util.js');
Page({
	data: {
	},
	// 下一步
	next () {
		util.go('/pages/default/payment_way/payment_way');
	},
	// 上传行驶证
	onClickUploadDrivingLicenseHandle () {
		util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license?type=3');
	},
	onClickHandle () {
		wx.reLaunch({
			url: '/pages/default/index/index'
		});
	},
	onUnload () {
		wx.reLaunch({
			url: '/pages/default/index/index'
		});
	}
});
