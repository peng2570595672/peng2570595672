const app = getApp();
Page({
	onLoad () {
		app.globalData.otherPlatformsServiceProvidersId = '700645534739734528';
		app.globalData.isWeChatSudoku = true;
		wx.reLaunch({
			url: '/pages/default/receiving_address/receiving_address'
		});
	}
});
