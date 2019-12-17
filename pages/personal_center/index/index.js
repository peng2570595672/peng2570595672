const util = require('../../../utils/util.js');
Page({
	data: {
	},
	// 我的ETC
	myEtc () {
		util.go('/pages/personal_center/my_etc/my_etc');
	}
});
