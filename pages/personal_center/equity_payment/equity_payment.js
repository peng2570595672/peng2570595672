// 权益h5支付
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isRequest: false,
		price: 0,
		source: '',
		payId: '',
		lifeServiceRecordId: ''
	},
	onLoad (options) {
    this.setData({
        price: +options.price || 0,
        lifeServiceRecordId: options.lifeServiceRecordId,
        source: options.source,
        payId: options.payId
    });
	},
	onShow () {
	},
	async handlePayTTQOrder () {
		const result = await util.getDataFromServersV2('consumer/order/pay/transactions/walfare-pay', {
			payId: this.data.payId,
			openId: app.globalData.openId
		});
		if (result.code) {
			this.setData({
				isRequest: false
			});
			util.showToastNoIcon(result.message);
			return;
		}
		this.handlePayOrder(result);
	},
	async handlePay () {
      if (this.data.isRequest) return;
      this.setData({
        isRequest: true
      });
      util.showLoading();
      if (this.data.source === 'ttq') {
        this.handlePayTTQOrder();
        // 通通券
        return;
      }
      const result = await util.getDataFromServersV2('consumer/voucher/rights/recharge/apply', {
        lifeServiceRecordId: this.data.lifeServiceRecordId,
        openId: app.globalData.openId
      });
      if (result.code) {
        this.setData({
          isRequest: false
        });
        util.showToastNoIcon(result.message);
        return;
      }
			this.handlePayOrder(result);
	},
	handlePayOrder (result) {
		const info = result.data;
		let extraData = result.data.extraData;
		wx.requestPayment({
			nonceStr: extraData.nonceStr,
			package: extraData.package,
			paySign: extraData.paySign,
			signType: extraData.signType,
			timeStamp: extraData.timeStamp,
			success: (res) => {
				util.hideLoading();
				this.setData({
					isRequest: false
				});
				console.log(res);
				if (res.errMsg === 'requestPayment:ok') {
					let url = `https://${app.globalData.test ? 'etctest' : 'etc'}.cyzl.com/${app.globalData.test ? 'etc2-html' : 'wetc'}/equity_mall/index.html#/pay_success?auth=${app.globalData.userInfo.accessToken}`;
					if (this.data.source === 'ttq') {
						url = extraData.h5PayBackUrl;
					}
					util.go(`/pages/web/web/web?url=${encodeURIComponent(url)}`);
				} else {
					util.showToastNoIcon('支付失败！');
				}
			},
			fail: (res) => {
				util.hideLoading();
				this.setData({
					isRequest: false
				});
				console.log(res);
				if (res.errMsg !== 'requestPayment:fail cancel') {
					util.showToastNoIcon('支付失败！');
				} else {
					if (this.data.source === 'ttq') {
						return;
					}
					// 支付取消
					this.rightAccount(info);
				}
			}
		});
	},
	async rightAccount (info) {
		await util.getDataFromServersV2('consumer/voucher/rights/recharge/refund/rightAccount', info);
	}
});
