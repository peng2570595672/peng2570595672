const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		showActivateCoupon: false,// 控制显示激活卡券弹窗
		verificationCode: '',// 短信验证码
		time: 59,// 倒计时
		identifyingCode: undefined,// 获取验证码文字
		isCountDowning: false, // 是否处于倒计时中
		mobilePhone: undefined,
		isShowSwitchElaborate: false,
		details: {}
	},
	onLoad (options) {
		this.setData({
			details: JSON.parse(options.details),
			mobilePhone: app.globalData.userInfo.mobilePhone
		});
		if (this.data.details.couponUseCheckList && this.data.details.couponUseCheckList.length > 0) {
			this.data.details.couponUseCheckList.map(item => {
				item.startDate = item.startDate.split(' ')[1];
				item.endDate = item.endDate.split(' ')[1];
				switch (item.weekDay) {
					case 1:
						item.weekDay = '周一';
						break;
					case 2:
						item.weekDay = '周二';
						break;
					case 3:
						item.weekDay = '周三';
						break;
					case 4:
						item.weekDay = '周四';
						break;
					case 5:
						item.weekDay = '周五';
						break;
					case 6:
						item.weekDay = '周六';
						break;
					case 7:
						item.weekDay = '周日';
						break;
				}
			});
		}
		this.setData({
			details: this.data.details
		});
		let bgHex;
		if (this.data.details.background.slice(0,1) === '#') {
			// 后台设置默认背景 为十六进制   非默认为rgba
			bgHex = this.data.details.background;
		} else {
			bgHex = this.colorRGB2Hex(this.data.details.background);
		}
		wx.setNavigationBarColor({
			frontColor: '#000000',
			backgroundColor: bgHex
		});
	},
	// rgb转16进制
	colorRGB2Hex (color) {
		let rgb = color.split(',');
		let r = parseInt(rgb[0].split('(')[1]);
		let g = parseInt(rgb[1]);
		let b = parseInt(rgb[2].split(')')[0]);
		let hex = '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
		return hex;
	},
	// 激活卡券弹窗
	activateCoupon () {
		// 如果处于倒计时中，不重新获取
		if (!this.data.isCountDowning) {
			this.clickGetCode();
		} else {
			this.setData({
				showActivateCoupon: true
			});
		}
	},
	clickGetCode () {
		// 如果处于倒计时中，不重新获取
		if (this.data.isCountDowning) {
			util.showToastNoIcon(`请${this.data.time}秒后再试`);
			return;
		}
		util.showLoading();
		let params = {
			mobilePhone: app.globalData.userInfo.mobilePhone,
			recordsId: this.data.details.id
		};
		util.getDataFromServer('consumer/voucher/send-activate-code', params, () => {
			util.showToastNoIcon('发送验证码失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					showActivateCoupon: true
				});
				this.countDown();
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 立即激活
	activateNow () {
		if (!this.data.verificationCode) {
			util.showToastNoIcon('请输入验证码！');
			return;
		}
		util.showLoading();
		let params = {
			mobilePhone: app.globalData.userInfo.mobilePhone,
			code: this.data.verificationCode,
			recordsId: this.data.details.id
		};
		util.getDataFromServer('consumer/voucher/activate-records-by-phone-code', params, () => {
			util.showToastNoIcon('激活失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					details: res.data
				});
				this.close();
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 输入验证码
	exchangeVerificationCodeChange (e) {
		this.setData({
			verificationCode: e.detail.value.trim()
		});
	},
	// 倒计时
	countDown () {
		this.setData({
			isCountDowning: true
		});
		let timer = null;
		if (timer) {
			clearInterval(timer);
		}
		timer = setInterval(() => {
			this.setData({
				time: --this.data.time
			});
			if (this.data.time === 0) {
				clearInterval(timer);
				this.setData({
					time: 59,
					identifyingCode: '重新获取',
					isCountDowning: false
				});
			} else {
				this.setData({
					identifyingCode: `${this.data.time}S`
				});
			}
		}, 1000);
	},
	// 去使用
	goComboList (e) {
		let model = this.data.details;
		console.log(model);
		app.globalData.membershipCoupon = model;
		app.globalData.otherPlatformsServiceProvidersId = model.shopId;
		app.globalData.orderInfo.orderId = '';
		util.go('/pages/default/receiving_address/receiving_address');
	},
	// 关闭弹窗
	close () {
		this.setData({
			showActivateCoupon: false,
			showAddCoupon: false,
			showSuccessful: false
		});
	},
	// 显示使用说明
	switchElaborate () {
		this.setData({
			isShowSwitchElaborate: !this.data.isShowSwitchElaborate
		});
	}
});
