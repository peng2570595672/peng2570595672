const util = require('../../utils/util.js');
Page({
	onLoad () {
		util.resetData();// 重置数据
		wx.reLaunch({
			url: '/pages/default/receiving_address/receiving_address'
		});
	}
});
