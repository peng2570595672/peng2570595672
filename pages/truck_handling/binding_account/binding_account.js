/**
 * @author 狂奔的蜗牛
 * @desc 填写车牌和收货信息
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
// 倒计时计时器
let timer;
Page({
	data: {
		banks: ['icbc','abchina','boc','ccb','bankcomm','psbc'],
		bankNameIndex: null, // 开户行：1-工行，2-农行，3-中行，4建行，5-交行，6-邮储 (接口上传：bankNameIndex+1)
		bankNameArr: ['工商银行', '农业银行', '中国银行', '建设银行', '交通银行', '邮政储蓄'],
		mobilePhoneIsOk: false,
		identifyingCode: '获取验证码',
		time: 59,// 倒计时
		isGetIdentifyingCoding: false, // 获取验证码中
		getAgreement: false, // 是否接受协议
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		showToast: false, // 是否验证码错误
		formData: {
			bankCardNo: undefined,
			telNumber: '', // 电话号码
			verifyCode: '' // 验证码
		} // 提交数据
	},
	onShow () {
		// 银行卡
		let bankCardIdentifyResult = wx.getStorageSync('bank_card_identify_result');
		if (bankCardIdentifyResult) {
			bankCardIdentifyResult = JSON.parse(bankCardIdentifyResult);
			this.setData({
				[`formData.bankCardNo`]: bankCardIdentifyResult.data[0].ocrObject.cardNo
			});
			this.setData({
				available: this.validateAvailable()
			});
			wx.removeStorageSync('bank_card_identify_result');
		}
	},
	onClickChooseBankCard () {
		util.go(`/pages/default/shot_bank_card/shot_bank_card?type=0`);
	},
	bindBankNameChange (e) {
		this.setData({
			bankNameIndex: parseInt(e.detail.value)
		});
	},
	// 下一步
	async next () {
		this.setData({
			available: this.validateAvailable(true)
		});
		if (!this.data.available || this.data.isRequest) {
			return;
		}
		this.setData({
			available: false, // 禁用按钮
			isRequest: true // 设置状态为请求中
		});
		const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
			platformId: app.globalData.platformId, // 平台id
			code: res.code // 从微信获取的code
		});
		this.setData({
			available: true,
			isRequest: false
		});
		if (!result) return;
		console.log(result);
		util.go(`/pages/truck_handling/binding_account_successful/binding_account_successful`);
	},
	// 省市区选择
	onPickerChangedHandle (e) {
		let formData = this.data.formData;
		formData.region = e.detail.value;
		if (e.detail.code && e.detail.code.length === 3) {
			formData.regionCode = e.detail.code;
		}
		this.setData({
			formData
		});
		this.setData({
			available: this.validateAvailable()
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
		const result = await util.getDataFromServersV2('consumer/order/send-receive-phone-verification-code', {
			receivePhone: this.data.formData.telNumber // 手机号
		}, 'GET');
		if (!result) return;
		if (result.code === 0) {
			this.startTimer();
		} else {
			util.showToastNoIcon(result.message);
		}
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
		} else if (key === 'verifyCode' && e.detail.value.length > 4) { // 验证码
			formData[key] = e.detail.value.substring(0, 4);
		} else {
			formData[key] = e.detail.value;
		}
		this.setData({
			formData
		});
		this.setData({
			available: this.validateAvailable()
		});
		if (e.detail.value.length === 4 && key === 'verifyCode') {
			wx.hideKeyboard({
				complete: res => {
					console.log('hideKeyboard res', res);
				}
			});
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
		if (!this.data.formData.bankCardNo || this.data.bankNameIndex === null) {
			if (isToast) util.showToastNoIcon('请完善绑定银行信息！');
			return false;
		}
		if (!this.data.formData.telNumber) {
			if (isToast) util.showToastNoIcon('请输入银行预留手机号！');
			return false;
		}
		if (!/^1[0-9]{10}$/.test(this.data.formData.telNumber)) {
			if (isToast) util.showToastNoIcon('手机号输入不合法！');
			return false;
		}
		if (!this.data.formData.verifyCode) {
			if (isToast) util.showToastNoIcon('请获取并输入短信验证码！');
			return false;
		}
		if (this.data.formData.verifyCode.length < 4) {
			if (isToast) util.showToastNoIcon('请输入正确的验证码！');
			return false;
		}
		if (!this.data.getAgreement) {
			if (isToast) util.showToastNoIcon('请输入正确的验证码！');
			return false;
		}
		return true;
	},
	// 查看办理协议
	onClickGoAgreementHandle () {
		util.go('/pages/truck_handling/icbc_agreement/icbc_agreement');
	}
});
