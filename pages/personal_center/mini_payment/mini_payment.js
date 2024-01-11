import {initProductName} from "../../../utils/utils";

/**
 * @author 老刘
 * @desc 第三方小程序跳我方小程序支付
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		orderInfo: {},
		pledgeType: 0,
		isRequest: false,
		isLogin: false
	},
	onLoad (options) {
		wx.hideHomeButton();
		let orderInfo = decodeURIComponent(options.orderInfo);
		orderInfo = JSON.parse(orderInfo);
		this.setData({
			orderInfo
		});
		app.globalData.orderInfo.orderId = orderInfo.orderId;
		this.login();
	},
	onShow () {
	},
	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: async (res) => {
				const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				});
				if (!result) return;
				if (result.code === 0) {
					result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
					// 已经绑定了手机号
					if (result.data.needBindingPhone !== 1) {
						app.globalData.userInfo = result.data;
						app.globalData.openId = result.data.openId;
						app.globalData.memberId = result.data.memberId;
						app.globalData.mobilePhone = result.data.mobilePhone;
						this.setData({isLogin: true});
						this.getETCDetail();
					}
				} else {
					util.showToastNoIcon(result.message);
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	// 加载订单详情
	async getETCDetail () {
		const result = await util.getDataFromServersV2('consumer/order/order-detail', {
			orderId: this.data.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			let orderInfo = result.data;
			this.setData({pledgeType: orderInfo.pledgeType});
			if (orderInfo.status === 0) {
				// pledgeStatus 状态，-1 无需支付 0-待支付，1-已支付，2-退款中，3-退款成功，4-退款失败
				if (orderInfo.pledgeStatus === 1 || orderInfo.pledgeStatus === -1) {
					wx.reLaunch({
						url: '/pages/default/information_list/information_list'
					});
				}
			} else {
				wx.reLaunch({
					url: '/pages/personal_center/my_etc_detail/my_etc_detail'
				});
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 支付
	async handlePay () {
		if (this.data.isRequest) return;
		this.setData({isRequest: true});
		util.showLoading();
		let params = {};
		if (this.data.pledgeType === 4) {
			// 押金模式
			params = {
				payVersion: 'v3',
				tradeType: 1,
				orderId: app.globalData.orderInfo.orderId,
				openid: app.globalData.openId
			};
		} else {
			// 普通模式
			params = {
				orderId: app.globalData.orderInfo.orderId
			};
		}
		const result = await util.getDataFromServersV2('consumer/order/pledge-pay', params);
		console.log(result);
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
						wx.reLaunch({
							url: '/pages/default/information_list/information_list'
						});
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
	onGetPhoneNumber (e) {
		if (e.detail.errno === 1400001) {
			util.showToastNoIcon('开发方预存费用不足！');
			return;
		}
		// 允许授权
		if (e.detail.errMsg === 'getPhoneNumber:ok') {
			let encryptedData = e.detail.encryptedData;
			let iv = e.detail.iv;
			util.showLoading({
				title: '登录中...'
			});
			let params = {
				certificate: this.data.loginInfo.certificate,
				encryptedData: encryptedData, // 微信加密数据
				iv: iv // 微信加密数据
			};
			if (app.globalData.isWeChatSudoku) {
				params['sourceType'] = 9;// 九宫格进入
				params['sourceId'] = app.globalData.otherPlatformsServiceProvidersId;
			}
			util.getDataFromServer('consumer/member/common/applet/bindingPhone', params, () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}, (res) => {
				// 绑定手机号成功
				if (res.code === 0) {
					res.data['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
					app.globalData.userInfo = res.data; // 用户登录信息
					app.globalData.openId = res.data.openId;
					app.globalData.memberId = res.data.memberId;
					app.globalData.mobilePhone = res.data.mobilePhone;
					let loginInfo = this.data.loginInfo;
					loginInfo['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
					loginInfo.needBindingPhone = 0;
					wx.setStorageSync('login_info_final', JSON.stringify(loginInfo));
					this.setData({isLogin: true});
					this.handlePay();
				} else {
					util.hideLoading();
					util.showToastNoIcon(res.message);
				}
			});
		}
	}
});
