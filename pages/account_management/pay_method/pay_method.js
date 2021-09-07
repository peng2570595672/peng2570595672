const util = require('../../../utils/util.js');
Page({
  /**
   * 页面的初始数据
   */
  data: {
    list:[{
      imgUrl:"../assets/weixin.png",
      title:'微信支付',
      explain:'(手续费0.6%)',
      state:0
    },{
      imgUrl:"../assets/card.png",
      title:'银行转账',
      explain:'(手续费0.3%)',
      state:1
    }],
    amount:""
  },
  // 输入框输入值
	onInputChangedHandle (e) {
    this.setData({
      amount: e.detail.value
    })
  },
  onClickPay(event){
    let e=event.currentTarget.dataset.id;
    if(!this.data.amount){
      util.showToastNoIcon('请填写需要充直金额');
      return false
    }
    if(e.state==0){
      util.go(`/pages/account_management/pay_accout/pay_accout?amount=${this.data.amount}`);
    }else{
      util.go(`/pages/account_management/account_recharge/account_recharge`);
    }
  }
})