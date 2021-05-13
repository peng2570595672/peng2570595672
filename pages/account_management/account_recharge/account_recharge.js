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
		rechargeAmount: undefined
	},
	onShow () {
		const pages = getCurrentPages();
		const currPage = pages[pages.length - 1];
		// 从选择银行卡返回
		if (currPage.__data__.info) {
			console.log(currPage.__data__.info);
		}
	},
	next () {
		if (!this.data.rechargeAmount) return;
		let result = {};
		util.go(`/pages/account_management/recharge_state/recharge_state?info=${JSON.stringify(result)}`);
	},
	// 绑定卡
	onClickSwitchBankCard () {
		util.go(`/pages/account_management/bind_bank_card/bind_bank_card?isSwitch=1`);
	},
	// 输入框输入值做处理
	inputValueChange (e) {
		let key = e.currentTarget.dataset.key;
		let val = e.detail.value.trim();
		// 充值金额
		if (!+val) return;
		let amount = +val;
		this.setData({
			rechargeAmount: amount
		});
	}
});
