/**
 * @author 老刘
 * @desc 购买成功
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		recordId: undefined,
		status: 2// 0 支付中 1发放成功 2发放失败
	},
	async onLoad (options) {
		this.setData({
			recordId: options.recordId
		});
		await this.getRecord();
		// 查询是否欠款
		await util.getIsArrearage();
	},
	async getRecord () {
		const result = await util.getDataFromServersV2('consumer/voucher/rights/get-buy-independent-rights-record', {
			recordId: this.data.recordId
		});
		if (!result) return;
		if (result.code === 0) {
			wx.setNavigationBarTitle({
				title: result.data.rightsPackageCode === 1 ? '购买成功' : result.data.rightsPackageCode === 2 ? '支付成功，发放失败' : '等待支付结果'
			});
			this.setData({
				status: result.data.rightsPackageCode
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
		util.go(`/pages/personal_center/coupon_redemption_centre/coupon_redemption_centre`);
	},
	goRecord () {
		util.go(`/pages/personal_center/service_purchase_record/service_purchase_record`);
	},
	onUnload () {
		wx.reLaunch({
			url: '/pages/Home/Home'
		});
	}
});
