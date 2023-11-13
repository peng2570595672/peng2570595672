// pages/default/citic_bank_pay_success/citic_bank_pay_success.js
Page({

    data: {
        cictBankPayStatus: true, // 中信权益包拉起收银台支付状态（true：支付成功，false：支付失败）
        text: '中信银行'
    },

    onLoad (options) {
        if (options?.cictBankPayStatus) {
            this.setData({
                cictBankPayStatus: options.cictBankPayStatus === 'true',
                text: options.isWellBank === 'true' ? '平安银行' : '中信银行'
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
