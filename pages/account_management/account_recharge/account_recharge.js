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
		bankList: [],
		isRechargeEarnestMoney: false,
		choiceBankObj: undefined,
		cardInfo: undefined,
		rechargeAmount: undefined
	},
	async onLoad (options) {
		if (options.money) {
			// 预充保证金
			this.setData({
				isRechargeEarnestMoney: true,
				rechargeAmount: options.money
			});
		}
		app.globalData.bankCardInfo.accountNo = app.globalData.bankCardInfo.accountNo.substr(-4);
		this.setData({
			cardInfo: app.globalData.bankCardInfo
		});
		await this.getBankAccounts();
	},
	onShow () {
		const pages = getCurrentPages();
		const currPage = pages[pages.length - 1];
		// 从选择银行卡返回
		if (currPage.__data__.index) {
			this.setData({
				choiceBankObj: this.data.bankList[currPage.__data__.index]
			});
		}
	},
	// 获取二类户号信息
	async getBankAccounts () {
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/getBankAccounts');
		if (!result) return;
		if (result.code === 0) {
			result.data.map(item => {
				item.accountNo = item.accountNo.substr(-4);
			});
			this.setData({
				bankList: result.data,
				choiceBankObj: result.data[0]
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async next () {
		if (this.data.isRechargeEarnestMoney) {
			return;
		}
		if (!this.data.rechargeAmount) return;
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/recharge', {
			bankAccountId: this.data.choiceBankObj.bankAccountId,
			amount: +this.data.rechargeAmount * 100
		});
		if (!result) return;
		if (result.code === 0) {
			util.go(`/pages/account_management/recharge_state/recharge_state?info=${JSON.stringify(result)}`);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async rechargeEarnestMoney () {
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/recharge', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		util.go(`/pages/default/processing_progress/processing_progress?orderId=${app.globalData.orderInfo.orderId}`);
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
