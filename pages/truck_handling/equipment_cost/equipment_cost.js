/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		equipmentCost: 0 // 设备保证金
	},
	onLoad (options) {
		this.setData({
			equipmentCost: options.equipmentCost
		});
	},
	onShow () {
	},
	// 支付
	async marginPayment () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		util.showLoading();
		let params = {
			orderId: app.globalData.orderInfo.orderId
		};
		const result = await util.getDataFromServersV2('consumer/order/pledge-pay', params);
		if (!result) return;
		if (result.code === 0) {
			let extraData = result.data.extraData;
			wx.requestPayment({
				nonceStr: extraData.nonceStr,
				package: extraData.package,
				paySign: extraData.paySign,
				signType: extraData.signType,
				timeStamp: extraData.timeStamp,
				success: (res) => {
					this.setData({isRequest: false});
					if (res.errMsg === 'requestPayment:ok') {
						util.go('/pages/truck_handling/payment_successful/payment_successful');
					} else {
						util.showToastNoIcon('支付失败！');
					}
				},
				fail: (res) => {
					this.setData({isRequest: false});
					if (res.errMsg !== 'requestPayment:fail cancel') {
						util.showToastNoIcon('支付失败！');
					}
				}
			});
		} else {
			this.setData({isRequest: false});
			util.showToastNoIcon(result.message);
		}
	}
});
