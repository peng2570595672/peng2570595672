/**
 * @author 老刘
 * @desc 通通券VIP会员服务协议
 */
const util = require('../../../utils/util.js');
Page({
	async onLoad () {
		// 查询是否欠款
		await util.getIsArrearage();
	}
});
