/**
 * @author 老刘
 * @desc 预充通行保证金
 */
const util = require('../../../utils/util.js');
// 数据统计
const app = getApp();
Page({
	data: {
		bankCardInfo: {}
	},
	async onLoad () {
		this.setData({
			bankCardInfo: app.globalData.bankCardInfo
		});
		this.getBankAccounts();
	},
	async getBankAccounts () {
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/getBankAccounts');
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		if (!result.data) result.data = [];
		this.setData({
			bankList: result.data
		});
	},
	async next () {
		wx.uma.trackEvent('truck_recharge_instructions_next');
		let params = {
			dataComplete: 1,// 资料已完善
			orderId: app.globalData.orderInfo.orderId// 订单id
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({isRequest: false});
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		util.go('/pages/default/processing_progress/processing_progress');
	}
});
