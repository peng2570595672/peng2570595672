const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		mask: false,
		wrapper: false,
		isContinentInsurance: app.globalData.isContinentInsurance || app.globalData.isPingAn,
		isServiceNotificationEntry: false, // 是否是服务通知进入
		isRequest: false, // 是否请求
		refundDetails: undefined,
		contractMode: undefined, // 签约方式 - 扣款方式
		requestRefundInfoNum: 0,
		requestBillNum: 0,
		details: '',
		disclaimerDesc: app.globalData.disclaimerDesc,
		isQingHaiHighSpeed: false,// 是否是青海高速办理,需要隐藏平安绑车
		firstCar: app.globalData.pingAnBindGuests	// 平安获客
	},
	async onLoad (options) {
		app.globalData.splitDetails = undefined;
		this.setData({
			isQingHaiHighSpeed: app.globalData.isQingHaiHighSpeed
		});
		if (!this.data.firstCar) {
			this.setData({firstCar: await util.getBindGuests()});
		}
		if (app.globalData.billingDetails) {
			this.setData({
				details: app.globalData.billingDetails
			});
		} else {
			if (options.id) {
				this.setData({
					details: options
				});
			}
			if (!app.globalData.userInfo.accessToken) {
				// 公众号模板推送/服务通知进入
				wx.uma.trackEvent('order_details_for_notice');
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
			this.setData({
				details: app.globalData.billingDetails
			});
			this.getContractMode();
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
		console.log('账单详情top:', this.data.details);
	},
	goPath () {
		util.go(`/pages/web/web/web?url=${encodeURIComponent('https://baier.soboten.com/chat/h5/v6/index.html?sysnum=7d11a91e6a20414da4186004d03807fd&channelid=7&useWxjs=true')}`);
		// util.go(`/pages/web/web/web?url=${encodeURIComponent('https://wpa1.qq.com/UDoer16d?_type=wpa&qidian=true')}`);
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
							this.getStatus();
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
	// 获取订单信息 进入微保查询 myEtcList --从推送进入
	getStatus () {
		util.showLoading();
		let params = {
			openId: app.globalData.openId
		};
		util.getDataFromServer('consumer/order/my-etc-list', params, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				app.globalData.myEtcList = res.data;
				if (this.data.details?.vehPlate) this.getContractMode(); // 获取扣款方式
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 获取扣款方式
	getContractMode () {
		util.showLoading();
		const orderInfo = app.globalData.myEtcList.find(item => item.vehPlates === this.data.details.vehPlate);
		let params = {
			orderId: orderInfo?.id
		};
		util.getDataFromServer('consumer/order/getContractMode', params, () => {
			util.showToastNoIcon('获取扣款方式失败！');
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				this.setData({
					contractMode: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
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
					this.setData({
						refundDetails: res.data
					});
					if (JSON.stringify(app.globalData.myEtcList) !== '{}') this.getContractMode(); // 获取扣款方式
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 查看拆分列表
	goSplitList () {
		app.globalData.splitDetails = this.data.details;
		this.setData({
			requestRefundInfoNum: 0,
			requestBillNum: 0
		});
		util.go('/pages/personal_center/split_bill/split_bill');
	},
	goOrderQuestions () {
		this.setData({
			requestRefundInfoNum: 0,
			requestBillNum: 0
		});
		util.go(`/pages/personal_center/order_questions/order_questions?entrance=1&details=${JSON.stringify(this.data.details)}&refundDetails=${JSON.stringify(this.data.refundDetails || '')}`);
		// util.go(`/pages/personal_center/order_answer/order_answer`);
	},
	// 查询账单详情
	getBillDetail () {
		if (this.data.requestBillNum > 0) return;
		this.setData({
			requestBillNum: 1
		});
		util.showLoading();
		let params = {
			channel: this.data.details.channel,
			id: this.data.details.id,
			month: this.data.details.month
		};
		util.getDataFromServer('consumer/etc/get-bill-by-id', params, () => {
			util.showToastNoIcon('获取账单详情失败！');
		}, (res) => {
			console.log('账单详情：', res);
			util.hideLoading();
			if (res.code === 0) {
				res.data.flowVersion = 1;
				this.setData({
					details: res.data
				});
				if (this.data.requestRefundInfoNum > 0) return;
				this.setData({
					requestRefundInfoNum: 1
				});
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
		if (this.data.details.splitState && this.data.details.splitState === 1) {
			// 拆分流水
			this.goSplitList();
			return;
		}
		if (this.data.details.passDeductStatus && (this.data.details.passDeductStatus === 2 || this.data.details.passDeductStatus === 10)) {
			// 通行费欠费且通行费手续费欠费
			util.go('/pages/personal_center/make_up_immediately/make_up_immediately?details=' + JSON.stringify(this.data.details));
			return;
		}
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({
				isRequest: true
			});
		}
		util.showLoading();
		let params = {
			billIdList: [this.data.details.id], // 账单id集合，采用json数组格式[xx,xx]
			payTypeDetail: {
				[this.data.details.id]: 1
			}, //  {"账单id1"：1或者2或者3，"账单id2"：1或者2或者3} 1：通行费补缴  2：通行费手续费补缴  3：1+2补缴
			vehPlates: this.data.details.vehPlate, // 车牌号
			payAmount: this.data.details.totalMmout + (this.data.details.poundageFlag ? this.data.details.poundage || 0 : 0) + this.data.details.serviceMoney - this.data.details.splitDeductedMoney - (this.data.details.discountMount || 0) - this.data.details.deductServiceMoney // 补缴金额
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
						this.setData({
							isRequest: false
						});
						if (res.errMsg === 'requestPayment:ok') {
							app.globalData.isArrearageData.isPayment = true;
							this.getBillQuery(id);
						} else {
							util.showToastNoIcon('支付失败！');
						}
					},
					fail: (res) => {
						this.setData({
							isRequest: false
						});
						if (res.errMsg !== 'requestPayment:fail cancel') {
							util.showToastNoIcon('支付失败！');
						}
					}
				});
			} else {
				this.setData({
					isRequest: false
				});
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 同步支付信息
	getBillQuery (id) {
		this.setData({
			requestBillNum: 0
		});
		util.getDataFromServer('consumer/order/billQuery', {
			id: id
		}, () => {
			this.getBillDetail();
		}, (res) => {
			console.log(res);
			this.getBillDetail();
		}, app.globalData.userInfo.accessToken);
	},
	// 跳转平安绑客
	goPingAn () {
		// 授权提醒
		this.selectComponent('#popTipComp').show({type: 'bingGuttesBill',title: '礼品领取',bgColor: 'rgba(0,0,0,0.65)'});
	},
	onUnload () {
		app.globalData.billingDetails = undefined;
	}
});
