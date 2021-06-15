/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		info: undefined
	},
	async onLoad (options) {
		if (options.info) {
			this.setData({
				info: JSON.parse(options.info)
			});
			if (this.data.info.code) {
				wx.setNavigationBarTitle({
					title: '充值失败'
				});
			} else {
				wx.setNavigationBarTitle({
					title: '充值成功'
				});
				await util.getV2BankId();
			}
		}
	},
	next () {
		wx.uma.trackEvent('account_management_for_recharge_state_to_index');
		util.go(`/pages/account_management/index/index`);
	}
});
