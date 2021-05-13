/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		info: undefined
	},
	onLoad (options) {
		if (options.info) {
			this.setData({
				info: JSON.parse(options.info)
			});
			if (false) {
				wx.setNavigationBarTitle({
					title: '充值成功'
				});
			} else {
				wx.setNavigationBarTitle({
					title: '充值失败'
				});
			}
		}
	},
	next () {
		util.go(`/pages/account_management/index/index`);
	}
});
