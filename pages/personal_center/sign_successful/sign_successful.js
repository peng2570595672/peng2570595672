/**
 * @author 老刘
 * @desc 信息确认
 */
const app = getApp();
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
				url: `/pages/default/processing_progress/processing_progress?type=main_process&isNewTrucks=1`
			});
			return;
		}
		wx.navigateBack();
	},
	onUnload () {
	}
});
