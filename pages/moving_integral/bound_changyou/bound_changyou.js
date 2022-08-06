// pages/moving_integral/bound_changyou/bound_changyou.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    phone_number: '15870105857'.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2"),	//电话号码 隐藏号码的中间四位
    moving_integral: 399,	//移动积分
    // flag: false, //根据是否绑定控制页面元素的显示与隐藏
    pass_ticket: [
      {
        price: 5,
        integral: 200,
      },
      {
        price: 10,
        integral: 500,
      },
      {
        price: 15,
        integral: 800,
      },
      {
        price: 20,
        integral: 1200,
      },
      {
        price: 5,
        integral: 200,
      },
      {
        price: 10,
        integral: 500,
      },
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    
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

  },
  // 确认兑换
  confirm_exchange (e) {
    const value = e.currentTarget.dataset
    const phone_number = this.data.phone_number
    const moving_integral = this.data.moving_integral
    wx.navigateTo({
      url: "/pages/moving_integral/confirm_exchange/confirm_exchange",
      success: function (res){
        res.eventChannel.emit('bound_changyou', { data: {
          phone_number: phone_number,
          moving_integral: moving_integral,
          price: value.price,
          integral: value.integral
        } })
      }
    })
    console.log("点击确认");
  }

})