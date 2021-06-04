const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		stepArr: [
			{
				selected: true
			},
			{
				selected: true
			},
			{
				selected: true
			}
		], // 步骤导航
		mobilePhoneIsOk: false,
		getAgreement: true, // 是否接受协议
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		id: '',
		formData: {
			region: ['省', '市', '区'], // 省市区
			regionCode: [], // 省份编码
			userName: '', // 收货人姓名
			telNumber: '', // 电话号码
			detailInfo: '' // 收货地址详细信息
		} // 提交数据
	},
	onLoad (options) {
		if (options.orderInfo) {
			let orderInfo = JSON.parse(options.orderInfo);
			if (orderInfo.dataStatus === 1) {
				let formData = this.data.formData;
				formData.userName = orderInfo.extUsername; // 姓名
				formData.telNumber = orderInfo.extPhone; // 电话
				formData.region = [orderInfo.receiveProvince, orderInfo.receiveCity, orderInfo.receiveCounty]; // 省市区
				formData.regionCode = [orderInfo.receiveProvinceCode, orderInfo.receiveCityCode, orderInfo.receiveCountyCode]; // 省市区
				formData.detailInfo = orderInfo.extArea; // 详细地址
				this.setData({
					formData
				});
			}
			this.setData({
				orderInfo
			});
		}
	},
	// 下一步
	async next () {
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
		wx.uma.trackEvent('IDL_for_express_information_to_next');
		this.setData({
			available: false, // 禁用按钮
			isRequest: true // 设置状态为请求中
		});
		let formData = this.data.formData; // 输入信息
		let params = {
			id: this.data.orderInfo.id,
			extUsername: formData.userName, // 收货人姓名
			extPhone: formData.telNumber, // 收货人手机号
			receiveProvince: formData.region[0], // 收货人省份
			receiveProvinceCode: formData.regionCode[0],
			receiveCity: formData.region[1], // 收货人城市
			receiveCityCode: formData.regionCode[1],
			receiveCounty: formData.region[2], // 收货人区县
			receiveCountyCode: formData.regionCode[2],
			extArea: formData.detailInfo,// 收货人详细地址
			paidAmount: 1200, // 支付金额，单位为分
			dataStatus: this.data.orderInfo.dataStatus, // 资料状态 1-资料已全部完善  2-已完善驾照信息
			payStatus: 0 // 支付状态 0-待支付，1-已支付，2-支付失败, 3 - 退款中，4-已退款，5-退款失败
		};
		const result = await util.getDataFromServersV2('consumer/order/iso_driving/expressInfoSave', params);
		if (!result) return;
		this.setData({
			available: true,
			isRequest: false
		});
		if (result.code === 0) {
			await this.createWxPayOrder();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async createWxPayOrder () {
		if (!this.data.available || this.data.isRequest) {
			return;
		}
		this.setData({
			available: false, // 禁用按钮
			isRequest: true // 设置状态为请求中
		});
		let params = {
			orderId: this.data.orderInfo.id,
			openId: app.globalData.userInfo.openId
		};
		const result = await util.getDataFromServersV2('consumer/order/iso_driving/createWxPayOrder', params);
		if (!result) return;
		this.setData({
			available: true,
			isRequest: false
		});
		if (result.code === 0) {
			let extraData = result.data.extraData;
			wx.requestPayment({
				nonceStr: extraData.nonceStr,
				package: extraData.package,
				paySign: extraData.paySign,
				signType: extraData.signType,
				timeStamp: extraData.timeStamp,
				success: (res) => {
					console.log(res);
					this.setData({isRequest: false});
					if (res.errMsg === 'requestPayment:ok') {
						util.go(`/pages/international_driving_document/transact_success/transact_success`);
					} else {
						util.showToastNoIcon('支付失败！');
					}
				},
				fail: (res) => {
					console.log(res);
					this.setData({isRequest: false});
					if (res.errMsg !== 'requestPayment:fail cancel') {
						util.showToastNoIcon('支付失败！');
					}
				}
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 从微信选择地址
	onClickAutoFillHandle () {
		wx.chooseAddress({
			success: (res) => {
				let formData = this.data.formData;
				formData.userName = res.userName; // 姓名
				formData.telNumber = res.telNumber; // 电话
				formData.region = [res.provinceName, res.cityName, res.countyName]; // 省市区
				formData.detailInfo = res.detailInfo; // 详细地
				this.setData({
					formData,
					mobilePhoneIsOk: /^1[0-9]{10}$/.test(res.telNumber.substring(0, 11))
				});
				this.setData({
					available: this.validateAvailable()
				});
			},
			fail: (e) => {
				if (e.errMsg === 'chooseAddress:fail auth deny' || e.errMsg === 'chooseAddress:fail authorize no response') {
					util.alert({
						title: '提示',
						content: '由于您拒绝了访问您的收货地址授权，导致无法正常获取收货地址信息，是否重新授权？',
						showCancel: true,
						confirmText: '重新授权',
						confirm: () => {
							wx.openSetting();
						}
					});
				} else if (e.errMsg !== 'chooseAddress:fail cancel') {
					util.showToastNoIcon('选择收货地址失败！');
				}
			}
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
	getAddressInfo (location, address) {
		util.getAddressInfo(location.lat, location.lng, (res) => {
			if (res.result) {
				let info = res.result.ad_info;
				let formData = this.data.formData;
				formData.region = [info.province, info.city, info.district]; // 省市区
				formData.regionCode = [`${info.city_code.substring(3).substring(0, 2)}0000`, info.city_code.substring(3), info.adcode]; // 省市区区域编码
				formData.detailInfo = address.replace(info.province + info.city + info.district, ''); // 详细地址
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
		} else {
			formData[key] = e.detail.value;
		}
		this.setData({
			formData
		});
		this.setData({
			available: this.validateAvailable()
		});
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
		// 是否接受协议
		let isOk = true;
		let formData = this.data.formData;
		// 校验姓名
		isOk = isOk && formData.userName && formData.userName.length >= 1 && /[\u4e00-\u9fa5]$/.test(formData.userName);
		if (isToast && !isOk) {
			util.showToastNoIcon('请输入正确的收货人姓名！');
			return false;
		}
		// 校验详细地址
		isOk = isOk && formData.detailInfo && formData.detailInfo.length >= 3;
		if (isToast && !isOk) {
			util.showToastNoIcon('请输入正确的详细地址！');
			return false;
		}
		// 检验手机号码
		isOk = isOk && formData.telNumber && /^1[0-9]{10}$/.test(formData.telNumber);
		if (isToast && !isOk) {
			util.showToastNoIcon('请输入正确的手机号！');
			return false;
		}
		// 校验省市区
		isOk = isOk && formData.region && formData.region.length === 3 && formData.region[0] !== '省';
		// 校验省市区编码
		isOk = isOk && formData.regionCode && formData.region.length === 3;
		return isOk;
	},
	// 查看办理协议
	onClickGoAgreementHandle () {
		util.go('/pages/default/agreement/agreement');
	}
});
