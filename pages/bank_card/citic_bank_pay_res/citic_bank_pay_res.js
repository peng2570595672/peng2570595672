// pages/default/citic_bank_pay_success/citic_bank_pay_success.js
Page({

    data: {
        cictBankPayStatus: true, // 中信权益包拉起收银台支付状态（true：支付成功，false：支付失败）
        citicBankshopProductIds: app.globalData.cictBankObj.citicBankshopProductIds,	// 信用卡套餐集合
        shopProductId: ''
    },

    onLoad (options) {
        if (options?.cictBankPayStatus) {
            this.setData({
                cictBankPayStatus: options.cictBankPayStatus === 'true',
                shopProductId: options.shopProductId
            });
        }
    },

    onShow () {

    },
    // 退出
    returnPage () {
        wx.navigateBack({
            delta: 1
        });
    }
});
