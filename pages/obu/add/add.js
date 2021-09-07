
const util = require('../../../utils/util.js');
const app=getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    changeAmount:"0",//充值金额，单位分
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  },
 async onSubmit(){
    let params={
      orderId:app.globalData.orderId,
      changeAmount:this.data.changeAmount
    }
       
    //const result = await util.getDataFromServersV2("/consumer/order/icbc2/recharge", params);
   util.go("/pages/obu/bluetooth/bluetooth") //链接蓝牙设备
  
  }

  
})