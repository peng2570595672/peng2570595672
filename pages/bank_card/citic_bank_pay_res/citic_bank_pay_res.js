const util = require('../../../utils/util');
const app = getApp();
Page({

    data: {
        cictBankPayStatus: true, // 退款状态（true：成功，false：失败）
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

    onShow () {},
    // 退出
    returnPage () {
        wx.navigateBack({
            delta: 1
        });
    }
});
