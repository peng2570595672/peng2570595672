const app = getApp();
const util = require('../../../utils/util.js');
const obuMenu = require('../libs/obuMenu.js');
Page({
	data: {
	},
	onLoad () {
		wx.canIUse('setBackgroundColor') && wx.setBackgroundColor({
			backgroundColor: '#fff',
			backgroundColorBottom: '#f6f7f8'
		});
		if (app.globalData.obuActiveUpDateInfo.isUpDate) {
			this.setData({
				obuActive_upDate: app.globalData.obuActiveUpDateInfo.isUpDate // 是否属于重写激活
			});
			wx.setNavigationBarTitle({title: `更新设备信息`});
		}
	},
	onShow () {
	},
	// 下一步
	next () {
		wx.uma.trackEvent('activate_tutorial_for_internal_next');
		let baseInfo = wx.getStorageSync('baseInfo');
		if (!baseInfo) return util.showToastNoIcon('用户信息丢失，请重新打开小程序');
		let {channel, serverId, qtLimit, carNoStr, obuStatus} = baseInfo;
		obuMenu.show({ app, util, channel, serverId, qtLimit, carNoStr, obuStatus });
	}
});
