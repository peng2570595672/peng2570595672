const util = require('../../utils/util.js');
const app = getApp();
Page({
	onLoad () {
		util.resetData();// 重置数据
		app.globalData.isWeChatSudoku = true;
		app.globalData.otherPlatformsServiceProvidersId = '700644029609549824';
		wx.reLaunch({
			url: '/pages/default/receiving_address/receiving_address'
		});
	}
});
