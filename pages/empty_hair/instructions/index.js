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
			return;
		}
		wx.navigateToMiniProgram({
			appId: 'wxdda17150b8e50bc4',
			path: 'pages/index/index',
			envVersion: 'release', // 目前联调为体验版
			fail () {
				util.showToastNoIcon('调起激活小程序失败, 请重试！');
			}
		});
	}
});
