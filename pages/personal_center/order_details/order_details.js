const util = require('../../../utils/util.js');
Page({
	data: {
		details: ''
	},
	onLoad (options) {
		this.setData({
			details: JSON.parse(options.details)
		});
	},
	// 去账单说明
	goOrderInstructions () {
		util.go('/pages/personal_center/order_instructions/order_instructions?details=' + JSON.stringify(this.data.details));
	},
	// 去补缴
	go () {
		util.go('/pages/personal_center/payment_confirmation/payment_confirmation');
	}
});
