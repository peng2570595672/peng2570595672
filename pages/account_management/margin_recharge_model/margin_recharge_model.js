// pages/account_management/margin_recharge_model/margin_recharge_model.js
const app = getApp();
const util = require('../../../utils/util');
Page({
	data: {
		orderId: undefined,
		depositBalance: 0, // 押金余额
		rechargeAmount: 0, // 充值金额
		ETCMargin: undefined	// 订单信息

	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	async onLoad (options) {
		let that = this;
		const ETCMargin1 = app.globalData.myEtcList.filter(item => item.id === options.Id);
		that.setData({
			rechargeAmount: Number(0.02).toFixed(2),
			depositBalance: ETCMargin1[0].pledgeMoney / 100,
			ETCMargin: ETCMargin1[0]
		});
		// 查询是否欠款
		await util.getIsArrearage();
	},

	// 微信支付
	async weChatPay () {
		util.showLoading();
		let params = {
			tradeType: 1,
			openid: app.globalData.userInfo.openId,
			orderId: this.data.ETCMargin.id,
			amount: parseFloat(this.data.rechargeAmount)
		};
		// 支付接口
		const result = await util.getDataFromServersV2('consumer/order/ensure-pay', params);
		if (!result) {
			this.setData({ isRequest: false });
			return;
		}
		if (result.code === 0) {
			let extraData = result.data.extraData;
			wx.requestPayment({
				nonceStr: extraData.nonceStr,
				package: extraData.package,
				paySign: extraData.paySign,
				signType: extraData.signType,
				timeStamp: extraData.timeStamp,
				success: (res) => {
					// 去支付成功页
					util.showToastNoIcon('支付成功');
					setTimeout(() => {
						wx.redirectTo({
							url: `/pages/account_management/precharge_account_details/precharge_account_details?memberId=${this.data.ETCMargin.memberId}&margin=true&Id=${this.data.ETCMargin.id}&select=true`
						});
					},2000);
				},
				fail: (res) => {
					util.showToastNoIcon('支付失败');
					this.getStatus();
				}
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},

	onUnload () {
		const pages = getCurrentPages();
		pages.map(async (item, index) => {
			if (item.__route__ === 'pages/account_management/index/index') {
				const prevPage = pages[index]; // 上一个页面
				prevPage.setData({
					isReload: true // 重置状态
				});
			}
		});
	}
});
