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
