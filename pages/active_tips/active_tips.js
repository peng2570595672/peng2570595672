const util = require('../../utils/util.js');
Page({
	data: {
		type: 0
	},
	async onLoad (options) {
		const type = +options.type;
		this.setData({
			type
		});
		wx.hideHomeButton();
	},
	onShow () {
		// this.showToast();
	},
	showToast () {
		wx.navigateToMiniProgram({
			appId: 'wx06a561655ab8f5b2',
			path: this.data.type === 1 ? 'pages/base/redirect/index?routeKey=PC01_REDIRECT&autoRoute=CHECKILLEGAL&outsource=souyisou&wtagid=116.75.2' : 'pages/base/redirect/index?routeKey=PC01_REDIRECT&autoRoute=check&wtagid=116.115.38',
			success () {},
			fail () {
				// 未成功跳转到签约小程序
				util.showToastNoIcon('调起微保小程序失败, 请重试！');
			}
		});
	}
});
