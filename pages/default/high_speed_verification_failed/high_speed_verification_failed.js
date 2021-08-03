/**
 * @author 狂奔的蜗牛
 * @desc 签约成功
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		carNo: ''
	},
	async onLoad (options) {
		this.setData({
			carNo: options.carNo
		});
		// 查询是否欠款
		await util.getIsArrearage();
	},
	// 返回首页
	onClickGoHomeHandle () {
		wx.reLaunch({
			// url: '/pages/default/index/index'
			url: '/pages/Home/Home'
		});
	}
});
