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
		identifyingCode: '获取验证码',
		time: 59,// 倒计时
		isGetIdentifyingCoding: false, // 获取验证码中
		getAgreement: false, // 是否接受协议
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		showToast: false, // 是否验证码错误
		isOnlineDealWith: true, // 是否是线上办理
		formData: {
			currentCarNoColor: 0, // 0 蓝色 1 渐变绿 2黄色
			region: ['省', '市', '区'], // 省市区
			regionCode: [], // 省份编码
			userName: '', // 收货人姓名
			telNumber: '', // 电话号码
			detailInfo: '', // 收货地址详细信息
			verifyCode: '' // 验证码
		} // 提交数据
	},
	onShow () {
	},
	// 下一步
	next () {
		this.setData({
			available: this.validateAvailable(true)
		});
		if (!this.data.available || this.data.isRequest) {
			return;
		}
		if (!this.data.getAgreement) {
			util.showToastNoIcon('请同意并勾选协议！');
			return;
		}
		this.setData({
			available: false, // 禁用按钮
			isRequest: true // 设置状态为请求中
		});
		mta.Event.stat('truck_for_receiving_address_next',{});
		let formData = this.data.formData; // 输入信息
		let params = {
			isNewTrucks: 1, // 货车
			orderId: app.globalData.orderInfo.orderId, // 订单id
			orderType: this.data.isOnlineDealWith ? 11 : 12,
			dataType: '12', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:获取实名信息，5:获取银行卡信息
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			vehPlates: this.data.carNoStr, // 车牌号
			// vehColor: formData.currentCarNoColor === 1 ? 4 : formData.currentCarNoColor === 2 ? 1 : 0, // 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】
			vehColor: formData.currentCarNoColor, // 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】
			receiveMan: formData.userName, // 收货人姓名 【dataType包含2】
			receivePhone: formData.telNumber, // 收货人手机号 【dataType包含2】
			receiveProvince: formData.region[0], // 收货人省份 【dataType包含2】
			receiveCity: formData.region[1], // 收货人城市 【dataType包含2】
			receiveCounty: formData.region[2], // 收货人区县 【dataType包含2】
			receiveAddress: formData.detailInfo, // 收货人详细地址 【dataType包含2】
			receivePhoneCode: formData.verifyCode, // 收货人手机号验证码, 手机号没有修改时不需要 【dataType包含2】
			shopId: app.globalData.miniProgramServiceProvidersId
		};
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
		}, (res) => {
			if (res.code === 0) {
				app.globalData.orderInfo.orderId = res.data.orderId; // 订单id
				util.go('/pages/truck_handling/package_the_rights_and_interests/package_the_rights_and_interests');
			} else if (res.code === 301) { // 已存在当前车牌未完成订单
				util.alert({
					content: '该车牌订单已存在，请前往“首页>我的ETC”页面查看。',
					showCancel: true,
					confirmText: '去查看',
					confirm: () => {
						// 订单id
						app.globalData.orderInfo.orderId = ''; // 订单id
						util.go(`/pages/personal_center/my_etc/my_etc`);
					},
					cancel: () => {
						app.globalData.orderInfo.orderId = '';
					}
				});
			} else if (res.code === 104 && res.message === '该车牌已存在订单') {
				util.go(`/pages/default/high_speed_verification_failed/high_speed_verification_failed?carNo=${this.data.carNoStr}`);
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			this.setData({
				available: true,
				isRequest: false
			});
		});
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
	sendVerifyCode () {
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
		util.getDataFromServer('consumer/order/send-receive-phone-verification-code', {
			receivePhone: this.data.formData.telNumber // 手机号
		}, () => {
			util.hideLoading();
		}, (res) => {
			if (res.code === 0) {
				this.startTimer();
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		}, 'GET');
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
	validateAvailable (checkLicensePlate) {
		// 是否接受协议
		let isOk = true;
		let formData = this.data.formData;
		// 校验姓名
		isOk = isOk && formData.userName && formData.userName.length >= 1;
		// 校验省市区
		isOk = isOk && formData.region && formData.region.length === 3 && formData.region[0] !== '省';
		// 校验省市区编码
		isOk = isOk && formData.regionCode && formData.region.length === 3;
		// 校验详细地址
		isOk = isOk && formData.detailInfo && formData.detailInfo.length >= 2;
		// 检验手机号码
		isOk = isOk && formData.telNumber && /^1[0-9]{10}$/.test(formData.telNumber);
		// 校验验证码
		isOk = isOk && formData.verifyCode && /^[0-9]{4}$/.test(formData.verifyCode);
		return isOk;
	},
	// 点击添加新能源
	onClickNewPowerCarHandle (e) {
		this.setData({
			isNewPowerCar: true,
			currentCarNoColor: 4
		});
		this.setCurrentCarNo(e);
	},
	// 查看办理协议
	onClickGoAgreementHandle () {
		util.go('/pages/default/agreement/agreement');
	}
});
