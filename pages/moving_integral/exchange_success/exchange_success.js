// pages/moving_integral/exchange_success/exchange_success.js
const util = require('../../../utils/util');
Page({

  /**
   * 页面的初始数据
   */
  data: {
    price: ''
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let that = this;
    that.setData({
      price: options.price
    });
  },
  // 跳转到个人中心ETC优惠券
  seeCoupons() {
    util.go('/pages/personal_center/service_card_voucher/service_card_voucher');
  },
  continueToExchange() {
    util.go('/pages/moving_integral/bound_changyou/bound_changyou');
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    util.go('/pages/moving_integral/bound_changyou/bound_changyou');
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
});
