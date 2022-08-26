// pages/moving_integral/exchange_fail/exchange_fail.js
const util = require('../../../utils/util');
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    flag: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad (options) {
    // console.log(options);
    let that = this;
    that.setData({
      flag: options.exchange
    });
  },

  goBack () {
    if (this.data.flag) {
      util.go('/pages/moving_integral/bound_changyou/bound_changyou');
    } else {
      util.go('/pages/moving_integral/confirm_exchange/confirm_exchange');
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload () {
    app.globalData.tonDunObj.pages = 4;
    if (this.data.flag) {
      // util.go('/pages/moving_integral/bound_changyou/bound_changyou');
      wx.navigateTo({
        url: '/pages/moving_integral/bound_changyou/bound_changyou'
      });
      var pages = getCurrentPages(); // 页面指针数组
      var prePage = pages[pages.length - 3]; // 获取上一页
      console.log(prePage.route); // 上一页的路径
      // this.pageRouter.redirectTo({
      //   url: '/pages/moving_integral/bound_changyou/bound_changyou'
      // });
      // wx.navigateBack({
      //   delta: 2
      // });
    }
  }
});
