const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isContinentInsurance: false, // 是否是大地保险
		showWeiBao: true,
		isRequest: false,// 是否请求
		details: ''
	},
	onLoad (options) {
		this.setData({
			isContinentInsurance: app.globalData.isContinentInsurance
		});
		if (options.id) {
			this.setData({details: options});
		}
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		} else {
			this.getBillDetail();
		}
	},
	onShow () {
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		} else {
			this.getBillDetail();
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
	// 去账单说明
	goOrderInstructions () {
		util.go('/pages/personal_center/order_instructions/order_instructions?details=' + JSON.stringify(this.data.details));
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
				this.setData({details: res.data});
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
			payAmount: this.data.details.etcMoney// 补缴金额
		};
		util.getDataFromServer('consumer/order/bill-pay', params, () => {
			util.showToastNoIcon('获取支付参数失败！');
		}, (res) => {
			if (res.code === 0) {
				let extraData = res.data.extraData;
				wx.requestPayment({
					nonceStr: extraData.nonceStr,
					package: extraData.package,
					paySign: extraData.paySign,
					signType: extraData.signType,
					timeStamp: extraData.timeStamp,
					success: (res) => {
						this.setData({isRequest: false});
						if (res.errMsg === 'requestPayment:ok') {
							this.getBillDetail();
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
	// 微保活动
	goMicroInsurance () {
		util.go(`/pages/web/web/web?type=weiBao&entrance=bill`);
	}
});
