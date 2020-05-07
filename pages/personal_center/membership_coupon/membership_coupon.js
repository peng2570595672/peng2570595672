const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		showAddCoupon: false,// 控制显示兑换码弹窗
		showActivateCoupon: false,// 控制显示激活卡券弹窗
		verificationCode: '',// 短信验证码
		showSuccessful: false,// 控制显示兑换码弹窗
		checkEffective: ['usable', 'used', 'notUsable'],// 查看有效&无效电子券
		listHeight: '',// 卡券列表高度
		windowHeight: '',// 屏幕高度
		exchangeCode: '',// 兑换码
		exchangeData: '',// 兑换数据
		time: 59,// 倒计时
		identifyingCode: undefined,// 获取验证码文字
		recordsId: '',// 卡券id
		isCountDowning: false, // 是否处于倒计时中
		currentTab: 0,
		mobilePhone: undefined,
		cardVoucherStatus: [
			{name: '可使用'},
			{name: '可使用'},
			{name: '已使用'},
			{name: '已过期'}
		],
		list: [
			{}
		]
	},
	onLoad () {
	},
	onShow () {
		if (app.globalData.userInfo.accessToken) {
			this.getCardVoucherList();
		} else {
			// 公众号进入需要登录
			this.login();
		}
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
							this.setData({
								mobilePhone: res.data.mobilePhone
							});
							this.getCardVoucherList();
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
	// 获取卡券列表
	getCardVoucherList (key) {
		util.showLoading();
		let params = {
			status: key
		};
		util.getDataFromServer('consumer/voucher/get-coupon-page-list', params, () => {
			util.showToastNoIcon('获取卡券列表失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					list: res.data.list
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 照相机扫码识别兑换码
	getExchangeCodeFromScan () {
		// 只允许从相机扫码
		wx.scanCode({
			onlyFromCamera: true,
			success: (res) => {
				this.setData({
					exchangeCode: res.result
				});
			},
			fail: (res) => {
				if (res.errMsg !== 'scanCode:fail cancel') {
					util.showToastNoIcon('扫码失败');
				}
			}
		});
	},
	// 输入兑换码
	exchangeCodeValueChange (e) {
		this.setData({
			exchangeCode: e.detail.value.trim()
		});
	},
	// 立即兑换
	exchange () {
		if (!this.data.exchangeCode) {
			util.showToastNoIcon('请输入兑换码！');
			return;
		}
		util.showLoading();
		let exchangeCode = this.data.exchangeCode;
		exchangeCode = exchangeCode.toUpperCase();
		let params = {
			mobilePhone: app.globalData.userInfo.mobilePhone,
			activateCode: exchangeCode
		};
		util.getDataFromServer('consumer/voucher/activate-coupon', params, () => {
			util.showToastNoIcon('获取兑换码失败！');
		}, (res) => {
			if (res.code === 0) {
				this.getCardVoucherList(this.data.checkEffective[this.data.currentTab]);
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 去使用
	goComboList (e) {
		let index = e.currentTarget.dataset['index'];
		index = parseInt(index);
		app.globalData.orderInfo.orderId = '';
		util.go('/pages/default/receiving_address/receiving_address');
	}
});
