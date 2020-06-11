const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		showDetailWrapper: false, // 控制购买成功弹窗
		showDetailMask: false, // 控制购买成功弹窗
		alertMask: false, // 控制活动细则弹窗
		alertWrapper: false, // 控制活动细则弹窗
		loginInfo: undefined,
		isRequest: false,// 是否请求
		time: 5,
		carList: [],
		voucherMsg: undefined
	},
	onLoad () {
		// this.succeedPop();
		// console.log(this.globalData.rechargeCode)  PZ4mWZcP
		util.resetData();// 重置数据
		wx.hideHomeButton();
		this.getVoucherMsg();
		this.login();
		let carHead = '京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领';
		let carList = [];
		for (let i = 0; i <= 2; i += 1) {
			let random = Math.random() * 32;
			let letter = String.fromCharCode(Math.floor(Math.random() * 26) + 'A'.charCodeAt(0));
			let item = `${carHead.substring(random,random + 1)}${letter}***${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)} 刚购买`;
			carList.push(item);
		}
		this.setData({carList});
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
						util.hideLoading();
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
	// 购买成功弹窗
	succeedPop () {
		this.setData({
			showDetailWrapper: true,
			showDetailMask: true
		});
		this.setData({
			time: 5
		});
		let timer = setInterval(() => {
			this.setData({
				time: --this.data.time
			});
			if (this.data.time === 0) {
				clearInterval(timer);
			} else {
			}
		}, 1000);
	},
	// 跳转卡券列表
	goVoucher () {
		if (this.data.time > 0) {
			return;
		}
		this.rulesWinHide();
		util.go(`/pages/personal_center/service_card_voucher/service_card_voucher`);
	},
	// 获取购买卡券的信息
	getVoucherMsg () {
		util.showLoading();
		let params = {
			BSCS: app.globalData.rechargeCode
		};
		util.getDataFromServer('consumer/voucher/common/get-config-info-by-shop-qr-code', params, () => {
			util.showToastNoIcon('获取卡券信息失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					voucherMsg: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 获取手机号
	onGetPhoneNumber (e) {
		// 允许授权
		if (e.detail.errMsg === 'getPhoneNumber:ok') {
			let encryptedData = e.detail.encryptedData;
			let iv = e.detail.iv;
			util.showLoading({
				title: '绑定中...'
			});
			util.getDataFromServer('consumer/member/common/applet/bindingPhone', {
				sourceType: 5,// 用户来源类型 5-面对面引流 7-微信引流
				sourceId: app.globalData.otherPlatformsServiceProvidersId,// 来源标识 面对面引流时传服务商id，微信引流时，1-为城市服务
				certificate: this.data.loginInfo.certificate,
				encryptedData: encryptedData, // 微信加密数据
				iv: iv // 微信加密数据
			}, () => {
				util.hideLoading();
				util.showToastNoIcon('绑定手机号失败！');
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
					this.setData({
						loginInfo
					});
					this.onClickBuy();
				} else {
					util.hideLoading();
					util.showToastNoIcon(res.message);
				}
			});
		}
	},
	// 立即购买
	onClickBuy () {
		if (this.data.voucherMsg.order_memberId !== app.globalData.memberId) {
			util.showToastNoIcon('该车辆不在您的名下！');
			return;
		}
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		util.showLoading();
		let params = this.data.voucherMsg;
		util.getDataFromServer('consumer/voucher/buy-records-by-shop-qr-code', params, () => {
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
						if (res.errMsg === 'requestPayment:ok') {
							// 成功弹窗
							this.succeedPop();
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
				this.setData({isRequest: false});
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
			this.setData({isRequest: false});
		});
	},
	goHome () {
		wx.reLaunch({
			url: '/pages/Home/Home'
		});
	},
	// 关闭验规则弹窗
	rulesWinHide () {
		this.setData({
			showDetailWrapper: false
		});
		setTimeout(() => {
			this.setData({
				showDetailMask: false
			});
		}, 400);
	},
	directionsClick (e) {
		console.log(e);
		this.setData({
			alertMask: true,
			alertWrapper: true
		});
	},
	freeProcessing (e) {
		util.go('/pages/default/receiving_address/receiving_address');
	}
});
