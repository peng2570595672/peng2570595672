/**
 * @author 狂奔的蜗牛
 * @desc 办理进度
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		type: undefined,// 进入类型,是否是主流程进入
		marginPaymentMoney: 0,// 保证金金额
		orderId: undefined,
		isRequest: false
	},
	onLoad (options) {
		if (options.type) {
			this.setData({
				type: options.type
			});
		}
		this.setData({marginPaymentMoney: options.marginPaymentMoney});
	},
	// 在线客服
	goOnlineServer () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	// ETC服务状态提醒（A）
	subscribe () {
		// 判断版本，兼容处理
		let result = util.compareVersion(app.globalData.SDKVersion, '2.8.2');
		if (result >= 0) {
			util.showLoading({
				title: '加载中...'
			});
			wx.requestSubscribeMessage({
				tmplIds: ['KHm6ZwknZILp2N5Ig_RhfXkHfVRvePxcTGu4F4Evzh4'],
				success: (res) => {
					mta.Event.stat('032',{});
					wx.hideLoading();
					if (res.errMsg === 'requestSubscribeMessage:ok') {
						let keys = Object.keys(res);
						// 是否存在部分未允许的订阅消息
						let isReject = false;
						for (let key of keys) {
							if (res[key] === 'reject') {
								isReject = true;
								break;
							}
						}
						// 有未允许的订阅消息
						if (isReject) {
							util.alert({
								content: '检查到当前订阅消息未授权接收，请授权',
								showCancel: true,
								confirmText: '授权',
								confirm: () => {
									wx.openSetting({
										success: (res) => {
										},
										fail: () => {
											util.showToastNoIcon('打开设置界面失败，请重试！');
										}
									});
								},
								cancel: () => { // 点击取消按钮
									this.marginPayment();
								}
							});
						} else {
							this.marginPayment();
						}
					}
				},
				fail: (res) => {
					wx.hideLoading();
					// 不是点击的取消按钮
					if (res.errMsg === 'requestSubscribeMessage:fail cancel') {
						this.marginPayment();
					} else {
						util.alert({
							content: '调起订阅消息失败，是否前往"设置" -> "订阅消息"进行订阅？',
							showCancel: true,
							confirmText: '打开设置',
							confirm: () => {
								wx.openSetting({
									success: (res) => {
									},
									fail: () => {
										util.showToastNoIcon('打开设置界面失败，请重试！');
									}
								});
							},
							cancel: () => {
								this.marginPayment();
							}
						});
					}
				}
			});
		} else {
			util.alert({
				title: '微信更新提示',
				content: '检测到当前微信版本过低，可能导致部分功能无法使用；可前往微信“我>设置>关于微信>版本更新”进行升级',
				confirmText: '继续使用',
				showCancel: true,
				confirm: () => {
					this.marginPayment();
				}
			});
		}
	},
	// 支付保证金
	marginPayment () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		util.showLoading();
		let params = {
			orderId: app.globalData.orderInfo.orderId
		};
		util.getDataFromServer('consumer/order/pledge-pay', params, () => {
			this.setData({isRequest: false});
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
							util.go('/pages/default/signed_successfully/signed_successfully?isPaymentProcess=true');
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
	onUnload () {
		if (this.data.type && this.data.type === 'main_process') {
			wx.reLaunch({
				url: '/pages/Home/Home'
			});
		}
	}
});
