const util = require('../../../utils/util.js');
Page({
	data: {
	},
	// 去服务费扣除说明
	go () {
		util.go('/pages/personal_center/service_fee_description/service_fee_description');
	}
});
