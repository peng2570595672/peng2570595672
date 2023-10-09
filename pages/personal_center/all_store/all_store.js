// pages/personal_center/all_store/all_store.js
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
    bindRegionChange (e) {
        console.log(e);
        let regionInfo = e.detail;
        this.setData({region: regionInfo.value});
    }
});
