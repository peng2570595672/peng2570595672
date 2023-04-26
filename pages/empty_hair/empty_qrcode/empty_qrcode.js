const util = require('../../../utils/util.js');
const app = getApp();
Page({
    data: {

    },

    onLoad (options) {

    },

    onShow () {

    },
    btn () {
        wx.switchTab({
            url: '/pages/Home/Home'
        });
    },
    onUnload () {
        wx.switchTab({
            url: '/pages/Home/Home'
        });
    }

});
