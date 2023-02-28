const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		fissShareId: '', // 分享者memberId
		nickName: '', // 当前用户的昵称，
		avatarUrl: '', // 当前用户的头像
		originNickName: '', // 原点用户的昵称，
		originAvatarUrl: '', // 原点用户的头像
		handleInfo: {}, // 用户状态：
		showMobileMask: false, // 绑定手机号相关
		showMobileWrapper: false ,// 绑定手机号相关
		alertMask: false, // 控制活动细则弹窗
		alertWrapper: false, // 控制活动细则弹窗
		isRequest: false
	},
	onLoad (options) {
		util.resetData();// 重置数据
		if (options.shopId) {
			app.globalData.crowdsourcingServiceProvidersId = options.shopId;
			app.globalData.crowdsourcingPromotionId = options.memberId;
		}
		this.login();
	},
	onShow (option) {
	},
	// 提示绑定手机号
	showBindMobile () {
		this.setData({
			showMobileMask: true,
			showMobileWrapper: true
		});
	},
	getUserInfo (e) {
		let type = e.currentTarget.dataset.type;
		if (type === 'image') {
			wx.uma.trackEvent('fission_user_tap_photo');
		} else {
			wx.uma.trackEvent('fission_user_immediately_receive');
		}
		util.showLoading();
		let that2 = this; // 解决作用域问题
		wx.getSetting({
			success (res) {
				if (!res.authSetting['scope.userInfo']) {
					wx.authorize({
						scope: 'scope.userInfo',
						success () {
						}
					});
				} else {
					wx.getUserInfo({
						success: res => {
							app.globalData.crowdsourcingUserInfo = res.userInfo;
							console.log(res);
							that2.setNAData();
						}
					});
				}
				util.hideLoading();
			}
		});
	},
	setNAData () { // 设置昵称头像
		this.setData({
			nickName: app.globalData.crowdsourcingUserInfo ? app.globalData.crowdsourcingUserInfo.nickName : '',
			avatarUrl: app.globalData.crowdsourcingUserInfo ? app.globalData.crowdsourcingUserInfo.avatarUrl : 'https://file.cyzl.com/g001/M00/00/68/CgAAD1zt9pyALrxkAAAPcVFYqis569.png'
		});
		this.uploadInfo();
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
	// 从我们服务器获取openid等信息
	login () {
		// 登录
		wx.login({
			success: (r) => {
				util.getDataFromServer('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: r.code // 从微信获取的code
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
							this.getMemberCrowdSourcing();
							this.getMemberCrowdSourcingAndOrder();
							util.hideLoading();
						} else {
							util.hideLoading();
						}
					} else {
						util.hideLoading();
						util.showToastNoIcon(res.message);
					}
				});
			}
		});
	},
	// 获取小程序码内容
	getMemberCrowdSourcing () {
		if (!app.globalData.crowdsourcingShopMsg) return;// 非小程序码扫码进入
		util.showLoading();
		let params = {
			MCS: app.globalData.crowdsourcingShopMsg
		};
		util.getDataFromServer('consumer/member/selectMemberCrowdSourcing', params, () => {
			util.showToastNoIcon('获取推广信息失败！');
		}, (res) => {
			if (res.code === 0) {
				app.globalData.crowdsourcingServiceProvidersId = res.data.shopId;
				app.globalData.crowdsourcingPromotionId = res.data.memberId;
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 众包-获取用户推广码和订单红包数量
	getMemberCrowdSourcingAndOrder () {
		util.showLoading();
		util.getDataFromServer('consumer/member/getMemberCrowdSourcingAndOrder', {}, () => {
			util.showToastNoIcon('获取用户推广信息失败！');
		}, (res) => {
			if (res.code === 0) {
				// status - 0 未成为推广者，1-已经是推广者，8-活动已经结束
				if (res.data.status === 8) {
					this.activityCancel();
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 绑定手机号
	getPhoneNumber (e) {
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
					loginInfo.needBindingPhone = 0;
					this.setData({
						loginInfo
					});
					this.getMemberCrowdSourcing();
					this.getMemberCrowdSourcingAndOrder();
				} else {
					util.hideLoading();
					util.showToastNoIcon(res.message);
				}
			});
		}
	},
	// 更新头像用户昵称
	uploadInfo () {
		if (app.globalData.crowdsourcingUserInfo.nickName) {
			util.showLoading();
			let params = {
				nickName: app.globalData.crowdsourcingUserInfo.nickName,
				sex: app.globalData.crowdsourcingUserInfo.gender,
				province: app.globalData.crowdsourcingUserInfo.province,
				city: app.globalData.crowdsourcingUserInfo.city
			};
			util.getDataFromServer('consumer/member/updateInfo', params, () => {
				util.showToastNoIcon('提交用户信息失败！');
			}, (res) => {
				if (res.code === 0) {
					app.globalData.isCrowdsourcingPromote = true;
					util.go('/pages/default/receiving_address/receiving_address');
				} else {
					util.showToastNoIcon(res.message);
				}
			}, app.globalData.userInfo.accessToken, () => {
				util.hideLoading();
			});
		}
	},
	doNot () {
	},
	getMoreMoney () {
		wx.uma.trackEvent('fission_user_make_profit');
		util.go('/pages/crowdsourcing/index/index');
	},
	// 活动过期
	activityCancel () {
		util.alert({
			title: '提示',
			content: '本次活动已结束。',
			confirmText: '我知道了',
			confirm: () => {
				wx.switchTab({
					url: '/pages/Home/Home'
				});
			}
		});
	}
});
