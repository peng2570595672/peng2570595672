// pages/personal_center/valueAddedServices/valueAddedServices.js
const util = require('../../../utils/util.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        isShow: true, // 判断有无配置增值服务
        sourceOfServiceProvider: '1', // 服务商来源，举值:星星朗、天安保险，
        roadRescueList: [
            {
              title: '驾乘意外险',
              status: 1,
              policyNumber: '1234567890123',
              coverages: [
                { label: '驾乘意外身故', value: '20万/座' },
                { label: '驾乘意外医疗', value: '2万/座' },
                { label: '住院津贴', value: '50万/座' },
                { label: '免赔300元后', value: '90%赔付' }
              ]
            },
            {
              title: '道路救援',
              status: 2,
              policyNumber: '12332497890123',
              coverages: [
                { label: '7座及以下家庭自用私家车', value: '全年' },
                { label: '提供非道路交通事故', value: '救援3次' },
                { label: '每次救援费用不超过500元', value: '全年' },
                { label: '累计救援服务费用1500元', value: '-' }
              ]
            }
          ]
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad (options) {

    },
    // 点击“申请补贴” 跳转至 “在线客服”
    btnLoad (e) {
        let url = e.currentTarget.dataset.status === 1 ? 'accidentInsurance' : 'roadRelief';
        util.go(`/pages/personal_center/${url}/${url}`);
    },
    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady () {

    },
    // 获取订单信息
    getOrderInformation () {
        util.showLoading();
        let params = {
            openId: app.globalData.openId
        };
        util.getDataFromServer('consumer/order/my-etc-list', params, () => {
            util.hideLoading();
        }, (res) => {
            util.hideLoading();
            if (res.code === 0) {
                this.setData({
                    roadRescueList: res.data.list
                });
            } else {
                util.showToastNoIcon(res.message);
            }
        }, app.globalData.userInfo.accessToken);
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
