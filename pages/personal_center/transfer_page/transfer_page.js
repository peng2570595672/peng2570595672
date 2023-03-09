/**
 * @author 老刘
 * @desc
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		path: '',
		appId: ''
	},
	async onLoad (options) {
		this.setData({
			path: options.path,
			appId: options.appId
		});
	},
	handleCancel () {
		wx.navigateBack({});
	},
	handleConfirm () {
		wx.navigateToMiniProgram({
			appId: this.data.appId,
			path: this.data.path,
			envVersion: 'release',
			fail () {
				util.showToastNoIcon('调起中萃到家小程序失败, 请重试！');
			}
		});
	}
});
