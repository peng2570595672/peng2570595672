/**
 * @author 老刘
 * @desc 个人征信授权书
 */
const util = require('../../../utils/util.js');
Page({
	async onLoad () {
		// 查询是否欠款
		await util.getIsArrearage();
	}
});
