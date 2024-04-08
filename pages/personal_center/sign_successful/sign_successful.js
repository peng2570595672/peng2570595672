/**
 * @author 老刘
 * @desc 信息确认
 */
Page({
	data: {
		isMainProcess: false
	},
	async onLoad (options) {
		this.setData({
			isMainProcess: options.type === 'main'
		});
	},
	btnCatchTap () {
		if (this.data.isMainProcess) {
			wx.redirectTo({
				url: `/pages/default/processing_progress/processing_progress?type=main_process`
			});
			return;
		}
		wx.navigateBack();
	},
	onUnload () {
		wx.navigateBack();
	}
});
