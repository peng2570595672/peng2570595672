/**
 * @author 老刘
 * @desc 购买成功
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		recordId: undefined,
		status: 0// 0 支付中 1发放成功 2发放失败
	},
	async onLoad (options) {
		this.setData({
			recordId: options.recordId
		});
		await this.getRecord();
	},
	async getRecord () {
		const result = await util.getDataFromServersV2('consumer/voucher/rights/get-buy-independent-rights-record', {
			recordId: this.data.recordId
		});
		if (!result) return;
		if (result.code === 0) {
			wx.setNavigationBarTitle({
				title: result.data.status === 1 ? '购买成功' : result.data.status === 2 ? '支付失败' : '等待支付结果'
			});
			this.setData({
				status: result.data.status
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	next () {
		const statusObj = {
			0: () => this.getRecord(),
			1: () => this.goRecord(),
			2: () => this.onClickReturn()
		};
		statusObj[this.data.status].call();
	},
	onClickReturn () {
		wx.navigateBack({delta: 1});
	},
	goRecord () {
		util.go(`/pages/personal_center/service_purchase_record/service_purchase_record`);
	}
});
