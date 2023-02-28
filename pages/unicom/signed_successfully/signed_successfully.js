/**
 * @author 老刘
 * @desc 签约成功
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
	},
	onLoad () {
		wx.hideHomeButton();
	},
	// 返回首页
	onClickGoHomeHandle () {
		wx.switchTab({
			url: '/pages/Home/Home'
		});
	}
});
