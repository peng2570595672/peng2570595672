// pages/default/changeCardIntruduce/changeCardIntruduce.js
const util = require('../../../utils/util.js');
const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        available: true,
        nmOrderList: [] // 存放蒙通卡已激活订单
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad (options) {
        let nmOrderList = app.globalData?.myEtcList?.filter(item => item.obuCardType === 2 && (item.obuStatus === 1 || item.obuStatus === 5));
        if (nmOrderList) {
            this.setData({
                nmOrderList
            });
        }
    },
    validateCar () {
        // 判断是否存在未完成的换牌申请
        // this.selectComponent('#popTipComp').show({
        //     type: 'shenfenyanzhifail',
        //     title: '提示',
        //     btnCancel: '好的',
        //     refundStatus: true,
        //     content: '当前存在未完成的换牌申请，请完成后再次尝试!',
        //     bgColor: 'rgba(0,0,0, 0.6)'
        // });
        // return
        // 判断是否多个已经激活的蒙通卡
        let url = 'changeCarAndCard';
        console.log('this.data.nmOrderList',this.data.nmOrderList);
        this.data.nmOrderList.length ? util.go(`/pages/default/${url}/${url}`) : '';
    },
    viewHistory () {
        // 历史办理页
        let url = 'swapRecord';
        util.go(`/pages/default/${url}/${url}`);
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady () {

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
