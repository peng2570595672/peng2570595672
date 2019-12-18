const util = require('../../../utils/util.js');
Page({
	data: {
	},
	cancelOrder (e) {
		let id = e.currentTarget.dataset.id;
		util.alert({
			title: '取消办理',
			content: '你确定要取消办理吗？',
			showCancel: true,
			confirmText: '取消办理',
			confirm: () => {
				util.showToastNoIcon('取消成功');
				util.go('/pages/default/index/index');
			}
		});
	}
});
