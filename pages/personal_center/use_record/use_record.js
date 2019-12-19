const util = require('../../../utils/util.js');

const app = getApp();
Page({
	data: {
		showLoading: {
			show: true,
			text: '加载中...'
		},
		info: {},
		showDetailWrapper: false,
		showDetailMask: false,
		showObj: {}
	},
	// 显示详情
	showDetail (e) {
		this.setData({
			showDetailWrapper: true,
			showDetailMask: true
		});
	},
	// 隐藏优惠券选择面板
	hideDetail () {
		this.setData({
			showDetailWrapper: false
		});
		setTimeout(() => {
			this.setData({
				showDetailMask: false
			});
		}, 400);
	}
});
