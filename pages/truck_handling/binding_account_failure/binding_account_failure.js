/**
 * @author 老刘
 * @desc 开户失败
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		code: undefined
	},
	async onLoad (options) {
		this.setData({
			code: parseInt(options.code)
		});
		// 查询是否欠款
		await util.getIsArrearage();
	}
});
