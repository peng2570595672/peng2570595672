/**
 * @author 老刘
 * @desc 账户管理
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		cardInfo: undefined
	},
	async onShow () {
		await util.getV2BankId();
		app.globalData.bankCardInfo.accountNo = app.globalData.bankCardInfo.accountNo.substr(0, 4) + ' *** *** ' + app.globalData.bankCardInfo.accountNo.substr(-4);
		this.setData({
			cardInfo: app.globalData.bankCardInfo
		});
	},
	onClickAccountDetails () {
		wx.uma.trackEvent('account_management_for_index_to_account_details');
		util.go(`/pages/account_management/account_details/account_details`);
	},
	// 绑定卡
	onClickBindBankCard () {
		wx.uma.trackEvent('account_management_for_index_to_bind_bank_card');
		util.go(`/pages/account_management/bind_bank_card/bind_bank_card`);
	}
});
