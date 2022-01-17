/**
 * @author 老刘
 * @desc 开通II类户
 */
import { professionInfo } from './professionInfo';
const util = require('../../../utils/util.js');
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
		getAgreement: false, // 是否接受协议
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		showToast: false, // 是否验证码错误
		professionInfo: [],
		professionArr: [],
		professionIndex: [-1, -1], // 职业
		bankCardObj: null,
		bankAccountId: null,
		formData: {
			region: ['省', '市', '区'], // 省市区
			bankCardNo: '',
			telNumber: '', // 电话号码
			verifyCode: '' // 验证码
		} // 提交数据
	},
	async onLoad () {
		this.setData({
			professionInfo: professionInfo,
			professionArr: [professionInfo, professionInfo[0].children]
		});
		// 查询是否欠款
		await util.getIsArrearage();
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
	onChangedHandle (e) {
		console.log(e);
		console.log(this.data.professionArr);
		const arr = e.detail.value;
		if (arr[1] === -1 && this.data.professionArr[1].length) {
			return;
		}
		this.setData({
			professionIndex: arr
		});
	},
	bindProfessionChange (e) {
		let professionIndex = this.data.professionIndex;
		professionIndex[e.detail.column] = e.detail.value;
		if (e.detail.column === 0) {
			this.data.professionArr[1] = this.data.professionInfo[e.detail.value].children;
		}
		this.setData({
			professionArr: this.data.professionArr,
			professionIndex
		});
		this.setData({
			available: this.validateAvailable()
		});
	},
	// 省市区选择
	onPickerChangedHandle (e) {
		let formData = this.data.formData;
		formData.region = e.detail.value;
		this.setData({
			formData
		});
		// 校验数据
		this.setData({
			available: this.validateAvailable()
		});
	},
	// 选择当前地址
	onClickChooseLocationHandle () {
		wx.chooseLocation({
			success: (res) => {
				let address = res.address;
				if (address) {
					// 根据地理位置信息获取经纬度
					util.getInfoByAddress(address, (res) => {
						let result = res.result;
						if (result) {
							let location = result.location;
							// 根据经纬度信息 反查详细地址信息
							this.getAddressInfo(location, address);
						}
					}, () => {
						util.showToastNoIcon('获取地理位置信息失败！');
					});
				}
				console.log(res);
			},
			fail: (e) => {
				// 选择地址未允许授权
				if (e.errMsg === 'chooseLocation:fail auth deny' || e.errMsg === 'getLocation:fail authorize no response') {
					util.alert({
						title: '提示',
						content: '由于您拒绝了获取您的地理位置授权，导致无法正常获取地理位置信息，是否重新授权？',
						showCancel: true,
						confirmText: '重新授权',
						confirm: () => {
							wx.openSetting();
						}
					});
				} else if (e.errMsg !== 'chooseLocation:fail cancel') {
					util.showToastNoIcon('获取地理位置信息失败！');
				}
			}
		});
	},
	//  根据经纬度信息查地址
	getAddressInfo (location) {
		util.getAddressInfo(location.lat, location.lng, (res) => {
			if (res.result) {
				let info = res.result.ad_info;
				let formData = this.data.formData;
				formData.region = [info.province, info.city, info.district]; // 省市区
				this.setData({
					formData
				});
				// 校验数据
				this.setData({
					available: this.validateAvailable()
				});
			} else {
				util.showToastNoIcon('获取地理位置信息失败！');
			}
		}, () => {
			util.showToastNoIcon('获取地理位置信息失败！');
		});
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
		wx.uma.trackEvent('truck_binding_account_to_open_account');
		const workInfo = this.data.professionArr[0][this.data.professionIndex[0]];
		const workInfo1 = this.data.professionArr[1][this.data.professionIndex[1]];
		const workName = `${workInfo.name}${workInfo1?.name ? '-' + workInfo1?.name : ''}`;
		const params = {
			orderId: app.globalData.orderInfo.orderId,
			mobileCode: this.data.formData.verifyCode,
			areaName: this.data.formData.region[0],
			cityName: this.data.formData.region[1],
			district: this.data.formData.region[2],
			workCode: workInfo1?.code || workInfo.code,
			workName: workName,
			bankAccountNo: this.data.formData.bankCardNo,
			bankName: this.data.bankNameArr[this.data.bankNameIndex],
			mobilePhone: this.data.formData.telNumber,
			cardType: this.data.bankCardObj?.cardType === '贷记卡' ? 2 : 1,
			bankCardUrl: this.data.bankCardObj?.fileUrl || ''
		};
		const result = await util.getDataFromServersV2('consumer/member/bcm/openCardV2', params);
		console.log(result,'==================开通信息===================');
		this.setData({
			available: true,
			isRequest: false
		});
		if (!result) return;
		console.log(result);
		if (result.code === 0) {
			util.go(`/pages/truck_handling/binding_account_successful/binding_account_successful?accountNo=${result.data.accountNo}&flowVersion=7`);
		} else {
			util.showToastNoIcon(result.message);
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
		const result = await util.getDataFromServersV2('consumer/member/bcm/openCardSendCode', {
			orderId: app.globalData.orderInfo.orderId,
			mobilePhone: this.data.formData.telNumber
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
		if (this.data.professionIndex[0] === -1 || (this.data.professionIndex[1] === -1 && this.data.professionArr[1].length)) {
			if (isToast) util.showToastNoIcon('请选择个人职业！');
			return false;
		}
		if (this.data.formData.region[0] === '省') {
			if (isToast) util.showToastNoIcon('请选择省市区！');
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
			if (isToast) util.showToastNoIcon('请输入验证码！');
			return false;
		}
		if (!this.data.getAgreement) {
			if (isToast) util.showToastNoIcon('请阅读工商银行II类账户开户协议！');
			return false;
		}
		return true;
	},
	onManagementProtocol () {
		util.go('/pages/truck_handling/bocom_management_protocol/bocom_management_protocol');
	},
	onCollectingProtocol () {
		util.go('/pages/truck_handling/bocom_deduction_collection_protocol/bocom_deduction_collection_protocol');
	},
	onClauseProtocol () {
		util.go('/pages/truck_handling/bocom_clause_protocol/bocom_clause_protocol');
	},
	onTallageProtocol () {
		util.go('/pages/truck_handling/bocom_tallage_protocol/bocom_tallage_protocol');
	}
});
