/**
 * @author 狂奔的蜗牛
 * @desc 签约成功
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
Page({
	data: {
	},
	// 下一步
	next () {
		util.go('/pages/default/payment_way/payment_way');
	},
	// 上传行驶证
	onClickUploadDrivingLicenseHandle () {
		// 统计点击事件
		mta.Event.stat('033',{});
		util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license?type=3');
	},
	onClickHandle () {
		wx.navigateTo({
			url: '/pages/default/index/index'
		});
	},
	onUnload () {
		// 统计点击事件
		mta.Event.stat('034',{});
		wx.navigateTo({
			url: '/pages/default/index/index'
		});
	}
});
