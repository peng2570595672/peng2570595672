const util = require('../../../utils/util.js');
Page({
	data: {
	},
	// 去服务费扣除说明
	goInstructions () {
		util.go('/pages/personal_center/service_fee_description/service_fee_description');
	},
	// 去账单说明
	goOrderInstructions () {
		util.go('/pages/personal_center/order_instructions/order_instructions');
	},
	// 去补缴
	go () {
		util.go('/pages/personal_center/payment_confirmation/payment_confirmation');
	}
});
