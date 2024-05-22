const util = require('../../../utils/util.js');
const app = getApp();
Page({
    data: {
        card_bank: 0 // 银行枚举值
    },

    onLoad (options) {
        this.setData({
            card_bank: +options.cardBank
        });
    },

    onShow () {

    },

    async next () {
        if (this.data.card_bank === 1) { // 中信银行
            if (this.data.isCiticBankPlatinum) {
                url = `https://cs.creditcard.ecitic.com/citiccard/cardshopcloud/standardcard-h5/index.html?sid=SJCSJHT01&paId=${app.globalData.orderInfo.orderId}&partnerId=SJHT&pid=CS0840`;
            } else {
                url = `https://cs.creditcard.ecitic.com/citiccard/cardshopcloud/standardcard-h5/index.html?pid=CS0207&sid=SJCSJHT01&paId=${app.globalData.orderInfo.orderId}&partnerId=SJHT`;
            }
            util.go(`/pages/web/web/web?url=${encodeURIComponent(url)}`);
        } else if (this.data.card_bank === 2) { // 民生银行
            let res = await util.getDataFromServersV2('consumer/order/apply/ms/bank-card', {
                orderId: app.globalData.orderInfo.orderId
            });
            if (!res) return;
            if (res.code === 0) {
                wx.navigateToMiniProgram({
                    appId: 'wx8212297b23aff0ff',
                    path: `pages/home/sc-ws/sc-ws?params=${'https://' + encodeURIComponent(res.data.applyUrl.slice(8))}`,
                    envVersion: 'release',
                    success () { },
                    fail () {
                        // 拉起小程序失败
                        util.showToastNoIcon('拉起小程序失败, 请重试！');
                    }
                });
            } else {
                util.showToastNoIcon(res.message);
            }
        } else if (this.data.card_bank === 3) { // 广发银行
            let res = await util.getDataFromServersV2('consumer/order/apply/gf/bank-card', {
                orderId: app.globalData.orderInfo.orderId
            });
            if (!res) return;
            if (res.code === 0) {
                util.go(`/pages/web/web/web?url=${encodeURIComponent(res.data.applyUrl)}`);
            } else {
                util.showToastNoIcon(res.message);
            }
        } else if (this.data.card_bank === 4) { // 平安银行
            // let res = await util.getDataFromServersV2('/consumer/order/pingan/get-apply-credit-card-url', {
            //     orderId: app.globalData.orderInfo.orderId
            // });
            // if (!res) return;
            // if (res.code === 0) {
            //     // 跳转 h5
            //     util.go(`/pages/web/web/web?url=${encodeURIComponent(res.data)}`);
            // } else {
            //     util.showToastNoIcon(res.message);
            // }
        }
    }

});
