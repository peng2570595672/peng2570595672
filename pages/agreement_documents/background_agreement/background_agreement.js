const util = require('../../../utils/util.js');
Page({
    data: {
        agreementContent: '' // 协议内容
    },

    async onLoad (options) {
        let that = this;
        const eventChannel = this.getOpenerEventChannel();
        eventChannel.on('acceptDataFromOpenerPage', function (data) {
            let res = data.data;
            console.log(res);
            wx.setNavigationBarTitle({
                title: res.name
            });
            if (res.contentType === 1) { // 富文本
                that.setData({
                    agreementContent: res.content
                });
            } else {

            }
        });
        // 查询是否欠款
		await util.getIsArrearage();
    },

    onShow () {

    }
});
