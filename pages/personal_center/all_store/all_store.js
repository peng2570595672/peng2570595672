const util = require('../../../utils/util.js');
const app = getApp();
Page({

    data: {
        region: ['贵州省','遵义市','习水县']
    },

    onLoad (options) {

    },

    onShow () {

    },
    // 打电话
    phone (e) {
        wx.makePhoneCall({
            phoneNumber: e.currentTarget.dataset.phone
        });
    },
    // 打开地址导航
    nav () {
        util.showToastNoIcon('功能正在维护中，敬请期待！');
    },
    bindRegionChange (e) {
        console.log(e);
        let regionInfo = e.detail;
        this.setData({region: regionInfo.value});
    }
});
