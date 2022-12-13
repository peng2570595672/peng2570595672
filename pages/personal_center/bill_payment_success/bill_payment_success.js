Page({
	data: {
	},
	handleBackMini () {
		wx.navigateBackMiniProgram({
			extraData: {},
			success (res) {
				// 返回成功
			}
		});
	}
});
