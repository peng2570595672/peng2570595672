const util = require('../../../utils/util.js');
Page({
	data: {
	},
	// 我的ETC
	myEtc () {
		util.go('/pages/personal_center/my_etc/my_etc');
	},
	// 我的账单
	myOrder () {
		util.go('/pages/personal_center/my_order/my_order');
	},
	// 帮助中心
	helpCenter () {
		util.go('/pages/personal_center/help_center/help_center');
	}
});
