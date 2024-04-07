/**
 * @author 老刘
 * @desc 信息确认
 */
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
	},
	onUnload () {
		wx.navigateBack();
	}
});
