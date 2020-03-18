const util = require('../../../utils/util.js');
Page({
	data: {
		isShowSwitchElaborate: false,
		details: ''
	},
	onLoad (options) {
		console.log(options)
		this.setData({
			details: JSON.parse(options.details)
		});
		wx.setNavigationBarColor({
			frontColor: '#000000',
			// backgroundColor: this.data.details.background
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
