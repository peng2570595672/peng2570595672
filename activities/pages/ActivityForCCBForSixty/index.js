const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		loginInfo: undefined,
		alertMask: false, // 控制活动细则弹窗
		alertWrapper: false, // 控制活动细则弹窗
		showMobileMask: false, // 绑定手机号相关
		showMobileWrapper: false // 绑定手机号相关
	},
	onLoad () {
		this.login();
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
				} else {
					util.hideLoading();
					util.showToastNoIcon(res.message);
				}
			});
		}
	},
	freeProcessing (e) {
		app.globalData.isFaceToFaceCCB = true;
		// 面对面服务商
		app.globalData.otherPlatformsServiceProvidersId = '642089383318519808';
		app.globalData.faceToFacePromotionId = '602020013';
		util.go('/pages/default/receiving_address/receiving_address');
	}
});
