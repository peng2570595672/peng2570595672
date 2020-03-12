const util = require('../../../utils/util.js');
Page({
	data: {
		bgColor: '#DF4A26',
		isShowSwitchElaborate: false,
		showDetailWtapper: false,
		showDetailMask: false
	},
	onLoad (options) {
		wx.setNavigationBarColor({
			frontColor: '#000000',
			backgroundColor: '#DF4A26'
		});
	},
	// 显示使用说明
	switchElaborate () {
		this.setData({
			isShowSwitchElaborate: !this.data.isShowSwitchElaborate
		});
	},
	// 显示详情
	showDetail (e) {
		this.setData({
			showDetailMask: true,
			showDetailWtapper: true
		});
	},
	// 关闭详情
	hide () {
		this.setData({
			showDetailWtapper: false
		});
		setTimeout(() => {
			this.setData({
				showDetailMask: false
			});
		}, 400);
	}
});
