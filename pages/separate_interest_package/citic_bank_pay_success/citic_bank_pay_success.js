const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        orderId: ''
    },

    onLoad (options) {
        this.setData({
            orderId: options.orderId
        });
    },

    onShow () {

    },
    next () {
        console.log('9901',this.data);
        util.go(`/pages/default/processing_progress/processing_progress?orderId=${this.data.orderId}`);
    },
    onUnload () {
        // 跳转首页; 避免返回通行券购买页。重复购买
        wx.switchTab({
            url: '/pages/Home/Home'
        });
	}

});
