// pages/default/swapRecord/swapRecord.js
const util = require('../../../utils/util.js');
const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        listOfHistoricalList: [
        ] // 历史订单列表
    },

    /**
     * 生命周期函数--监听页面加载
     */
    async onLoad (options) {
        await this.getAListOfExchangeRecords();
    },
    // 解约重签
    async goTerminationAndReSigning (targe) {
         // 该条订单状态为3 的时候才去解约重签
        app.globalData.orderInfo.orderId = targe.currentTarget.dataset.info.orderId;
        console.log(app.globalData.orderInfo,targe.currentTarget.dataset.info.id);
        util.go(`/pages/default/terminationAndReSigning/terminationAndReSigning?id=${targe.currentTarget.dataset.info.id}`);
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady () {

    },
    // 返回上一页
    goBack () {
        wx.navigateBack({
            delta: 1
        });
    },
    // 获取换牌申请记录列表
    async getAListOfExchangeRecords () {
        const result = await util.getDataFromServersV2('consumer/order/order-veh-plates-change/getList', {
        });
        if (!result) return;
        if (result.code === 0) {
            if (result.data) {
                this.setData({
                    listOfHistoricalList: result.data
                });
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
