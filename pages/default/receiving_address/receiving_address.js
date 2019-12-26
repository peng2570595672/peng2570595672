/**
 * @author 狂奔的蜗牛
 * @desc 填写车牌和收货信息
 */
const util = require('../../../utils/util.js');
const app = getApp();
// 倒计时计时器
let timer;
Page({
	data: {
		showKeyboard: false, // 是否显示键盘
		currentIndex: -1, // 当前选中的输入车牌位置
		carNoStr: '', // 车牌字符串
		carNo: ['贵', '', '', '', '', '', '', ''], // 车牌对应的数组
		identifyingCode: '获取验证码',
		time: 59,// 倒计时
		isGetIdentifyingCoding: false, // 获取验证码中
		getAgreement: false, // 是否接受协议
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		isNewPowerCar: false, // 是否为新能源
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
	// 下一步
	next () {
		if (!this.data.available || this.data.isRequest) {
			return;
		}
		this.setData({
			available: false, // 禁用按钮
			isRequest: true // 设置状态为请求中
		});
		let formData = this.data.formData; // 输入信息
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			dataType: '12', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:获取实名信息，5:获取银行卡信息
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			vehPlates: this.data.carNoStr, // 车牌号
			vehColor: formData.currentCarNoColor === 1 ? 4 : formData.currentCarNoColor === 2 ? 1 : 0, // 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】
			receiveMan: formData.userName, // 收货人姓名 【dataType包含2】
			receivePhone: formData.telNumber, // 收货人手机号 【dataType包含2】
			receiveProvince: formData.region[0], // 收货人省份 【dataType包含2】
			receiveCity: formData.region[1], // 收货人城市 【dataType包含2】
			receiveCounty: formData.region[2], // 收货人区县 【dataType包含2】
			receiveAddress: formData.detailInfo, // 收货人详细地址 【dataType包含2】
			receivePhoneCode: formData.verifyCode // 收货人手机号验证码, 手机号没有修改时不需要 【dataType包含2】
		};
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
		}, (res) => {
			if (res.code === 0) {
				app.globalData.orderInfo.orderId = res.data.orderId; // 订单id
				// 选择套餐页面
				util.go('/pages/default/payment_way/payment_way');
			} else if (res.code === 301) { // 已存在当前车牌未完成订单
				// 订单id
				app.globalData.orderInfo.orderId = res.data.id; // 订单id
				util.alert({
					content: '系统检测到当前车牌您已在办理中，是否更新信息？',
					showCancel: true,
					confirmText: '更新',
					confirm: () => {
						this.next();
					}
				});
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
	// 车牌输入回调
	valueChange (e) {
		// 兼容处理
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.indexMethod(e.detail.index, this.data.currentIndex);
		}
		// 设置数据
		let formData = this.data.formData;
		formData.currentCarNoColor = e.detail.carNo.join('').length === 8 ? 1 : 0;
		this.setData({
			carNo: e.detail.carNo, // 车牌号数组
			carNoStr: e.detail.carNo.join(''), // 车牌号字符串
			currentIndex: e.detail.index, // 当前输入车牌号位置
			showKeyboard: e.detail.show, // 是否显示键盘
			formData
		});
		// 不是新能源 输入车牌最后一位隐藏键盘
		if (!this.data.isNewPowerCar && this.data.currentIndex === 7) {
			this.setData({
				showKeyboard: false,
				currentIndex: -1
			});
		}
		// 兼容处理是否显示或者隐藏键盘
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.showMethod(this.data.showKeyboard);
		}
		// 键盘关闭
		if (!this.data.showKeyboard) {
			this.setData({
				currentIndex: -1
			});
			this.setData({
				available: this.validateAvailable()
			});
		}
	},
	// 点击某一位输入车牌
	setCurrentCarNo (e) {
		let index = e.currentTarget.dataset['index'];
		index = parseInt(index);
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.indexMethod(index, this.data.currentIndex);
		}
		this.setData({
			currentIndex: index
		});
		if (!this.data.showKeyboard) {
			this.setData({
				showKeyboard: true
			});
			if (app.globalData.SDKVersion < '2.6.1') {
				let keyboard = this.selectComponent('#keyboard');
				keyboard.showMethod(this.data.showKeyboard);
			}
		}
	},
	// 点击车牌颜色选择车牌颜色
	onClickCarNoColorHandle (e) {
		let index = e.currentTarget.dataset.index;
		let formData = this.data.formData;
		formData.currentCarNoColor = parseInt(index);
		this.setData({
			formData,
			isNewPowerCar: formData.currentCarNoColor === 1// 如果选择了新能源 那么最后一个显示可输入
		});
		// 不是新能源 车牌为8位 去掉最后一位输入的车牌
		if (!this.data.isNewPowerCar && this.data.carNoStr.length === 8) {
			let carNo = this.data.carNo;
			carNo[7] = '';
			this.setData({
				carNoStr: this.data.carNoStr.substring(0, 7), // 车牌字符串
				carNo: carNo// 车牌对应的数组
			});
		}
		this.setData({
			available: this.validateAvailable()
		});
	},
	// 显示键盘时，点击其他区域关闭键盘
	touchHandle (e) {
		if (this.data.showKeyboard) {
			this.setData({
				showKeyboard: false
			});
			let keyboard = this.selectComponent('#keyboard');
			keyboard.showMethod(false);
			this.setData({
				available: this.validateAvailable()
			});
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
				formData.detailInfo = res.detailInfo; // 详细地址
				this.setData({
					formData
				});
				this.setData({
					available: this.validateAvailable()
				});
			},
			fail: (e) => {
				if (e.errMsg === 'chooseAddress:fail auth deny') {
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
					}, (res) => {
						util.showToastNoIcon('获取地理位置信息失败！');
					});
				}
				console.log(res);
			},
			fail: (e) => {
				// 选择地址未允许授权
				if (e.errMsg === 'chooseLocation:fail auth deny') {
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
	// 倒计时
	startTimer () {
		// 设置状态
		this.setData({
			identifyingCode: `${this.data.time}秒后重试`
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
					identifyingCode: `${this.data.time}秒后重试`
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
			util.showToastNoIcon('手机号格式错误');
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
			console.log(res);
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		}, 'GET');
	},
	// 输入框输入值
	onInputChangedHandle (e) {
		let key = e.currentTarget.dataset.key;
		let formData = this.data.formData;
		// 手机号
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
	validateAvailable () {
		// 是否接受协议
		let isOk = this.data.getAgreement;
		let formData = this.data.formData;
		// 校验姓名
		isOk = isOk && formData.userName && formData.userName.length >= 2;
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
		// 验证车牌和车牌颜色
		if (this.data.carNoStr.length === 7) { // 蓝牌或者黄牌
			isOk = isOk && (formData.currentCarNoColor === 0 || formData.currentCarNoColor === 2);
			// 进行正则匹配
			if (isOk) {
				let creg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1}$/;
				isOk = creg.test(this.data.carNoStr);
			}
		} else if (this.data.carNoStr.length === 8) {
			isOk = isOk && formData.currentCarNoColor === 1;
			// 进行正则匹配
			if (isOk) {
				let xreg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}(([0-9]{5}[DF]$)|([DF][A-HJ-NP-Z0-9][0-9]{4}$))/;
				xreg = xreg.test(this.data.carNoStr);
			}
		} else {
			isOk = false;
		}
		return isOk;
	},
	// 点击添加新能源
	onClickNewPowerCarHandle (e) {
		this.setData({
			isNewPowerCar: true,
			currentCarNoColor: 1
		});
		this.setCurrentCarNo(e);
	},
	// 查看办理协议
	onClickGoAgreementHandle () {
		util.go('/pages/default/agreement/agreement');
	}
});
