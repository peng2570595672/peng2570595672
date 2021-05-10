const app = getApp();
Page({
	data: {
		vipName: ''
	},
	onLoad () {
		this.setData({
			vipName: app.globalData.vipName
		});
	}
});
