const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		loginInfo: undefined,
		encryptCode: undefined,// 券加密数据
		alertMask: false, // 控制活动细则弹窗
		alertWrapper: false, // 控制活动细则弹窗
		showMobileMask: false, // 绑定手机号相关
		showMobileWrapper: false // 绑定手机号相关
	},
	onLoad (options) {
		util.resetData();// 重置数据
		if (options.encrypt_code) {
			this.setData({
				encryptCode: decodeURIComponent(options.encrypt_code)
			});
		}
		wx.hideHomeButton();
		app.globalData.orderInfo.orderId = '';
		app.globalData.isHighSpeedTrafficActivity = true;
		// 高速通行(MTC)服务商
		app.globalData.otherPlatformsServiceProvidersId = '593006893660635136';
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
	// 获取套餐
	goDeliveryAddress () {
		util.showLoading();
		let params = {
			serviceType: 'mtcCoupon',
			encryptCode: this.data.encryptCode,
			mobilePhone: app.globalData.mobilePhone
		};
		util.getDataFromServer('consumer/voucher/service-type-analysis', params, () => {
			util.showToastNoIcon('提交卡券信息失败！');
		}, (res) => {
			if (res.code === 0) {
				util.go('/pages/default/receiving_address/receiving_address');
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 获取手机号
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
				title: '绑定中...'
			});
			util.getDataFromServer('consumer/member/common/applet/bindingPhone', {
				sourceType: 14,// 用户来源类型 5-面对面引流 7-微信引流  14高速通行活动
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
					this.goDeliveryAddress();
				} else {
					util.hideLoading();
					util.showToastNoIcon(res.message);
				}
			});
		}
	}
});
