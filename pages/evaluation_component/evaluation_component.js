// pages/evaluation_component/evaluation_component.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    needeva: null
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad (options) {
    this.setData({
      needeva: options.needeva
    });
    if (+options.needeva === '1') this.goPingjia();
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
  goBack () {
    wx.navigateBack();
  },
  // 小程序内评价
  goPingjia () {
    let plugin = requirePlugin('wxacommentplugin');
    plugin.openComment({
      success: (res) => {
        console.log(res);
        wx.showToast({
          title: res
        });
        if (res.errCode === 0) {
          this.setData({
            needeva: '2'
          });
        }
      },
      fail: (res) => {
        wx.showToast({
          title: res
        });
      }
    });
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
