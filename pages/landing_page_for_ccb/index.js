const app = getApp();
Page({
	onLoad () {
		app.globalData.isWeChatSudoku = true;
		app.globalData.otherPlatformsServiceProvidersId = '700651431658528768';
		wx.reLaunch({
			url: '/pages/default/receiving_address/receiving_address'
		});
	}
});
