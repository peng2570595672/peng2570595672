/**
 * @author 老刘
 * @desc 预充通行保证金
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
	},
	next () {
		util.go(`/pages/account_management/account_recharge/account_recharge`);
	}
});
