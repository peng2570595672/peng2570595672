/**
 * @author 狂奔的蜗牛
 * @desc 办理进度
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		type: undefined,// 进入类型,是否是主流程进入
		marginPaymentMoney: 0,// 付费金额金额
		orderId: undefined,
		isRequest: false
	},
	onLoad (options) {
		if (options.type) {
			this.setData({
				type: options.type
			});
		}
		this.setData({marginPaymentMoney: options.marginPaymentMoney});
	},
	// 支付
	marginPayment () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		util.showLoading();
		let params = {
			orderId: app.globalData.orderInfo.orderId
		};
		util.getDataFromServer('consumer/order/pledge-pay', params, () => {
			this.setData({isRequest: false});
			util.showToastNoIcon('获取支付参数失败！');
		}, (res) => {
			if (res.code === 0) {
				let extraData = res.data.extraData;
				wx.requestPayment({
					nonceStr: extraData.nonceStr,
					package: extraData.package,
					paySign: extraData.paySign,
					signType: extraData.signType,
					timeStamp: extraData.timeStamp,
					success: (res) => {
						this.setData({isRequest: false});
						if (res.errMsg === 'requestPayment:ok') {
							util.go('/pages/default/payment_successful/payment_successful?isPaymentProcess=true');
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
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	onUnload () {
		if (this.data.type && this.data.type === 'main_process') {
			wx.reLaunch({
				url: '/pages/Home/Home'
			});
		} else {
			wx.navigateBack({
				delta: 1 // 默认值是1
			});
		}
	}
});
