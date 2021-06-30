/**
 * @author 老刘
 * @desc 账户管理
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		cardInfo: {
			no: '325253525252'
		}
	},
	async onShow () {
	},
	onClickRecharge () {
		this.selectComponent('#rechargePrompt').show();
	},
	goAccountDetails () {
		util.go(`/pages/precharge_account_management/account_details/account_details`);
	}
});
