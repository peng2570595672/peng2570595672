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
        if (options.id) {
            this.setData({
                id: options.id
            });
        }
        this.queryContract();
    },

    /**
     * 旧车牌的解约
     */
    goAndCancelTheContract () {
        if (this.data.contractStatus === 1) {
            console.log(11);
            util.alert({
                title: `温馨提示`,
                content: '请使用微信搜索微信车主服务公众号，选择车主服务，选择需要解约的车牌并完成解约',
                showCancel: false,
                confirmText: '我知道了'
            });
        }
    },
    // 新车牌签约之前
    async weChatSignBefore () {
        if (this.data.contractStatus === 1) {
            this.selectComponent('#popTipComp').show({
                type: 'shenfenyanzhifail',
                title: '提示',
                btnCancel: '好的',
                refundStatus: true,
                content: '请先完成旧车牌解约!',
                bgColor: 'rgba(0,0,0, 0.6)'
            });
            return;
        }
        if (this.data.finishReContract) {
            // 已经提交过重新签约接口
            return;
        }
        const result = await util.getDataFromServersV2('consumer/order/order-veh-plates-change/updateVehInfo', {
            id: this.data.id
        });
        if (!result) return;
        if (result.code === 0) {
            this.weChatSign();
        } else {
            util.showToastNoIcon(result.message);
        }
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
            util.weChatSigning(res);
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    // 查询车主服务签约
    async queryContract () {
        const result = await util.getDataFromServersV2('consumer/order/query-contract', {
            orderId: app.globalData.orderInfo.orderId
        });
        if (!result) return;
        if (result.code === 0) {
            app.globalData.signAContract = 3;
            this.setData({
                contractStatus: result.data.contractStatus // 0 解约状态 ， 1 签约状态
            });
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    /**
     * 返回
     */
    finish () {
        if (this.data.finishReContract) {
            util.go(`/pages/default/swapRecord/swapRecord`);
        }
    },
    /**
     * 生命周期函数--监听页面出现
     */
    onShow () {
        this.setData({
            finishReContract: app.globalData.finishReContract
        });
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
