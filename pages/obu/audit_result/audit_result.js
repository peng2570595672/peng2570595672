const util = require('../../../utils/util.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    state:'1'
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
   this.setData({
    state:options.state
   })
  },
  onRetry(){ //重试
    util.go("/pages/obu/add/add")
  },
  onAccount(){ //查看账户
    util.go("/pages/account_management/account_details/account_details")
  }
})