const util = require('../../../utils/util.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {

  },
  // 在线客服
	goOnlineServer () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
  },
  onReceivingAddress(){
    console.log('-------------------在线客服-----------------')
    util.go(`/pages/truck_handling/truck_receiving_address/truck_receiving_address`);
  }
})