const app = getApp();
let timer;
const util = require('../../utils/util.js');
Component({
	properties: {
		details: {
			type: Object,
			value: {}
		}
	},
	data: {
		mask: false,
		wrapper: false,
		available: false,
		certification: -1, // 是否实名 1实名 0未实名
		identifyingCode: '获取验证码',
		time: 59,// 倒计时
		isGetIdentifyingCoding: false, // 获取验证码中
		verifyCode: '' // 验证码
	},
	methods: {
		close (e) {
			this.hide(e,true);
		},
		show () {
			this.setData({
				mask: true,
				wrapper: true
			});
		},
		hide (e,flag) {
			this.setData({
				wrapper: false
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
				this.triggerEvent('onClickHandle', {});
			}, 400);
		},
		onInputChangedHandle (e) {
			let value = e.detail.value;
			let verifyCode = '';
			if (value.length > 6) { // 验证码
				verifyCode = value.substring(0, 6);
			} else {
				verifyCode = value;
			}
			this.setData({
				verifyCode
			});
			this.setData({
				available: verifyCode && /^[0-9]{6}$/.test(verifyCode)
			});
		},
		// 倒计时
		startTimer () {
			// 设置状态
			this.setData({
				identifyingCode: `${this.data.time}s`
			});
			// 清倒计时
			clearInterval(timer);
			timer = setInterval(() => {
				this.setData({time: --this.data.time});
				if (this.data.time === 0) {
					clearInterval(timer);
					this.setData({
						time: 59,
						isGetIdentifyingCoding: false,
						identifyingCode: '重新获取'
					});
				} else {
					this.setData({
						identifyingCode: `${this.data.time}s`
					});
				}
			}, 1000);
		},
		// 发送短信验证码
		async sendVerifyCode () {
			if (this.data.isGetIdentifyingCoding) return;
			// 如果在倒计时，直接不处理
			if (!this.data.details.cardMobilePhone) {
				util.showToastNoIcon('请输入手机号');
				return;
			} else if (!/^1[0-9]{10}$/.test(this.data.details.cardMobilePhone)) {
				util.showToastNoIcon('手机号输入不合法');
				return;
			}
			this.setData({
				isGetIdentifyingCoding: true
			});
			util.showLoading({
				title: '请求中...'
			});
			const result = await util.getDataFromServersV2('consumer/etc/qtzl/frontSendMsg', {
				mobile: this.data.details.cardMobilePhone, // 手机号
				type: 1 // type 登录类型	1-登录 2-车牌签约绑定 3-售后
			});
			if (!result) return;
			if (result.code === 0) {
				this.startTimer();
			} else {
				this.setData({
					isGetIdentifyingCoding: false
				});
				util.showToastNoIcon(result.message);
			}
		},
		// 验证并 开户
		async goVerify () {
			if (this.data.verifyCode.length !== 6) {
				util.showToastNoIcon('请输入6位数验证码');
				return;
			}
			util.showLoading({
				title: '请求中...'
			});
			const result = await util.getDataFromServersV2('consumer/etc/qtzl/loginSender', {
				mobile: this.data.details.cardMobilePhone, // 手机号
				code: this.data.verifyCode,
				orderId: app.globalData.orderInfo.orderId
			});
			if (!result) return;
			if (result.code === 0) {
				if (this.data.details.needCallback) {
					this.hide();
					return;
				}
				util.go(`/pages/default/choose_bank_and_bind_veh/choose_bank_and_bind_veh`);
			} else if (result.code === 105) {
				this.setData({
					certification: 0
				});
			} else {
				util.showToastNoIcon(result.message);
			}
		}
	},
	// 中国ETC+实名认证
	goCertification () {
		wx.navigateToMiniProgram({
			appId: 'wx22e84d3d44639821',
			path: 'pages/index/index',
			envVersion: 'release', // 目前联调为体验版
			fail () {
				util.showToastNoIcon('调起小程序失败, 请重试！');
			}
		});
	}
});
