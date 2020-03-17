const util = require('../../../utils/util.js');
Page({
	data: {
		isShowSwitchElaborate: false,
		details: ''
	},
	onLoad (options) {
		this.setData({
			details: options.details
		});
		wx.setNavigationBarColor({
			frontColor: '#000000',
			// backgroundColor: options.details.background
			backgroundColor: '#DF4A26'
		});
	},
	// 显示使用说明
	switchElaborate () {
		this.setData({
			isShowSwitchElaborate: !this.data.isShowSwitchElaborate
		});
	}
});
