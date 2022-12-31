// 权益h5支付
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
        price: 0,
        lifeServiceRecordId: '1058727543109058560'
	},
	onLoad (options) {
        this.setData({
            price: +options.price || 0,
            lifeServiceRecordId: options.lifeServiceRecordId
        });

	},
	onShow () {

	},
    handlePay () {
        util.getDataFromServer('consumer/voucher/rights/recharge/apply', {
            openId: app.globalData.openId,
            lifeServiceRecordId: this.data.lifeServiceRecordId
        }, () => {
            util.showToastNoIcon('支付失败！');
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
                        console.log(res);
                        if (res.errMsg === 'requestPayment:ok') {
                            const url = `https://${app.globalData.test ? 'etctest' : 'etc'}.cyzl.com/${app.globalData.test ? 'etc2-html' : 'wetc'}/etc_life_rights_and_interests/index.html#/pay_success?auth=${app.globalData.userInfo.accessToken}`;
                            util.go(`/pages/web/web/web?url=${encodeURIComponent(url)}`);
                        } else {
                            util.showToastNoIcon('支付失败！');
                        }
                    },
                    fail: (res) => {
                        console.log(res);
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
    }
});
