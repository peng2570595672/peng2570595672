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
        console.log('查询新旧订单签约状态');
        this.queryContract();
    },

    /**
     * 旧车牌的解约
     */
    goAndCancelTheContract () {
        if (this.data.oldVehContractStatus !== 2 && this.data.oldVehContractStatus !== 0) { // 当前未解约
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
        if (this.data.oldVehContractStatus === 2 || this.data.oldVehContractStatus === 0) {
            this.weChatSign();
            return;
        }
        this.selectComponent('#popTipComp').show({
            type: 'shenfenyanzhifail',
            title: '提示',
            btnCancel: '好的',
            refundStatus: true,
            content: '请先完成旧车牌解约!',
            bgColor: 'rgba(0,0,0, 0.6)'
        });
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
    // 查询车主新旧车牌订单服务签约
    async queryContract () {
        const result = await util.getDataFromServersV2('consumer/order/order-veh-plates-change/queryApplyContract', {
            id: this.data.id
        });
        if (!result) return;
        if (result.code === 0) {
            app.globalData.signAContract = 3;
            const {oldVehContractStatus,orderId,id,newVehContractStatus} = result.data;
            this.setData({
                oldVehContractStatus, // 1 签约状态 ， 0 未签约， 2 解约状态
                newVehContractStatus, // 1 签约状态， 0 未签约， 2 解约状态
                finishReContract: newVehContractStatus === 1 // 是否完成签约
            });
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    /**
     * 返回
     */
    finish () {
        this.selectComponent('#popTipComp').show({
            type: 'shenfenyanzhifail',
            title: '提示',
            btnCancel: '好的',
            refundStatus: true,
            content: '请使用微信搜索“内蒙古etc服务”小程序，注册登录后点击卡签重写功能，并按照指引完成ETC设备重写，完成后可在本小程序换牌记录处查看换牌是否成功!如有不解之处，请联系客服4006680996处理!!',
            bgColor: 'rgba(0,0,0, 0.6)'
        });
        if (this.data.finishReContract) {
        }
    },
    /**
     * 生命周期函数--监听页面出现
     */
    onShow () {
    },

    cancelHandle () {
        wx.reLaunch({
            url: '/pages/default/swapRecord/swapRecord'
          });
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
