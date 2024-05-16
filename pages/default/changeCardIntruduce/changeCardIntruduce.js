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
        // let nmOrderList = app.globalData?.myEtcList?.filter(item => item.obuCardType === 2 && (item.obuStatus === 1 || item.obuStatus === 5));
        // if (nmOrderList) {
        //     this.setData({
        //         nmOrderList
        //     });
        // }
    },
    async validateCar () {
        // 判断是否存在未完成的换牌申请
        await this.getAMontonkaOrder();
    },
    viewHistory () {
        // 申请记录页面
        let url = 'swapRecord';
        util.go(`/pages/default/${url}/${url}`);
    },
    //  校验蒙通卡订单
    async getAMontonkaOrder (oldVehPlates,newVehPlates) {
        // 参数：不传检验是否有未完成的换牌申请，
        // oldVehPlates-旧车牌，传了校验是否该车牌有欠费，
        // newVehPlates-传了校验新车牌是否可用
        let params = {};
        if (oldVehPlates) {
            params.oldVehPlates = oldVehPlates;
        }
        if (newVehPlates) {
            params.newVehPlates = newVehPlates;
        }
        const result = await util.getDataFromServersV2('consumer/order/order-veh-plates-change/verify', params);
        if (!result) return;
        if (result.code === 0) {
            // 查询并判断是否多个已经激活的蒙通卡
            if (this.data.nmOrderList.length === 0) {
                await this.IsAnActivationOrder(); // 该页面只会查询一次 nmOrderList 至少有一条才能继续
            } else {
                if (result.data.verify) {
                    // 不存在欠费 跳转
                    util.go(`/pages/default/changeCarAndCard/changeCarAndCard?multipleOrders=${JSON.stringify(result.data)}`);
                } else {
                    // 有欠费订单 中断办理
                    this.selectComponent('#popTipComp').show({
                        type: 'shenfenyanzhifail',
                        title: '提示',
                        btnCancel: '好的',
                        refundStatus: true,
                        content: result.message,
                        bgColor: 'rgba(0,0,0, 0.6)'
                    });
                }
            }
        } else if (result.code === 104) {
            this.selectComponent('#popTipComp').show({
                type: 'shenfenyanzhifail',
                title: '提示',
                btnCancel: '好的',
                refundStatus: true,
                content: result.message,
                bgColor: 'rgba(0,0,0, 0.6)'
            });
        } else {
            util.showToastNoIcon(result.message);
        }
    },
    // 是否存在多个已激活订单
    async IsAnActivationOrder () {
        const result = await util.getDataFromServersV2('consumer/order/order-veh-plates-change/getNmgActOrder', {
        });
        if (!result) return;
        if (result.code === 0 && result.data) {
            this.setData({
                // 保存已激活订单 至少有一条
                nmOrderList: result.data
            });
            if (result.data.length === 1) {
                // 查询该车牌是否欠费
                await this.getAMontonkaOrder(result.data[0].vehPlates);
                return;
            }
            // 多条订单
            util.go(`/pages/default/changeCarAndCard/changeCarAndCard?multipleOrders=${JSON.stringify(result.data)}`);
        } else {
            util.showToastNoIcon(result.message);
        }
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
