/**
 * @author 狂奔的蜗牛
 * @desc 签约成功
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		carNo: ''
	},
	onLoad (options) {
		this.setData({
			carNo: options.carNo
		});
	},
	// 返回首页
	onClickGoHomeHandle () {
		wx.reLaunch({
			url: '/pages/default/index/index'
		});
	}
});
