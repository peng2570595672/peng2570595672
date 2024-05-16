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
    onLoad (options) {
        app.globalData.orderInfo.orderId = '1237446731189194752';
        this.getAListOfExchangeRecords();
    },
    // 解约重签
    async goTerminationAndReSigning (targe) {
        app.globalData.orderInfo.orderId = targe.currentTarget.dataset.info.orderId;
        console.log(app.globalData.orderInfo);
        let url = 'terminationAndReSigning';
        util.go(`/pages/default/${url}/${url}`);
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
        // this.setData(
        //     {
        //         listOfHistoricalList: [
        //             {
        //                 orderId: '1237446731189194752', // 订单号
        //                 orderTime: '2020-01-01 12:00:00', // 订单时间
        //                 orderStatus: '已完成', // 订单状态
        //                 orderType: '换新', // 订单类型
        //                 orderPrice: '100.00', // 订单价格
        //                 orderDetail: '苹果XR换新', // 订单详情
        //                 orderImage: 'https://img.alicdn.com/imgen/tfs/TB1iG4vhQSWQ3.jpg'// 订单图片

        //             },
        //             {
        //                 orderId: '12374467312239194752', // 订单号
        //                 orderTime: '2020-02-01 12:00:00', // 订单时间
        //                 orderStatus: '已完成', // 订单状态
        //                 orderType: '换新', // 订单类型
        //                 orderPrice: '100.00', // 订单价格
        //                 orderDetail: '苹果XR换新', // 订单详情
        //                 orderImage: 'https://img.alicdn.com/imgen/tfs/TB1iG4vhQSWQ3.jpg'// 订单图片
        //             }
        //         ]
        //     }
        // );
        const result = await util.getDataFromServersV2('consumer/order/order-veh-plates-change/getList', {
        });
        if (!result) return;
        if (result.code === 0) {
            this.setData({
                listOfHistoricalList: result.data
            });
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
