const util = require('../../../utils/util.js');
const app = getApp();
Page({
  /**
   * 页面的初始数据
   */
  data: {
    list: [{
      imgUrl: '../assets/weixin.png',
      title: '微信支付',
      explain: '(手续费0.6%)',
      state: 0
    },{
      imgUrl: '../assets/card.png',
      title: '银行转账',
      explain: '(手续费0.3%)',
      state: 1
    }],
    amount: '',
    orderId: '',
    prechargeInfo: {}
  },
  onLoad (options) {
    this.setData({
      orderId: options.orderId,
      amount: options.amount
    });
  },
  // 输入框输入值
	onInputChangedHandle (e) {
		if (e.detail.value.length > 4) {

		}
    this.setData({
      amount: e.detail.value
    });
  },
  onClickPay (event) {
    let state = event.currentTarget.dataset.state;
		console.log(state);
    if (!this.data.amount) {
      util.showToastNoIcon('请填写需要充值金额');
      return false;
    }
    if (state === 0) {
      this.marginPayment();
    } else {
      this.onCard();
    }
  },
	// 微信支付
	marginPayment () {
		util.showLoading();
		let params = {
			orderId: this.data.orderId,
			rechargeAmount: this.data.amount * 100,
			openid: app.globalData.userInfo.openId
    };
		util.getDataFromServer('/consumer/order/third/wxPay', params, () => {
			util.showToastNoIcon('获取支付参数失败！');
		}, (res) => {
			if (res.code === 0) {
				let extraData = JSON.parse(res.data.payinfo);
				console.log(extraData.nonceStr);
				wx.requestPayment({
					nonceStr: extraData.nonceStr,
					package: extraData.package,
					paySign: extraData.paySign,
					signType: extraData.signType,
					timeStamp: extraData.timeStamp,
					success: (res) => {
						console.log(res,'=------------------');
						if (res.errMsg === 'requestPayment:ok') {
							util.go('/pages/account_management/index/index');
						} else {
							util.showToastNoIcon('支付失败！');
						}
					},
					fail: (res) => {
						if (res.errMsg !== 'requestPayment:fail cancel') {
							util.showToastNoIcon('支付失败！');
						}
					}
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
   // 卡充值
  async onCard () {
      const result = await util.getDataFromServersV2('consumer/order/transact-schedule', {
        orderId: this.data.orderId
      });
      if (!result) return;
      await this.onClickRecharge(result.data);
  },
  async onClickRecharge (info) {
		util.showLoading('正在获取充值账户信息....');
		const result = await util.getDataFromServersV2('consumer/order/third/queryProcessInfo', {
			orderId: this.data.orderId
		});
		util.hideLoading();
		if (!result) return;
		if (result.code === 0) {
			if (!result.data.bankCardNum) {
				setTimeout(() => {
					wx.showToast({
						title: '获取失败',
						icon: 'none',
						duration: 5000
					});
				}, 100);
				return;
      }
      result.data.holdBalance = info.holdBalance;
			this.setData({
				prechargeInfo: result.data || {}
			});
			this.selectComponent('#rechargePrompt').show();
		} else {
			util.showToastNoIcon(result.message);
		}
	}
});
