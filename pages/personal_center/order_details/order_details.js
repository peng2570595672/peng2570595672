const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		mask: false,
		wrapper: false,
		isContinentInsurance: false, // 是否是大地保险
		showWeiBao: true,
		isServiceNotificationEntry: false,// 是否是服务通知进入
		isRequest: false,// 是否请求
		refundDetails: undefined,
		popupContent: {},
		details: ''
	},
	onLoad (options) {
		app.globalData.splitDetails = undefined;
		if (app.globalData.billingDetails) {
			// 总对总账单
			if (app.globalData.billingDetails.productName.includes('微信')) {
				app.globalData.billingDetails.productType = 1;
			} else {
				app.globalData.billingDetails.productType = 2;
			}
			this.setData({details: app.globalData.billingDetails});
		} else {
			this.setData({
				isContinentInsurance: app.globalData.isContinentInsurance
			});
			if (options.id) {
				this.setData({details: options});
			}
			if (!app.globalData.userInfo.accessToken) {
				// 公众号模板推送/服务通知进入
				mta.Event.stat('service_notifications_order_details',{});
				this.setData({
					isServiceNotificationEntry: true
				});
				this.login();
			} else {
				this.getBillDetail();
			}
		}
	},
	onShow () {
		if (app.globalData.billingDetails) {
			if (app.globalData.billingDetails.productName.includes('微信')) {
				app.globalData.billingDetails.productType = 1;
			} else {
				app.globalData.billingDetails.productType = 2;
			}
			this.setData({details: app.globalData.billingDetails});
			if (this.data.details.channel === 5) {
				// 天津退费
				this.getBillRefundDetail();
			}
		} else {
			if (!app.globalData.userInfo.accessToken) {
				this.login();
			} else {
				this.getBillDetail();
			}
		}
		if (app.globalData.splitDetails) {
			this.setData({
				details: app.globalData.splitDetails
			});
		}
	},
	hide () {
		this.setData({
			showWeiBao: false
		});
	},
	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: (res) => {
				util.getDataFromServer('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				}, () => {
					util.hideLoading();
					util.showToastNoIcon('登录失败！');
				}, (res) => {
					if (res.code === 0) {
						res.data['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
						this.setData({
							loginInfo: res.data
						});
						// 已经绑定了手机号
						if (res.data.needBindingPhone !== 1) {
							app.globalData.userInfo = res.data;
							app.globalData.openId = res.data.openId;
							app.globalData.memberId = res.data.memberId;
							app.globalData.mobilePhone = res.data.mobilePhone;
							// 查询最后一笔订单状态
							this.getBillDetail();
						} else {
							util.hideLoading();
						}
					} else {
						util.hideLoading();
						util.showToastNoIcon(res.message);
					}
				});
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	// 查询账单退费详情
	getBillRefundDetail () {
		util.showLoading();
		let params = {
			channel: this.data.details.channel,
			detailId: this.data.details.id
		};
		util.getDataFromServer('consumer/etc/get-refund-info', params, () => {
			util.showToastNoIcon('获取退费详情失败！');
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				if (res.data) {
					this.setData({refundDetails: res.data});
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 隐藏弹窗
	onHandle () {
		app.globalData.splitDetails = this.data.details;
		util.go('/pages/personal_center/split_bill/split_bill');
	},
	// 去账单说明
	goOrderInstructions () {
		let popupContent = {
			content: '由于该通行账单金额过大导致扣费失败，为保证你的正常通行，系统将自动拆分账单金额发起扣款。',
			confirm: '查看扣款记录'
		};
		this.setData({
			popupContent
		});
		this.selectComponent('#popup').show();
		// util.go('/pages/personal_center/order_instructions/order_instructions?details=' + JSON.stringify(this.data.details));
	},
	callHotLine (e) {
		let model = e.currentTarget.dataset.model;
		console.log(model);
		wx.makePhoneCall({
			phoneNumber: model // 此号码并非真实电话号码，仅用于测试
		});
	},
	// 查询账单详情
	getBillDetail () {
		util.showLoading();
		let params = {
			channel: this.data.details.channel,
			id: this.data.details.id,
			month: this.data.details.month
		};
		util.getDataFromServer('consumer/etc/get-bill-by-id', params, () => {
			util.showToastNoIcon('获取账单详情失败！');
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				res.data.flowVersion = 1;
				if (res.data.productName.includes('微信')) {
					res.data.productType = 1;
				} else {
					res.data.productType = 2;
				}
				this.setData({details: res.data});
				this.getBillRefundDetail();
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 去补缴
	go () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		util.showLoading();
		let params = {
			billIdList: [this.data.details.id],// 账单id集合，采用json数组格式[xx,xx]
			vehPlates: this.data.details.vehPlate,// 车牌号
			payAmount: this.data.details.serviceMoney ? this.data.details.etcMoney + this.data.details.serviceMoney : this.data.details.etcMoney // 补缴金额
		};
		util.getDataFromServer('consumer/order/bill-pay', params, () => {
			util.showToastNoIcon('获取支付参数失败！');
		}, (res) => {
			if (res.code === 0) {
				let extraData = res.data.extraData;
				let id = res.data.id;
				wx.requestPayment({
					nonceStr: extraData.nonceStr,
					package: extraData.package,
					paySign: extraData.paySign,
					signType: extraData.signType,
					timeStamp: extraData.timeStamp,
					success: (res) => {
						this.setData({isRequest: false});
						if (res.errMsg === 'requestPayment:ok') {
							this.getBillQuery(id);
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
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 同步支付信息
	getBillQuery (id) {
		util.getDataFromServer('consumer/order/billQuery', {id: id}, () => {
			this.getBillDetail();
		}, (res) => {
			console.log(res);
			this.getBillDetail();
		}, app.globalData.userInfo.accessToken);
	},
	// 微保活动
	goMicroInsurance () {
		mta.Event.stat('order_details_weibao',{});
		if (this.data.isServiceNotificationEntry) {
			mta.Event.stat('order_details_service_notifications_weibao',{});
		}
		util.go(`/pages/web/web/web?type=weiBao&entrance=bill`);
	},
	onUnload () {
		app.globalData.billingDetails = undefined;
	}
});
