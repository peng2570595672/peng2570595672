/**
 * @author 老刘
 * @desc 货车落地页
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		isMain: false
	},
	onLoad (options) {
		if (options.isMain) {
			this.setData({
				isMain: options.isMain
			});
		}
	},
	// 监听返回按钮
	onClickBackHandle () {
		wx.navigateBack({
			delta: 1
		});
	},
	onClickDetails () {
		this.selectComponent('#discountDetails').show();
	},
	onClickHandle () {
		wx.uma.trackEvent('truck_index_next');
		mta.Event.stat('truck_index',{});
		util.go('/pages/truck_handling/truck_receiving_address/truck_receiving_address');
	},
	goOnlineServer () {
		// 未登录
		if (!app.globalData.userInfo.accessToken) {
			util.go('/pages/login/login/login');
			return;
		}
		wx.uma.trackEvent('truck_index_for_service');
		mta.Event.stat('truck_index_for_service',{});
		util.go(`/pages/web/web/web?type=online_customer_service`);
	}
});
