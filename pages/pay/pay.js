import {IS_TEST} from '../../app';

/**
 * @author 老刘
 * @desc 平安支付
 */
const util = require('../../utils/util.js');
const app = getApp();
Page({
	data: {
		pinanOrderId: undefined,
		orderId: undefined,
		parameterUrl: undefined,
		IS_TEST: false,
		pledMoney: 0,
		payStatus: 0 // 0-待支付 1-支付成功 2-支付失败
	},
	onLoad (options) {
		wx.hideHomeButton();
		console.log(options);
		this.setData({
			IS_TEST: IS_TEST,
			orderId: options.orderId,
			pinanOrderId: options.pinanOrderId
		});
		this.onPay();
	},
	launchAppSuccess (e) {
		console.log('success', e);
	},
	launchAppError (e) {
		console.log(e.detail.errMsg);
	},
	onPay () {
		// 调用微信接口获取code
		wx.login({
			success: (r) => {
				util.getDataFromServer('consumer/order/common/third/pledgePay', {
					code: r.code,
					orderId: this.data.orderId,
					pinanOrderId: this.data.pinanOrderId
				}, () => {
					util.hideLoading();
					util.showToastNoIcon('获取支付参数失败！');
				}, (res) => {
					if (res.code === 0) {
						util.hideLoading();
						let extraData = res.data.extraData;
						const money = (res.data.pledMoney / 100).toFixed(2);
						this.setData({
							pledMoney: money,
							parameterUrl: `https://${IS_TEST ? 'test-hcz-static' : 'hcz-static'}.pingan.com.cn/fin-common/umc-etc-agent/index.html#/payResult?orderNo=${this.data.pinanOrderId}&supplyOrderNo=${this.data.orderId}&supplyCode=chezhuyun&actualAmount=${money}`
						});
						wx.requestPayment({
							nonceStr: extraData.nonceStr,
							package: extraData.package,
							paySign: extraData.paySign,
							signType: extraData.signType,
							timeStamp: extraData.timeStamp,
							success: (res) => {
								this.setData({isRequest: false});
								if (res.errMsg === 'requestPayment:ok') {
									this.setData({
										payStatus: 1
									});
									wx.setNavigationBarTitle({
										title: '支付成功'
									});
								} else {
									this.setData({
										payStatus: 2
									});
									wx.setNavigationBarTitle({
										title: '支付失败'
									});
									// util.showToastNoIcon('支付失败！');
								}
							},
							fail: (res) => {
								this.setData({
									payStatus: 2
								});
								wx.setNavigationBarTitle({
									title: '支付失败'
								});
							}
						});
					} else {
						util.hideLoading();
						util.showToastNoIcon(res.message);
					}
				});
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	}
});
