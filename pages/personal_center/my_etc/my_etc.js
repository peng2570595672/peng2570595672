const util = require('../../../utils/util.js');
Page({
	data: {
	},
	//	查看详情
	goDetails () {
		util.go('/pages/personal_center/my_etc_details/my_etc_details');
	},
	// 免费办理
	newVehicle () {
		util.go('/pages/default/receiving_address/receiving_address');
	}
});
