const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		loginInfo: undefined,
		configId: undefined,
		configInfo: undefined,
		couponsInfo: undefined,
		alertMask: false, // 控制活动细则弹窗
		alertWrapper: false, // 控制活动细则弹窗
		showMobileMask: false, // 绑定手机号相关
		showMobileWrapper: false, // 绑定手机号相关
		returnInfo: undefined // 返回APP参数
	},
	onLoad (options) {
		console.log(options);
		if (options.configId) {
			this.setData({
				configId: options.configId
				// parameter: JSON.stringify(options)
			});
		}
		wx.hideHomeButton();
		// this.getActivityInformation();
		this.login();
	},
	launchAppError (e) {
		console.log(e.detail.errMsg);
		if (e.detail.errMsg === 'invalid scene') {
			util.showToastNoIcon('调用场景不正确！');
		}
	},
	// 打开规则弹窗
	rulesWinShow () {
		this.setData({
			alertMask: true,
			alertWrapper: true
		});
	},
	// 关闭验规则弹窗
	rulesWinHide () {
		this.setData({
			alertWrapper: false
		});
		setTimeout(() => {
			this.setData({
				alertMask: false
			});
		}, 400);
	},
	// 提示绑定手机号
	showBindMobile () {
		this.setData({
			showMobileMask: true,
			showMobileWrapper: true
		});
	},
	// 隐藏提示绑定手机号
	hideBindMobile () {
		this.setData({
			showMobileWrapper: false
		});
		setTimeout(() => {
			this.setData({
				showMobileMask: false
			});
		}, 400);
	},
	// 获取券信息
	getActivityInformation (e) {
		// 获取券信息
		util.getDataFromServer('consumer/voucher/common/get-config-info-by-config-id', {
			configId: this.data.configId// 卡券批次id
		}, () => {
			util.hideLoading();
			util.showToastNoIcon('获取卡券信息失败！');
		}, (res) => {
			// 绑定手机号成功
			if (res.code === 0) {
				this.setData({
					configInfo: res.data
				});
			} else {
				util.hideLoading();
				util.showToastNoIcon(res.message);
			}
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
					this.receive();
				} else {
					util.hideLoading();
					util.showToastNoIcon(res.message);
				}
			});
		}
	},
	receive (e) {
		util.getDataFromServer('consumer/voucher/common/get-records-by-config-or-product', {
			couponSole: true,// false 不限张数  true  限一张
			newGetCoupon: true,// false 领取后单独激活  true  领取并激活
			needActivate: true,// false 获取当前批次已领取的所有卡券  true  获取新的卡券
			configId: this.data.configId,
			platformId: app.globalData.platformId,
			openId: app.globalData.openId
		}, () => {
			util.hideLoading();
			util.showToastNoIcon('获取卡券信息失败！');
		}, (res) => {
			// 绑定手机号成功
			if (res.code === 0) {
				let returnInfo = {
					wxCouponId: res.data[0].wxCouponId,
					id: res.data[0].id
				};
				this.setData({
					couponsInfo: res.data[0],
					returnInfo: JSON.stringify(returnInfo)
				});
				console.log(res.data);
				this.rulesWinShow();
			} else {
				util.hideLoading();
				util.showToastNoIcon(res.message);
			}
		});
	}
});
