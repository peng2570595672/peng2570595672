// 权益h5支付
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isRequest: false,
		price: 0,
		lifeServiceRecordId: ''
	},
	onLoad (options) {
		if (options.lifeServiceRecordId) {
			// 权益商城h5
			this.setData({
				price: +options.price || 0,
				lifeServiceRecordId: options.lifeServiceRecordId
			});
		} else {
			this.setData({
				isXiaoTuPay: true
			});
			// 小兔平台支付
			const params = decodeURIComponent(options.params);
			console.log(params);
			this.handleXiaoTuPay(params);
		}
	},
	onShow () {
	},
	handleXiaoTuPay (params) {
		wx.requestPayment({
			nonceStr: params.nonceStr,
			package: params.package,
			paySign: params.paySign,
			signType: params.signType,
			timeStamp: params.timeStamp,
			success: (res) => {
				wx.navigateBack({});
			},
			fail: (res) => {
				wx.navigateBack({});
			}
		});
	},
	async handlePay () {
      if (this.data.isRequest) return;
      this.setData({
        isRequest: true
      });
      util.showLoading();
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
