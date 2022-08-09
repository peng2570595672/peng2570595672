// pages/moving_integral/confirm_exchange/confirm_exchange.js
Page({
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const eventChannel = this.getOpenerEventChannel()
    // eventChannel.emit('bound_changyou', {data: 'test'});
    // eventChannel.emit('someEvent', {data: 'test'});
    // 监听 bound_changyou 事件，获取上一页面通过 eventChannel 传送到当前页面的数据
    eventChannel.on('bound_changyou', function(data) {
      console.log(data)
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
	wx.reLaunch({
		url: "pages/Home/Home"
	})
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

})