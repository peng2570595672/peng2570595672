/**
 * @author 老刘
 * @desc 黔通协议-自购
 */
const util = require('../../../utils/util.js');
Page({
	async onLoad () {
		// 查询是否欠款
		await util.getIsArrearage();
	}
});
