/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		requestNum: 0,
		isRechargeEarnestMoney: 0
	},
	onLoad (options) {
		if (options.isRechargeEarnestMoney) {
			this.setData({
				isRechargeEarnestMoney: +options.isRechargeEarnestMoney
			});
		}
	},
	// 账户充值
	async next () {
		if (this.data.isRechargeEarnestMoney) {
			await this.rechargeEarnestMoney();
			return;
		}
		if (!this.data.rechargeAmount) return;
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/recharge', {
			bankAccountId: this.data.choiceBankObj.bankAccountId,
			amount: +this.data.rechargeAmount * 100
		});
		if (!result) return;
		if (result.code === 0) {
			await this.applyQuery(result?.data?.rechargeId);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 充值查询
	async applyQuery (rechargeId) {
		if (!rechargeId) {
			util.showToastNoIcon('rechargeId丢失');
			return;
		}
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/applyQuery', {
			rechargeId: rechargeId
		});
		if (!result) return;
		if (result.code === 1) {
			// 充值中
			util.showLoading('正在充值中...');
			this.data.requestNum++;
			this.setData({
				requestNum: this.data.requestNum
			});
			if (this.data.requestNum === 5) {
				util.go(`/pages/account_management/recharge_result/recharge_result?isRechargeEarnestMoney=${+this.data.isRechargeEarnestMoney}`);
				return;
			}
			setTimeout(async () => {
				await this.applyQuery(rechargeId);
			}, 2000);
			return;
		}
		if (result.code === 0 && this.data.isRechargeEarnestMoney) {
			util.go(`/pages/default/processing_progress/processing_progress?orderId=${app.globalData.orderInfo.orderId}`);
			return;
		}
		util.go(`/pages/account_management/recharge_state/recharge_state?info=${JSON.stringify(result)}`);
	},
	// 预充保证金
	async rechargeEarnestMoney () {
		const result = await util.getDataFromServersV2('consumer/order/orderDeposit', {
			bankAccountId: this.data.choiceBankObj.bankAccountId,
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			await this.applyQuery(result?.data?.rechargeId);
		} else {
			util.showToastNoIcon(result.message);
		}
	}
});
