/**
 * @author 老刘
 * @desc 开通II类户
 */
const util = require('../../../utils/util.js');
const app = getApp();
// 倒计时计时器
let timer;
Page({
	data: {
		mask: false,
		wrapper: false,
		mobilePhoneIsOk: false,
		identifyingCode: '获取验证码',
		time: 59,// 倒计时
		isGetIdentifyingCoding: false, // 获取验证码中
		getAgreement: false, // 是否接受协议
		available: true, // 按钮是否可点击
		isRequest: false,// 是否请求中
		showToast: false, // 是否验证码错误
		formData: {
			bankCardNo: '',
			telNumber: '', // 电话号码
			verifyCode: '' // 验证码
		} // 提交数据
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
		}, 400);
  },
	// 输入框输入值
	onInputChangedHandle (e) {
		let key = e.currentTarget.dataset.key;
		let formData = this.data.formData;
		// 手机号
		if (key === 'telNumber') {
			this.setData({
				mobilePhoneIsOk: /^1[0-9]{10}$/.test(e.detail.value.substring(0, 11))
			});
		}
		if (key === 'telNumber' && e.detail.value.length > 11) {
			formData[key] = e.detail.value.substring(0, 11);
		} else if (key === 'verifyCode' && e.detail.value.length > 6) { // 验证码
			formData[key] = e.detail.value.substring(0, 6);
		} else {
			formData[key] = e.detail.value;
		}
		this.setData({
			formData
		});
		this.setData({
			available: this.validateAvailable()
		});
		if (e.detail.value.length === 6 && key === 'verifyCode') {
			wx.hideKeyboard({
				complete: res => {
					console.log('hideKeyboard res', res);
				}
			});
		}
	},
	// 下一步
	async next () {
    this.show();
	},
	/** 开通* */
	async onClickOpenTheCard () {
		if (!this.data.formData.verifyCode) {
			util.showToastNoIcon('请获取并输入短信验证码！');
			return false;
		}
		if (this.data.formData.verifyCode.length < 4) {
			util.showToastNoIcon('请输入正确的验证码！');
			return false;
		}
		this.setData({
			available: false, // 禁用按钮
			isRequest: true // 设置状态为请求中
		});
		const params = {
			bankType: 1,// 1开户 2绑卡
			bankAccountId: this.data.bankAccountId,
			smsCode: this.data.formData.verifyCode
		};
		const result = await util.getDataFromServersV2('consumer/order/confirmServiceChargeContract', params);
		this.setData({
			available: true,
			isRequest: false
		});
		if (!result) return;
		console.log(result);
		if (result.code) {
			const resultStatusArr = [
				{code: 3403, message: '银行预留手机号不符！'},
				{code: 98000945, message: '验证码错误，请重新输入！'},
				{code: 98000944, message: '短信验证码已失效，请重新发送验证码！'},
				{code: 2210, message: '银行卡号无效，请确认后输入！'},
				{code: 104, message: result.message}
			];
			const findStatus = resultStatusArr.find(item => item.code === result.code);
			if (findStatus) {
				util.showToastNoIcon(findStatus.message);
				return;
			}
			util.go(`/pages/truck_handling/binding_account_failure/binding_account_failure?code=${result.code}`);
		} else {
			util.go(`/pages/truck_handling/binding_account_successful/binding_account_successful`);
		}
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
		console.log(this.data.formData.telNumber,'--------------------');
		// 如果在倒计时，直接不处理
		if (!this.data.formData.telNumber) {
			util.showToastNoIcon('请输入手机号');
			return;
		} else if (!/^1[0-9]{10}$/.test(this.data.formData.telNumber)) {
			util.showToastNoIcon('手机号输入不合法');
			return;
		}
		this.setData({
			isGetIdentifyingCoding: true
		});
		util.showLoading({
			title: '请求中...'
		});
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/sendCode', {
			bankAccountId: this.data.bankAccountId
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
	// 是否接受协议
	onClickAgreementHandle () {
		this.setData({
			getAgreement: !this.data.getAgreement
		});
		this.setData({
			available: this.validateAvailable()
		});
	},
	// 校验字段是否满足
	validateAvailable (isToast) {
		if (!this.data.getAgreement) {
			if (isToast) util.showToastNoIcon('请阅读工商银行II类账户开户协议！');
			return false;
		}
		return true;
	},
	// 查看办理协议
	onClickGoAgreementHandle () {
		util.go('/pages/truck_handling/icbc_agreement/icbc_agreement');
	}
});
