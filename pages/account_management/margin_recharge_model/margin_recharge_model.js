// pages/account_management/margin_recharge_model/margin_recharge_model.js
const app = getApp();
const util = require('../../../utils/util');
Page({
  data: {
		orderId: undefined,
    depositBalance: 0, // 押金余额
    rechargeAmount: 0 // 充值金额
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad (options) {
    let that = this;
    that.setData({
			orderId: options.orderId,
      rechargeAmount: new Number(200).toFixed(2),
      depositBalance: new Number(0).toFixed(2)
    });
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady () {

  },

  onShow () {

  },

  // 微信支付
  async btnmarginRecharge () {
    util.showLoading();
		console.log(app.globalData.userInfo);
		let params = {
			orderId: this.data.orderId,
			rechargeAmount: this.data.rechargeAmount,
			openid: app.globalData.userInfo.openId
    };
		const res = await util.getDataFromServer('/consumer/order/third/wxPay', params, () => {
			util.showToastNoIcon('获取支付参数失败！');
		},
		(res) => {
			if (res.code === 0) {
				let extraData = JSON.parse(res.data.payinfo);
				console.log(extraData.nonceStr);
				wx.requestPayment({
					nonceStr: extraData.nonceStr,
					package: extraData.package,
					paySign: extraData.paySign,
					signType: extraData.signType,
					timeStamp: extraData.timeStamp,
					success: (res) => {
						console.log(res,'=------------------');
						if (res.errMsg === 'requestPayment:ok') {
							util.go('/pages/account_management/index/index');
						} else {
							util.showToastNoIcon('支付失败！');
						}
					},
					fail: (res) => {
						if (res.errMsg !== 'requestPayment:fail cancel') {
							util.showToastNoIcon('支付失败！');
						}
					}
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
  },

  onUnload () {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2]; // 上一个页面
    prevPage.setData({
      isReload: true // 重置状态
    });
  }
});
