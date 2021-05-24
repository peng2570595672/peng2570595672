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
		mask: false,
		wrapper: false,
		banks: ['icbc','abchina','boc','ccb','bankcomm','psbc'],
		bankNameIndex: null, // 开户行：1-工行，2-农行，3-中行，4建行，5-交行，6-邮储 (接口上传：bankNameIndex+1)
		bankNameArr: ['工商银行', '农业银行', '中国银行', '建设银行', '交通银行', '邮政储蓄'],
		mobilePhoneIsOk: false,
		identifyingCode: '获取验证码',
		time: 59,// 倒计时
		isGetIdentifyingCoding: false, // 获取验证码中
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		showToast: false, // 是否验证码错误
		bankCardObj: null,
		bankAccountId: null,
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
				bankCardObj: bankCardIdentifyResult.data[0],
				[`formData.bankCardNo`]: bankCardIdentifyResult.data[0].ocrObject.cardNo
			});
			this.setData({
				available: this.validateAvailable()
			});
			wx.removeStorageSync('bank_card_identify_result');
		}
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
	onClickChooseBankCard () {
		util.go(`/pages/default/shot_bank_card/shot_bank_card?type=0`);
	},
	bindBankNameChange (e) {
		this.setData({
			bankNameIndex: parseInt(e.detail.value)
		});
		this.setData({
			available: this.validateAvailable()
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
		const params = {
			bankAccountNo: this.data.formData.bankCardNo,
			bankName: this.data.bankNameArr[this.data.bankNameIndex],
			mobilePhone: this.data.formData.telNumber,
			cardType: this.data.bankCardObj?.cardType === '贷记卡' ? 2 : 1,
			bankCardUrl: this.data.bankCardObj?.fileUrl || '',
			sortName: this.data.banks[this.data.bankNameIndex]
		};
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/bindingAccount', params);
		this.setData({
			available: true,
			isRequest: false
		});
		if (!result) return;
		console.log(result);
		if (result.code === 0) {
			this.setData({
				bankAccountId: result.data.bankAccountId
			});
			this.show();
			this.startTimer();
		} else {
			util.showToastNoIcon(result.message);
		}
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
		return true;
	},
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
			bankType: 2,// 1开户 2绑卡
			bankAccountId: this.data.bankAccountId,
			smsCode: this.data.formData.verifyCode
		};
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/verifyCode', params);
		this.setData({
			available: true,
			isRequest: false
		});
		if (!result) return;
		console.log(result);
		if (result.code) {
			util.showToastNoIcon(result.message);
		} else {
			wx.navigateBack({
				delta: 1
			});
		}
	}
});
