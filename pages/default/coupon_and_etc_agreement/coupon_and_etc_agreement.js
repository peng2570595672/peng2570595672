/**
 * @author 老刘
 * @desc 通通券&ETC+联合会员协议
 */
const util = require('../../../utils/util.js');
Page({
	async onLoad () {
		// 查询是否欠款
		await util.getIsArrearage();
	}
});
