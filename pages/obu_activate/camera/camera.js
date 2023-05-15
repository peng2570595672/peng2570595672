const util = require('../../../utils/util.js');

Page({
	data: {
		type: -1,
		title: '',
		show: false
	},
	onLoad (options) {
		this.setData({
			type: options.type,
			title: options.title
		});
	},
	onShow () {
		this.setData({
			show: true
		});
		this.ctx = wx.createCameraContext();
	},
	takePhoto () {
		this.ctx.takePhoto({
			quality: 'high',
			success: (res) => {
				wx.setStorageSync(`path-${this.data.type}`, res.tempImagePath);
				wx.navigateBack({
					delta: 1
				});
			},
			fail: () => {
				util.showToastNoIcon('拍照失败'); ;
			}
		});
	},
	error () {
		util.alert({
			content: '请授权使用摄像头进行照片拍摄',
			confirmText: '去授权',
			showCancel: true,
			confirm: () => {
				wx.openSetting();
			},
			cancel: () => {
				wx.navigateBack({
					delta: 1
				});
			}
		});
	}
});
