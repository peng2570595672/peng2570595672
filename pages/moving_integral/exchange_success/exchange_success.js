// pages/moving_integral/exchange_success/exchange_success.js
const util = require('../../../utils/util');
const app = getApp();
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
  onLoad (options) {
    let that = this;
    that.setData({
      price: options.price
    });
  },
  // 跳转到个人中心ETC优惠券
  seeCoupons () {
    util.go('/pages/personal_center/service_card_voucher/service_card_voucher');
  },
  // 继续兑换
  continueToExchange () {
    app.globalData.tonDunObj.pages = 3;
    util.go('/pages/moving_integral/bound_changyou/bound_changyou');
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload () {
    app.globalData.tonDunObj.pages = 3;
    util.go('/pages/moving_integral/bound_changyou/bound_changyou');
  }
});
