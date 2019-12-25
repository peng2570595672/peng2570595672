const util = require('../../../utils/util.js');
Page({
	data: {
		showDetailWtapper: false,
		showDetailMask: false
	},
	// 显示详情
	showDetail (e) {
		this.setData({
			showDetailMask: true,
			showDetailWtapper: true
		});
	},
	// 关闭详情
	hide () {
		this.setData({
			showDetailWtapper: false
		});
		setTimeout(() => {
			this.setData({
				showDetailMask: false
			});
		}, 400);
	}
});
