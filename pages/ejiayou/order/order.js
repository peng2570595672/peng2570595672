const util = require('../../../utils/util.js');
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    page: 1,
    pangeSiez: 10,
    orderList: [],
    total: 0 // 总条数
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.getOrderList();
  },
  onReachBottom () { // 页面上拉触底事件的处理函数
    if (this.data.list.length >= this.data.total) return;
    this.setData({
			page: this.data.page + 1
    });
    this.getOrderList();
  },
  // 加载列表
  async getOrderList () {
    util.showLoading({title: '加载中'});
    let params = {
      userPhone: '18685132687',// app.globalData.mobilePhone,// 	是 	string 	手机号
      stationId: '',
      page: this.data.page
    };
    const result = await util.getDataFromServersV2('consumer/order/oil/userOrderList', params);
    if (result.code != 0) return;
        let list = result.data.orderList || [];
            list.forEach(element => {
              if (element.orderState == 2) element.orderStareString = '已完成';
              if (element.orderState == 3) element.orderStareString = '退款中';
              if (element.orderState == 4) element.orderStareString = '已退款';
            });
        this.setData({
          orderList: this.data.orderList.concat(list),
          total: result.data.allPageNum
       });
       console.log(this.data.orderList,'----------00000');
  },
  getPhone () {
    wx.makePhoneCall({
      phoneNumber: '4008396555', // 仅为示例，并非真实的电话号码
      success: () => {},
      fail: () => {}
    });
  },
  // 退款
  onRefund () {
    let $this = this;
    wx.showModal({
      title: '请联系易加油人工客服4008396555申请退款',
      showCancel: false,
      confirmText: '立即呼叫',
      confirmColor: '#00B85C',
      success () {
        $this.getPhone();
      }
    });
  }
});
