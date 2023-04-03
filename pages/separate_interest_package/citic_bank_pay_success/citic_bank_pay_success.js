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
        util.go(`/pages/default/processing_progress/processing_progress?orderId=${this.data.orderId}`);
    }
});
