const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		mask: false,
		wrapper: false,
		line_open: true, // 展开和收起
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
		if (app.globalData.billingDetails) {
			this.setData({
				details: app.globalData.billingDetails
			});
			let { mergeId, deductType } = this.data.details;
			if (mergeId === 0 && deductType === 2) {
				// 周结合并流水账单
				this.getWeeksToCombineAndFlow();
			}
			console.log('app.globalData.billingDetails', app.globalData.billingDetails);
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
				if (!this.data.firstCar) {
					this.setData({ firstCar: await util.getBindGuests() });
				}
				this.getBillDetail();
			}
		}
	},
	async onShow () {
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
				}, async (res) => {
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
							if (!this.data.firstCar) {
								this.setData({ firstCar: await util.getBindGuests() });
							}
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
	// 查询获取周结合并流水
	getWeeksToCombineAndFlow () {
		util.showLoading();
		let params = {
			detailId: this.data.details.id
		};
		util.getDataFromServer('consumer/etc/get-merge-bills', params, () => {
			util.showToastNoIcon('获取周结合并流水失败');
		}, (res) => {
			util.hideLoading();
			if (res.code === 0 && res.data) {
				this.setData({
					'details.weekList': res.data
				});
				console.log(this.data.details.weekList);
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
				let { mergeId, deductType } = res.data;
				if (mergeId === 0 && deductType === 2) {
					// 周结合并流水账单
					this.getWeeksToCombineAndFlow();
				}
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
	openVe (e) {
		console.log(this.data.line_open);
		this.setData({
			line_open: !this.data.line_open
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
		// this.selectComponent('#popTipComp').show({type: 'bingGuttesBill',title: '礼品领取',bgColor: 'rgba(0,0,0,0.65)'});
		if (this.data.details?.vehPlates.includes('云')) {
			this.selectComponent('#popTipComp').show({ type: 'newPop', title: '云', bgColor: 'rgba(0,0,0, 0.6)' });
		} else {
			this.selectComponent('#popTipComp').show({ type: 'newPop', title: '全国', bgColor: 'rgba(0,0,0, 0.6)' });
		}
	},
	lateFees (e) {
		let content = '';
		let flag = +e.currentTarget.dataset['flag'];
		if (flag === 1) {
			content = '因微信单日代扣金额上限为1500.00元，剩余部分将会在第二日0:00自动补扣。\n为避免影响您的实际通行，可提前手动完成补缴，结清账款。';
		} else {
			content = '滞纳金的计算将从通行费实际发生扣款失败的第7天开始，按照欠缴金额的0.05%每日计算滞纳金。\n计算示例：假设欠缴通行费用为1000元，且拖延了10天未补缴，则滞纳金计算如下：1000元 × 0.05% × 10天 = 5元。';
		}
		this.selectComponent('#popTipComp').show({
			type: 'publicModule',
			title: flag === 1 ? '待扣金额说明' : '滞纳金说明',
			bgColor: 'rgba(0,0,0, 0.6)',
			btnconfirm: '我知道了',
			content: content
		});
	},
	// 打电话
	phone (e) {
		this.selectComponent('#popTipComp').show({
			type: 'callPhone',
			title: '拨打电话',
			btnCancel: '取消',
			btnconfirm: '拨打',
			content: e.currentTarget.dataset.phone,
			callBack: () => {
				wx.makePhoneCall({
					phoneNumber: e.currentTarget.dataset.phone
				});
			}
		});
	},
	onUnload () {
		app.globalData.billingDetails = undefined;
	}
});
