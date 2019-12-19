const util = require('../../../utils/util.js');
Page({
	data: {
	},
	// 跳转
	go (e) {
		let url = e.currentTarget.dataset['url'];
		let type = e.currentTarget.dataset.type;
		util.go(`/pages/personal_center/${url}/${url}`);
	}
});
