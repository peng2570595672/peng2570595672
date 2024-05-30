// pages/personal_center/valueAddedServices/valueAddedServices.js
const util = require('../../../utils/util.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {
        sourceOfServiceProvider: '1', // 服务商来源，举值:星星朗、天安保险，
        roadRescueList: [
            {
                orderName: '驾乘意外险',
                isShow: true,
                status: 1,
                text: `
                驾乘意外身故 20万/座驾 <br/>
                乘意外医疗 2万/座<br/>
                住院津贴 50元/天<br/>
                免赔300元后 90%赔付`,
                orderNum: 'BRE321313'
            },
            {
                orderName: '道路救援补贴',
                isShow: true,
                status: 2,
                text: `
                驾乘意外身故残疾 30万/座驾<br/>
                乘意外医疗 3万/座<br/>
                住院津贴 100元/天<br/>
                免赔50元后 90%赔付`,
                orderNum: 'B87g1313'
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
        let item = e.currentTarget.dataset.item;
        console.log('item',item);
        util.go(`/pages/personal_center/accidentInsurance/accidentInsurance`);
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
