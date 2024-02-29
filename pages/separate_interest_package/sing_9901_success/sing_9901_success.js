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
        if (this.data.is9901) {
            console.log('9901',this.data);
            this.checkCar(); // 2.4.4 支付渠道关联接口
        }
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
            util.go(`/pages/default/processing_progress/processing_progress?orderId=${this.data.orderId}`); // 查看办理进度页
        } else {
            util.showToastNoIcon(result.message);
        }
    }

});
