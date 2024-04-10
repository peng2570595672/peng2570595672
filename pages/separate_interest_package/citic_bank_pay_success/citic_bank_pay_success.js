const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        orderId: ''
    },

    onLoad (options) {
        this.setData({
            orderId: options.orderId,
            is9901: options.pro9901
        });
    },

    onShow () {

    },
    next () {
        util.go(`/pages/default/processing_progress/processing_progress?orderId=${this.data.orderId}`);
    },
    onUnload () {
        // 跳转首页; 避免返回通行券购买页。重复购买
        wx.switchTab({
            url: '/pages/Home/Home'
        });
    },
    async checkCar () {
        // 9901 车辆支付渠道关联
        const result = await util.getDataFromServersV2('consumer/activity/qtzl/xz/carChannelRel', {
            logisticsId: orderInfo.logisticsId
        });
        if (!result) return;
        if (result.code === 0) {
            util.showToastNoIcon(result.message);
            util.go(`/pages/default/processing_progress/processing_progress?orderId=${this.data.orderId}`);
        } else {
            util.showToastNoIcon(result.message);
        }
    }

});
