const util = require('../../../utils/util.js');
Page({
	data: {
	},
	async onLoad () {
		// 查询是否欠款
		await util.getIsArrearage();
	},
	btnCatchTap () {
		wx.navigateBack();
	}
});
