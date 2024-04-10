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
                if (!res.tempImagePath) {
                    return util.showToastNoIcon('拍摄失败，可选择相册上传！');
                }
				wx.setStorageSync(`path-${this.data.type}`, res.tempImagePath);
				const pages = getCurrentPages();
				const prevPage = pages[pages.length - 2];// 上一个页面
				console.log(res.tempImagePath)
				prevPage.setData({
					pathUrl: res.tempImagePath // 重置状态
				});
				wx.navigateBack({
					delta: 1
				});
			},
			fail: () => {
				util.showToastNoIcon('拍照失败');
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
