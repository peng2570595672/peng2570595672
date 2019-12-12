/**
 * @author 狂奔的蜗牛
 * @desc 填写车牌和收货信息
 */
const util = require('../../../utils/util.js');
Page({
	data: {
	},
	// 下一步
	next () {
		util.go('/pages/default/payment_way/payment_way');
	}
});
