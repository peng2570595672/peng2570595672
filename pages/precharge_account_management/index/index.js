/**
 * @author 老刘
 * @desc 账户管理
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		etcList: [],
		cardInfo: {
			no: '325253525252'
		}
	},
	async onLoad (options) {
		if (options.needLoadEtc) {
			await this.getStatus();
		} else {
			const etcList = app.globalData.myEtcList.filter(item => item.flowVersion === 4 && item.auditStatus === 2); // 是否有预充流程 & 已审核通过订单
			this.setData({etcList});
		}
	},
	onShow () {
		const pages = getCurrentPages();
		const currPage = pages[pages.length - 1];
		if (currPage.__data__.isReload) {
		
		}
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
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 预充模式-账户信息查询
	async getQueryWallet () {
		const result = await util.getDataFromServersV2('consumer/order/third/queryWallet', {
			orderId: this.data.orderId
		});
		util.hideLoading();
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				prechargeInfo: result.data || {}
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 预充模式-查询预充信息
	async getQueryProcessInfo () {
		const result = await util.getDataFromServersV2('consumer/order/third/queryProcessInfo', {
			orderId: this.data.orderId
		});
		util.hideLoading();
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				prechargeInfo: result.data || {}
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	onClickRecharge () {
		this.selectComponent('#rechargePrompt').show();
	},
	goAccountDetails () {
		util.go(`/pages/precharge_account_management/account_details/account_details`);
	}
});
