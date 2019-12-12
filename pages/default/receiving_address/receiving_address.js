const util = require('../../../utils/util.js');
Page({
	data: {
	},
	// 下一步
	next () {
		util.go('/pages/default/payment_way/payment_way');
	}
});
