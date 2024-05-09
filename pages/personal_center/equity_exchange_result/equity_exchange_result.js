const app = getApp();
Page({
	data: {
		exchangeInfo: {}
	},
	async onLoad () {
		let result = wx.getStorageSync('equityExchangeResult');
		this.setData({
			exchangeInfo: JSON.parse(result)
		});
	},
	handleReturnHome () {
		wx.switchTab({
			url: '/pages/Home/Home'
		});
	},
	handleReexchange () {
		wx.navigateBack({delta: 1});
	},
	onUnload () {
	}
});
