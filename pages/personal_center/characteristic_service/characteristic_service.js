const util = require('../../../utils/util.js');
Page({
	data: {
	},
	onLoad (options) {
	},
	online () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	}
});
