// pages/moving_integral/exchange_fail/exchange_fail.js
const util = require('../../../utils/util');
Page({

  /**
   * 页面的初始数据
   */
  data: {},

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad (options) { },

  goBack () {
    util.go('/pages/moving_integral/confirm_exchange/confirm_exchange');
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload () {
    util.go('/pages/moving_integral/confirm_exchange/confirm_exchange');
  }
});
