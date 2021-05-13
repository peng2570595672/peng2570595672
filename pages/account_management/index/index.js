/**
 * @author 老刘
 * @desc 账户管理
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
	},
	onShow () {
	},
	onClickAccountDetails () {
		util.go(`/pages/account_management/account_details/account_details`);
	},
	// 绑定卡
	onClickBindBankCard () {
		util.go(`/pages/account_management/bind_bank_card/bind_bank_card`);
	}
});
