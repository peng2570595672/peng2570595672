const util = require('../../../utils/util.js');
Page({
	data: {
	},
	// 免费办理
	newVehicle () {
		util.go('/pages/default/receiving_address/receiving_address');
	}
});
