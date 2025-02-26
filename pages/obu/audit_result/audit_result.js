const util = require('../../../utils/util.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
	  type: 0,
    state: '1'
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
   this.setData({
	   type: +options.type,
    state: options.state
   });
  },
  onRetry () { // 重试
    util.go(`/pages/obu/add/add?type=${this.data.type}`);
  },
  onAccount () { // 查看账户
  	if (this.data.type === 2) {
			util.go(`/pages/account_management/bocom_account_details/bocom_account_details`);
			return;
		}
    util.go('/pages/account_management/account_details/account_details');
  }
});
