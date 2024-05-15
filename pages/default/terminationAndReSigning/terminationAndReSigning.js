// pages/default/terminationAndReSigning/terminationAndReSigning.js
const util = require('../../../utils/util.js');
const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad (options) {
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady () {

    },
    // 微信签约
    async weChatSign () {
        let params = {
            orderId: app.globalData.orderInfo.orderId, // 订单id
            clientOpenid: app.globalData.userInfo.openId,
            clientMobilePhone: app.globalData.userInfo.mobilePhone,
            needSignContract: true // 是否需要签约 true-是，false-否
        };
        const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
        if (!result) return;
        if (result.code === 0) {
            let res = result.data.contract;
            // 签约车主服务 2.0
            app.globalData.signAContract = -1;
            app.globalData.belongToPlatform = app.globalData.platformId;
            app.globalData.isNeedReturnHome = true;
            if (this.data.orderInfo?.base?.orderType === 31 && this.data.listOfPackages[this.data.choiceIndex]?.isCallBack) {
                util.aiReturn(this, '#popTipComp', app.globalData.orderInfo.orderId, () => {
                    util.weChatSigning(res);
                });
            } else {
                util.weChatSigning(res);
            }
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    /**
     * 生命周期函数--监听页面显示
     */
    onShow () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage () {

    }
});
