/**
 * @author 狂奔的蜗牛
 * @desc 签约成功
 */
const util = require('../../../utils/util.js');
Page({
	async onLoad () {
		// 查询是否欠款
		await util.getIsArrearage();
	}
});
