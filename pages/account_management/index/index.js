/**
 * @author 老刘
 * @desc 账户管理
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		prechargeList: [],
		prechargeInfo: {},
		cardInfo: undefined
	},
	async onLoad (options) {
		if (options.needLoadEtc) {
			await this.getStatus();
		} else {
			const etcList = app.globalData.myEtcList.filter(item => item.flowVersion === 4 && item.auditStatus === 2); // 是否有预充流程 & 已审核通过订单
			this.setData({etcList});
			etcList.map(async item => {
				await this.getQueryWallet(item);
			});
		}
	},
	async onShow () {
		await util.getV2BankId();
		app.globalData.bankCardInfo.accountNo = app.globalData.bankCardInfo.accountNo.substr(0, 4) + ' *** *** ' + app.globalData.bankCardInfo.accountNo.substr(-4);
		this.setData({
			cardInfo: app.globalData.bankCardInfo
		});
		const pages = getCurrentPages();
		const currPage = pages[pages.length - 1];
		if (currPage.__data__.isReload) {
			this.data.etcList.map(async item => {
				await this.getQueryWallet(item);
			});
		}
	},
	onClickAccountDetails () {
		wx.uma.trackEvent('account_management_for_index_to_account_details');
		util.go(`/pages/account_management/account_details/account_details`);
	},
	// 绑定卡
	onClickBindBankCard () {
		wx.uma.trackEvent('account_management_for_index_to_bind_bank_card');
		util.go(`/pages/account_management/bind_bank_card/bind_bank_card`);
	},
	// 获取订单信息
	async getStatus () {
		let params = {
			openId: app.globalData.openId
		};
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', params);
		if (result.code === 0) {
			app.globalData.myEtcList = result.data;
			const etcList = app.globalData.myEtcList.filter(item => item.flowVersion === 4 && item.auditStatus === 2); // 是否有预充流程 & 已审核通过订单
			this.setData({etcList});
			etcList.map(async item => {
				await this.getQueryWallet(item);
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 预充模式-账户信息查询
	async getQueryWallet (item) {
		const result = await util.getDataFromServersV2('consumer/order/third/queryWallet', {
			orderId: item.id,
			pageSize: 1
		});
		util.hideLoading();
		if (!result) return;
		if (result.code === 0) {
			result.data.vehPlates = item.vehPlates;
			result.data.orderId = item.id;
			this.data.prechargeList = this.data.prechargeList.concat(result.data);
			this.setData({
				prechargeList: this.data.prechargeList
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async onClickRecharge (e) {
		const id = e.currentTarget.dataset.id;
		const result = await util.getDataFromServersV2('consumer/order/third/queryProcessInfo', {
			orderId: id
		});
		util.hideLoading();
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				prechargeInfo: result.data || {}
			});
			this.selectComponent('#rechargePrompt').show();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	goAccountDetails () {
		util.go(`/pages/account_management/precharge_account_details/precharge_account_details`);
	}
});
