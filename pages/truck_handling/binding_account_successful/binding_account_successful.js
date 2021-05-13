/**
 * @author 老刘
 * @desc 开户成功
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		available: false, // 按钮是否可点击
		isRequest: false// 是否请求中
	},
	onShow () {
	},
	// 下一步
	next () {
	}
});
