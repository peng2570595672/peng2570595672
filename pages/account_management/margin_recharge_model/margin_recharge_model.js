// pages/account_management/margin_recharge_model/margin_recharge_model.js
const app = getApp();
const util = require('../../../utils/util');
Page({
  data: {
		orderId: undefined,
    depositBalance: 0, // 押金余额
    rechargeAmount: 0, // 充值金额
		isRequest: false,	// 是否请求中
		ETCMargin: undefined// 订单信息
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad (options) {
    let that = this;
		console.log(options);
		const ETCMargin1 = app.globalData.myEtcList.filter(item => item.id === options.Id);
		console.log(ETCMargin1[0]);
    that.setData({
			orderId: ETCMargin1[0].memberId,
      rechargeAmount: Number(0.02).toFixed(2),
      depositBalance: ETCMargin1[0].pledgeMoney / 100,
			ETCMargin: ETCMargin1[0]
    });
		app.globalData.orderInfo.orderId = ETCMargin1[0].id;
  },

  onShow () {

  },

	// pledge-pay	save-order-info	addProtocolRecord
  // 充值点击
  async btnmarginRecharge () {
		wx.uma.trackEvent('package_the_rights_and_interests_next');
		const res = await util.getDataFromServersV2('consumer/order/after-sale-record/addProtocolRecord', {
			orderId: app.globalData.orderInfo.orderId // 订单id
		});
		if (!res) return;
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			shopId: this.data.orderInfo ? this.data.ETCMargin.shopId : app.globalData.newPackagePageData.shopId, // 商户id
			dataType: '3', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:微信实名信息，5:获取银行卡信息，6:行驶证信息，7:车头照，8:车主身份证信息, 9-营业执照
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			shopProductId: this.data.ETCMargin.shopProductId,
			rightsPackageId: this.data.ETCMargin?.id || '',
			areaCode: this.data.orderInfo ? this.data.orderInfo.product.areaCode : app.globalData.newPackagePageData.areaCode
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		if (!result) return;
		if (result.code === 0) {
			if (this.data.listOfPackages[this.data.choiceIndex]?.pledgePrice ||
				this.data.rightsAndInterestsList[this.data.activeEquitiesIndex]?.payMoney) {
				await this.marginPayment();
				return;
			}
			if (this.data.isSalesmanOrder) {
				await this.getSalesmanOrderProcess();
				return;
			}
			util.go('/pages/default/information_list/information_list');
		} else {
			util.showToastNoIcon(result.message);
		}
  },
	// 微信支付
	async weChatPay () {
		if (this.data.isRequest) return;
		this.setData({isRequest: true});
		util.showLoading();
		console.log(this.data.orderInfo);
		let params = {
			orderId: app.globalData.orderInfo.orderId
		};
		const result = await util.getDataFromServersV2('consumer/order/pledge-pay', params);
		if (!result) {
			this.setData({isRequest: false});
			return;
		}
		if (result.code === 0) {
			let extraData = result.data.extraData;
			wx.requestPayment({
				nonceStr: extraData.nonceStr,
				package: extraData.package,
				paySign: extraData.paySign,
				signType: extraData.signType,
				timeStamp: extraData.timeStamp,
				success: (res) => {
					this.setData({isRequest: false});
					if (res.errMsg === 'requestPayment:ok') {
						if (this.data.isSalesmanOrder) {
							if (this.data.orderInfo.base?.flowVersion !== 1) {
								// 无需签约
								util.go('/pages/default/transition_page/transition_page');
								return;
							}
							if (this.data.listOfPackages[this.data.choiceIndex].isSignTtCoupon === 1) {
								// 通通券套餐
								this.setData({isPay: true});
								return;
							}
							// 去支付成功页
							util.go('/pages/default/payment_successful/payment_successful');
							return;
						}
						util.go('/pages/default/information_list/information_list');
					} else {
						util.showToastNoIcon('支付失败！');
					}
				},
				fail: (res) => {
					this.setData({isRequest: false});
					if (res.errMsg !== 'requestPayment:fail cancel') {
						util.showToastNoIcon('支付失败！');
					}
				}
			});
		} else {
			this.setData({isRequest: false});
			util.showToastNoIcon(result.message);
		}
	},

  onUnload () {
    const pages = getCurrentPages();
    const prevPage = pages[pages.length - 2]; // 上一个页面
    prevPage.setData({
      isReload: true // 重置状态
    });
  }
});
