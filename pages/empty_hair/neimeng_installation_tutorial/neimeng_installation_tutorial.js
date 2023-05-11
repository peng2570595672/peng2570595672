const app = getApp();
const util = require('../../../utils/util.js');
Page({
	data: {
		auditStatus: 0
	},
	onLoad (options) {
		this.setData({
			auditStatus: +options.auditStatus
		});
		wx.canIUse('setBackgroundColor') && wx.setBackgroundColor({
			backgroundColor: '#fff',
			backgroundColorBottom: '#f6f7f8'
		});
	},
	onShow () {
	},
	next () {
		if (this.data.auditStatus !== 2) {
			util.showToastNoIcon('审核通过后才能激活');
		}
		// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
		wx.navigateToMiniProgram({
			appId: 'wxdda17150b8e50bc4',
			path: 'pages/neimeng_choice/neimeng_choice',
			envVersion: 'release', // 目前联调为体验版
			fail () {
				util.showToastNoIcon('调起激活小程序失败, 请重试！');
			}
		});
	}
});
