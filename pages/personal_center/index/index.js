const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		isAttention: 0, // 关注状态 1-已关注，0-未关注
		height: undefined, // 屏幕高度
		userInfo: undefined, // 用户信息
		showDetailWrapper: false,
		mobilePhoneSystem: false,
		mobilePhone: undefined,
		showDetailMask: false
	},
	onLoad () {
	},
	onShow () {
		if (app.globalData.userInfo.accessToken) {
			this.getMemberBenefits();
		} else {
			// 公众号进入需要登录
			this.login();
		}
		this.setData({
			mobilePhoneSystem: app.globalData.mobilePhoneSystem,
			mobilePhone: app.globalData.mobilePhone,
			screenHeight: wx.getSystemInfoSync().windowHeight
		});
		let that = this;
		wx.getSetting({
			success (res) {
				if (res.authSetting['scope.userInfo']) {
					// 已经授权，可以直接调用 getUserInfo 获取头像昵称
					wx.getUserInfo({
						success: function (res) {
							that.setData({
								userInfo: res.userInfo
							});
							that.submitUserInfo(res);
						}
					});
				}
			}
		});
	},
	// 自动登录
	login (isData) {
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
							this.setData({
								mobilePhone: res.data.mobilePhone
							});
							this.getMemberBenefits();
							if (isData) {
								this.submitUserInfo(isData);
							}
						} else {
							wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
							util.go('/pages/login/login/login');
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
	submitUserInfo (user) {
		util.showLoading();
		let params = {
			encryptedData: user.encryptedData,
			iv: user.iv
		};
		util.getDataFromServer('consumer/member/applet/update-user-info', params, () => {
			util.showToastNoIcon('提交用户信息失败！');
		}, (res) => {
			if (res.code === 0) {
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 获取会员信息
	getMemberBenefits () {
		util.showLoading();
		util.getDataFromServer('consumer/member/member-status', {}, () => {
			util.showToastNoIcon('获取会员信息失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					isAttention: res.data.attentionStatus
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	bindGetUserInfo (e) {
		this.setData({
			userInfo: e.detail.userInfo
		});
		if (e.detail.userInfo) {
			this.submitUserInfo(e.detail);
		}
	},
	// 跳转
	go (e) {
		let url = e.currentTarget.dataset['url'];
		if (url === 'owner_service') {
			mta.Event.stat('personal_center_owner_service',{});
		} else if (url === 'my_etc') {
			mta.Event.stat('personal_center_my_etc',{});
		} else if (url === 'my_order') {
			mta.Event.stat('personal_center_my_order',{});
		} else if (url === 'service_card_voucher') {
			mta.Event.stat('personal_center_service_card_voucher',{});
		} else if (url === 'help_center') {
			mta.Event.stat('personal_center_help_center',{});
		}
		util.go(`/pages/personal_center/${url}/${url}`);
	},
	// 扫码
	scan () {
		util.showLoading({title: '正在识别'});
		// 统计点击事件
		mta.Event.stat('023',{});
		// 只允许从相机扫码
		wx.scanCode({
			onlyFromCamera: true,
			success: (res) => {
				let key = res.result.match(/(\S*)=/);
				let val = res.result.match(/=(\S*)/);
				if (key && val && key[1] && val[1].length === 18 && key[1] === 'orderId') {
					util.getDataFromServer('consumer/member/bind-order', {
						orderId: val[1]
					}, () => {
						util.hideLoading();
					}, (res) => {
						util.hideLoading();
						if (res.code === 0) {
							app.globalData.orderInfo.orderId = val[1];
							util.go('/pages/personal_center/my_etc_detail/my_etc_detail');
						} else {
							util.showToastNoIcon(res.message);
						}
					}, app.globalData.userInfo.accessToken);
				} else {
					util.hideLoading();
					util.showToastNoIcon('不支持的数据格式');
				}
			},
			fail: (res) => {
				util.showToastNoIcon('扫码失败');
			}
		});
	},
	// 显示详情
	showDetail (e) {
		this.setData({
			showDetailWrapper: true,
			showDetailMask: true
		});
	},
	// 监听返回按钮
	onClickBackHandle () {
		wx.navigateBack({
			delta: 1
		});
	},
	// 统计点击去关注公众号按钮
	goPublicAccount () {
		mta.Event.stat('037',{});
	},
	// 关闭详情
	close () {},
	hide () {
		this.setData({
			showDetailWrapper: false
		});
		setTimeout(() => {
			this.setData({
				showDetailMask: false
			});
		}, 400);
	}
});
