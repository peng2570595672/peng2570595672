
const util = require('../../../utils/util.js');
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    changeAmount: '',// 充值金额，单位分
    orderId: app.globalData.orderInfo.orderId // "880106175582965760" //用户车辆订单号
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

  },
  onShow () {
     this.getRechargeBalance();
  },
 async onSubmit () {
   if (!this.data.changeAmount) return;
     util.go(`/pages/obu/bluetooth/bluetooth?rechargeBalance=${this.data.changeAmount}&orderId=${this.data.orderId}`); // 链接蓝牙设备
  },
  // 可充值圈存金额查询
   async getRechargeBalance () {
      const result = await util.getDataFromServersV2('/consumer/order/after-sale-record/rechargeBalance',{orderId: this.data.orderId});
      if (result.code === 0) {
        this.setData({
          changeAmount: result.data.rechargeBalance
        });
      } else {
        util.showToastNoIcon(result.message);
      }
}

});
