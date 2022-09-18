// pages/account_management/margin_recharge_model/margin_recharge_model.js
const app = getApp();
const util = require('../../../utils/util');
Page({
	data: {
		orderId: undefined,
		depositBalance: 0, // 押金余额
		rechargeAmount: 0, // 充值金额
		isRequest: false,	// 是否请求中
		ETCMargin: undefined,	// 订单信息
		orderInfo: undefined,
		listOfPackages: undefined	//// 加购权益列表
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	async onLoad(options) {
		let that = this;
		console.log(options);
		const ETCMargin1 = app.globalData.myEtcList.filter(item => item.id === options.Id);
		console.log(ETCMargin1[0]);
		that.setData({
			// orderId: ETCMargin1[0].memberId,
			rechargeAmount: Number(0.02).toFixed(2),
			depositBalance: ETCMargin1[0].pledgeMoney / 100,
			ETCMargin: ETCMargin1[0]
		});
		app.globalData.orderInfo.orderId = ETCMargin1[0].id;
		// 已选择套餐 && 未支付
		await that.getOrderInfo();
	},

	onShow() {

	},
	// 已选择套餐 && 未支付
	async getOrderInfo(initProduct = true, isSearchPay = false) {
		const result = await util.getDataFromServersV2('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '13'
		});
		if (!result) return;
		if (result.code === 0) {
			if (isSearchPay) {
				if (result.data.product?.ttDeductStatus === 0) {
					util.go('/pages/default/payment_fail/payment_fail?type=main_process');
				} else {
					this.submitOrder();
				}
				return;
			}
			this.setData({
				isPay: result.data.product?.shopProductId && (result.data.base?.pledgeStatus === -1 || result.data.base?.pledgeStatus === 1),
				isSalesmanOrder: result.data.base.orderType === 31,
				orderInfo: result.data
			});
			if (result.data.product?.ttContractStatus === 1 && result.data.product?.ttDeductStatus !== 1) {
				// 签约通通券1有 0未   通通券扣款情况1有 0未  2失败
				// 发起扣款
				util.showToastNoIcon('签约成功');
				await this.deductByContractThird();
			}
			if (initProduct) {
				await this.getProductOrderInfo();
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 获取 套餐信息
	async getProductOrderInfo () {
		const result = await util.getDataFromServersV2('consumer/order/get-product-by-order-id', {
			orderId: app.globalData.orderInfo.orderId,
			needRightsPackageIds: true
		});
		
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				listOfPackages: result.data
			});
		} else {
			util.showToastNoIcon(result.message);
		}
		console.log('获取',this.data.listOfPackages);
	},
	// 提交订单
	async submitOrder () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		util.showLoading('加载中');
		let params = {
			dataComplete: 1,// 资料已完善
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			orderId: app.globalData.orderInfo.orderId
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({isRequest: false});
		if (!result) return;
		if (result.code === 0) {
			util.go(`/pages/default/processing_progress/processing_progress?orderId=${app.globalData.orderInfo.orderId}&type=main_process`);
		} else {
			util.showToastNoIcon(result.message);
		}
	},

	// pledge-pay	save-order-info	addProtocolRecord
	// 充值点击
	async btnmarginRecharge() {
		wx.uma.trackEvent('package_the_rights_and_interests_next');
		const res = await util.getDataFromServersV2('consumer/order/after-sale-record/addProtocolRecord', {
			orderId: app.globalData.orderInfo.orderId // 订单id
		});
		console.log(app.globalData.userInfo);
		console.log(res);
		if (!res) return;
		let params = {
			orderId: this.data.orderInfo.base.orderId, // 订单id
			shopId: this.data.orderInfo.base.shopId, // 商户id
			dataType: '3', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:微信实名信息，5:获取银行卡信息，6:行驶证信息，7:车头照，8:车主身份证信息, 9-营业执照
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			shopProductId: this.data.listOfPackages.shopProductId,
			rightsPackageId: '',
			areaCode: this.data.orderInfo.product.areaCode
		};
		console.log("参数：",params);
		// 下单接口
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		console.log(result);
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
	async weChatPay() {
		if (this.data.isRequest) return;
		this.setData({ isRequest: true });
		util.showLoading();
		console.log(this.data.orderInfo);
		let params = {
			orderId: this.data.orderInfo.base.orderId
		};
		// 支付接口
		const result = await util.getDataFromServersV2('consumer/order/pledge-pay', params);
		if (!result) {
			this.setData({ isRequest: false });
			return;
		}
		console.log(result);
		if (result.code === 0) {
			let extraData = result.data.extraData;
			wx.requestPayment({
				nonceStr: extraData.nonceStr,
				package: extraData.package,
				paySign: extraData.paySign,
				signType: extraData.signType,
				timeStamp: extraData.timeStamp,
				success: (res) => {
					this.setData({ isRequest: false });
					if (res.errMsg === 'requestPayment:ok') {
						if (this.data.isSalesmanOrder) {
							if (this.data.orderInfo.base?.flowVersion !== 1) {
								// 无需签约
								util.go('/pages/default/transition_page/transition_page');
								return;
							}
							if (this.data.listOfPackages[this.data.choiceIndex].isSignTtCoupon === 1) {
								// 通通券套餐
								this.setData({ isPay: true });
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
					this.setData({ isRequest: false });
					if (res.errMsg !== 'requestPayment:fail cancel') {
						util.showToastNoIcon('支付失败！');
					}
				}
			});
		} else {
			this.setData({ isRequest: false });
			util.showToastNoIcon(result.message);
		}
	},

	onUnload() {
		const pages = getCurrentPages();
		const prevPage = pages[pages.length - 2]; // 上一个页面
		prevPage.setData({
			isReload: true // 重置状态
		});
	}
});
