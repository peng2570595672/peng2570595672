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
            // category 协议归类：1-办理协议 2-高速协议 3-隐私协议 4-保理协议 5-通用协议
            let name = ['办理协议', '高速协议', '隐私协议', '保理协议', '通用协议'];
            wx.setNavigationBarTitle({
                title: name[res.category - 1]
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
