/**
 * @author 狂奔的蜗牛
 * @desc 签约成功
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		isPaymentProcess: undefined
	},
	onLoad (options) {
		if (options.isPaymentProcess) {
			this.setData({
				isPaymentProcess: options.isPaymentProcess
			});
		}
		wx.removeStorageSync('return_to_prompt');
	},
	// 下一步
	next () {
		util.go('/pages/default/payment_way/payment_way');
	},
	// 上传行驶证
	onClickUploadDrivingLicenseHandle () {
		// 统计点击事件
		mta.Event.stat('033',{});
		wx.setStorageSync('taking_pictures', true);
		if (wx.getStorageSync('corresponding_package_id') !== app.globalData.orderInfo.orderId) {
			// 行驶证缓存关联订单
			wx.setStorageSync('corresponding_package_id', app.globalData.orderInfo.orderId);
			wx.removeStorageSync('driving_license_face');
			wx.removeStorageSync('driving_license_back');
			wx.removeStorageSync('car_head_45');
		}
		util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license?type=3');
	},
	onClickHandle () {
		// let urls = '/pages/default/index/index';
		let urls = '/pages/Home/Home';
		let tmplIds = ['rWHTLYmUdcuYw-wKU0QUyM7H0t-adDKeu193RjILL0M'];
		util.subscribe(tmplIds,urls);
	},
	onUnload () {
		// 统计点击事件
		mta.Event.stat('034',{});
		wx.reLaunch({
			// url: '/pages/default/index/index'
			url: '/pages/Home/Home'
		});
	}
});
