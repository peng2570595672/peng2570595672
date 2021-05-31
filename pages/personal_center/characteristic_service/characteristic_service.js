const util = require('../../../utils/util.js');
Page({
	data: {
	},
	onLoad (options) {
	},
	online () {
		wx.uma.trackEvent('characteristic_service_for_server');
		util.go(`/pages/web/web/web?type=online_customer_service`);
	}
});
