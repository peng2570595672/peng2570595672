const util = require('../../../utils/util.js');
const app = getApp();
Page({
    data: {
        pledgeType: undefined, // 套餐类型
        money: undefined, // 支付金额
		equityMoney: undefined
    },
    onLoad (options) {
        this.setData({
            pledgeType: options.pledgeType,
            orderId: app.globalData.orderInfo.orderId,
            money: parseInt(options.money),
            equityMoney: parseInt(options.equityMoney)
        });
    },
    onShow () {
    },
    payMethod () {
        let that = this;
        // 防止重複點擊觸發
        util.fangDou(that,() => {
            that.pay(that.data.pledgeType);
        },300);
    },
    async pay (pledgeType) {
        let params = {};
		if (pledgeType === 4) {
			// 押金模式
			params = {
				payVersion: 'v3',
				tradeType: 1,
				orderId: app.globalData.orderInfo.orderId,
				openid: app.globalData.openId
			};
		} else {
			// 普通模式
			params = {
				orderId: app.globalData.orderInfo.orderId
			};
		}
		const result = await util.getDataFromServersV2('consumer/order/pledge-pay', params);
		console.log(result);
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
                        util.go(`/pages/default/payment_successful/payment_successful?citicBank=true`);
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
