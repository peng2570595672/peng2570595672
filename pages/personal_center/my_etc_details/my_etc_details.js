const util = require('../../../utils/util.js');
Page({
	data: {
	},
	cancelOrder (e) {
		let id = e.currentTarget.dataset.id;
		util.alert({
			title: '',
			content: '你确定要取消办理吗？',
			showCancel: true,
			confirmColor: '#0091FF',
			confirmText: '手误了',
			confirm: () => {
				util.showToastNoIcon('取消成功');
				util.go('/pages/default/index/index');
			}
		});
	}
});
