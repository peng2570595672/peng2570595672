/**
 * @author 狂奔的蜗牛
 * @desc 办理进度
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		dashedHeight: 0
	},
	onLoad () {
	},
	// 下一步
	next () {
		util.go('/pages/default/payment_way/payment_way');
	},
	// 上传行驶证
	onClickUploadDrivingLicenseHandle() {
		util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license?type=0');
	}
});
