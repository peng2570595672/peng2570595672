const util = require('../../../utils/util.js');
Page({
	data: {
		isFail: true,
		showCancellation: false,
		status: 0// 状态:0 办理中  1正常使用   2扣费失败  3申请失败   4待签约   5待激活   6审核中   7审核通过
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
				wx.setNavigationBarTitle({
					title: '取消订单'
				});
				this.setData({
					showCancellation: true
				});
			}
		});
	}
});
