const util = require('../../../utils/util.js');
Page({
	data: {
	},
	// 去服务费扣除说明
	goInstructions () {
		util.go('/pages/personal_center/service_fee_description/service_fee_description');
	}
});
