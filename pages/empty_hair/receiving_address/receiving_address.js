/**
 * @author 老刘
 * @desc 填写车牌和收货信息
 */
const util = require('../../../utils/util.js');
const app = getApp();
let timer;
Page({
	data: {
		topProgressBar: 1.0,	// 进度条展示的长度 ，再此页面的取值范围 [1,2),默认为1,保留一位小数
		mobilePhoneMode: 0, // 0 适配iphone 678系列 1 iphone x 2 1080 3 最新全面屏
		showKeyboard: false, // 是否显示键盘
		currentIndex: -1, // 当前选中的输入车牌位置
		carNoStr: '', // 车牌字符串
		carNo: ['', '', '', '', '', '', '', ''], // 车牌对应的数组
		mobilePhoneIsOk: false,
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		isNewPowerCar: false, // 是否为新能源
		hasVeh: true, // 是否有车牌
		showToast: false, // 是否验证码错误
		mobilePhone: '',
		size: 30,
		tip1: '',	// 经办人电话号码校验提示
		orderInfo: {},
		formData: {
			currentCarNoColor: 0, // 0 蓝色 1 渐变绿 2黄色
			region: [], // 省市区
			regionCode: [], // 省份编码
			userName: '', // 收货人姓名
			telNumber: '', // 电话号码
			detailInfo: '', // 收货地址详细信息
			cardPhoneCode: '',
			cardMobilePhone: ''// 线上：用户点好；线下：经办人电话
		}, // 提交数据
		identifyingCode: '获取验证码',
		time: 59,// 倒计时
		isGetIdentifyingCoding: false // 获取验证码中
	},
	async onLoad (options) {
		app.globalData.firstVersionData = false; // 非1.0数据办理
		app.globalData.isModifiedData = false; // 非修改资料
		app.globalData.signAContract = 3;
		app.globalData.otherPlatformsServiceProvidersId = options.shopId;
	},
	async onShow () {
		this.login();
	},
	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: async (res) => {
				const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				});
				if (!result) return;
				if (result.code) {
					util.showToastNoIcon(result.message);
					return;
				}
				result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
				this.setData({
					loginInfo: result.data
				});
				// 已经绑定了手机号
				if (result.data.needBindingPhone !== 1) {
					app.globalData.userInfo = result.data;
					app.globalData.openId = result.data.openId;
					app.globalData.memberId = result.data.memberId;
					app.globalData.mobilePhone = result.data.mobilePhone;
					this.setData({
						'formData.cardMobilePhone': result.data.mobilePhone
					});
				} else {
					wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
					// util.go('/pages/login/login/login');
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	// 是否有车牌切换
	handleChangeVeh () {
		this.setData({
			hasVeh: !this.data.hasVeh
		});
		this.setData({
			available: this.validateAvailable(true)
		});
	},
	// 从微信选择地址
	onClickAutoFillHandle () {
		// 统计点击事件
		this.setData({
			isNeedRefresh: false
		});
		wx.chooseAddress({
			success: (res) => {
				console.log(res);
				let formData = this.data.formData;
				formData.userName = res.userName; // 姓名
				formData.telNumber = res.telNumber; // 电话
				formData.region = [res.provinceName, res.cityName, res.countyName]; // 省市区
				formData.detailInfo = res.detailInfo; // 详细地址
				this.setData({
					formData,
					tip2: '',
					tip3: '',
					mobilePhoneIsOk: /^1[0-9]{10}$/.test(res.telNumber.substring(0, 11))
				});
				this.setData({
					available: this.validateAvailable(true)
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
				} else if (e.errMsg !== 'chooseAddress:fail cancel' && !e.errMsg.includes('chooseAddress:fail privacy')) {
					util.showToastNoIcon('选择收货地址失败！');
				}
			}
		});
	},
	// 省市区选择
	onPickerChangedHandle (e) {
		console.log(e);
		let formData = this.data.formData;
		formData.region = e.detail.value;
		if (e.detail.code && e.detail.code.length === 3) {
			formData.regionCode = e.detail.code;
		}
		this.setData({
			formData,
			available: this.validateAvailable(true)
		});
	},
	// 选择当前地址
	onClickChooseLocationHandle () {
		// 统计点击事件;
		wx.chooseLocation({
			success: (res) => {
				let address = res.address;
				let name = res.name;
				console.log('address',address);
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
	getAddressInfo (location, name) {
		util.getAddressInfo(location.lat, location.lng, (res) => {
			if (res.result) {
				let info = res.result.ad_info;
				let formData = this.data.formData;
				formData.region = [info.province, info.city, info.district]; // 省市区
				formData.regionCode = [`${info.city_code.substring(3).substring(0, 2)}0000`, info.city_code.substring(3), info.adcode]; // 省市区区域编码
				formData.detailInfo = name; // 详细地址
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
	// 发送短信验证码
	async sendCardPhoneCode () {
		if (this.data.isGetIdentifyingCoding) return;
		// 如果在倒计时，直接不处理
		if (!this.data.formData.cardMobilePhone) {
			util.showToastNoIcon('请输入手机号');
			return;
		} else if (!/^1[0-9]{10}$/.test(this.data.formData.cardMobilePhone)) {
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
			receivePhone: this.data.formData.cardMobilePhone + '' // 手机号
		}, 'GET');
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
	// 下一步
	async next () {
		this.setData({
			available: false, // 禁用按钮
			isRequest: true // 设置状态为请求中
		});
		let formData = this.data.formData; // 输入信息
		let params = {
			orderType: '71',
			promoterType: '48',// 47-平安h5空发  48-小程序空发
			shopId: app.globalData.otherPlatformsServiceProvidersId,
			promoterId: app.globalData.otherPlatformsServiceProvidersId,
			dataType: '12', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:获取实名信息，5:获取银行卡信息
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			vehPlates: this.data.hasVeh ? this.data.carNoStr : this.data.formData.cardMobilePhone, // 车牌号
			// vehColor: formData.currentCarNoColor === 1 ? 4 : formData.currentCarNoColor === 2 ? 1 : 0, // 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】
			vehColor: formData.currentCarNoColor === 1 ? 4 : 0, // 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】
			receiveMan: formData.userName, // 收货人姓名 【dataType包含2】
			receivePhone: formData.telNumber, // 收货人手机号 【dataType包含2】
			receiveProvince: formData.region[0], // 收货人省份 【dataType包含2】
			receiveCity: formData.region[1], // 收货人城市 【dataType包含2】
			receiveCounty: formData.region[2], // 收货人区县 【dataType包含2】
			receiveAddress: formData.detailInfo, // 收货人详细地址 【dataType包含2】
			notVerifyReceivePhone: true, // true 时不需要验证码
			notVerifyCardPhone: this.data.formData.cardMobilePhone === this.data.loginInfo.mobilePhone ? 'true' : 'false',
			cardMobilePhone: formData.cardMobilePhone,
			cardPhoneCode: formData.cardPhoneCode,
			memberPhoneFlag: 1// 对办理人手机号调整
		};

		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		if (!result) return;
		this.setData({
			available: true,
			isRequest: false
		});
		if (result.code === 0) {
			app.globalData.orderInfo.orderId = result.data.orderId;
			// 选择套餐页面
			let orderInfo = {
				shopId: params.shopId,
				thirdGeneralizeNo: params.thirdGeneralizeNo || '',
				promoterType: params.promoterType || ''
			};
			await util.initLocationInfo(orderInfo);
			if (!app.globalData.newPackagePageData.listOfPackages?.length) return;// 没有套餐
			util.go(`/pages/default/package_the_rights_and_interests/package_the_rights_and_interests?type=${params.shopProductId ? '' : app.globalData.newPackagePageData.type}`);
		} else if (result.code === 301) { // 已存在当前车牌未完成订单
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
		} else if (result.code === 104 && result.message === '该车牌已存在订单') {
			util.go(`/pages/default/high_speed_verification_failed/high_speed_verification_failed?carNo=${this.data.carNoStr}`);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 车牌输入回调
	valueChange (e) {
		// 兼容处理
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.indexMethod(e.detail.index, this.data.currentIndex);
		}
		// 设置数据
		this.setData({
			carNo: e.detail.carNo, // 车牌号数组
			carNoStr: e.detail.carNo.join(''), // 车牌号字符串
			currentIndex: e.detail.index, // 当前输入车牌号位置
			showKeyboard: e.detail.show // 是否显示键盘
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
			let checkLicensePlate = false;
			if (e.detail.carNo.join('').length >= 7) {
				checkLicensePlate = true;
			}
			this.setData({
				currentIndex: -1
			});
			this.setData({
				available: this.validateAvailable(checkLicensePlate)
			});
		}
	},
	// 点击某一位输入车牌
	setCurrentCarNo (e) {
		if (this.data.orderInfo.vehPlate) {
			return;
		}
		let index = e.currentTarget.dataset['index'];
		index = parseInt(index);
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.indexMethod(index, this.data.currentIndex);
		}
		this.setData({
			currentIndex: index
		});
		this.setData({
			showKeyboard: true
		});
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.showMethod(this.data.showKeyboard);
		}
		// }
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
	// 校验字段是否满足
	validateAvailable (checkLicensePlate) {
		const formData = this.data.formData;
		// 是否接受协议
		let isOk = true;
		// 验证车牌和车牌颜色
		if (this.data.hasVeh) {
			if (this.data.carNoStr.length === 7) { // 蓝牌或者黄牌
				// 进行正则匹配
				if (isOk) {
					let creg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1}$/;
					isOk = creg.test(this.data.carNoStr);
					if (checkLicensePlate && !isOk) {
						util.showToastNoIcon('车牌输入不合法，请检查重填');
					}
				}
			} else if (this.data.carNoStr.length === 8) {
				// 进行正则匹配
				if (isOk) {
					let xreg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{6}$/;
					isOk = xreg.test(this.data.carNoStr);
					if (checkLicensePlate && !isOk) {
						util.showToastNoIcon('车牌输入不合法，请检查重填');
					}
				}
			} else {
				isOk = false;
			}
		} else {
			isOk = true;
		}
		// 校验经办人手机号码
		isOk = isOk && formData.cardMobilePhone && /^1[0-9]{10}$/.test(formData.cardMobilePhone);
		// 校验经办人手机号码
		isOk = isOk && ((formData.cardMobilePhone === this.data.loginInfo.mobilePhone) || (formData.cardMobilePhone !== this.data.loginInfo.mobilePhone && formData.cardPhoneCode.length === 4));
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
		return isOk;
	},
	// etc4.0：新增-拉起微信授权手机号
	focus () {
		// 拉起下面输入框键盘时关闭 输入车牌号键盘
		this.selectComponent('#keyboard').hide();
	},
	// 输入框输入值
	onInputChangedHandle (e) {
		let key = e.currentTarget.dataset.name;	//
		let len = e.detail.cursor;	// 输入值的长度
		let value = e.detail.value;
		let formData = this.data.formData;
		let tip1 = '';	// 办理人手机号提示
		let tip2 = '';	// 收货姓名提示
		let tip3 = '';	// 收获人手机号提示
		// 手机号 校验
		if (key === 'telNumber' || key === 'cardMobilePhone') {
			let value = e.detail.value;
			let flag = /^1[1-9][0-9]{9}$/.test(value);
			if (value.substring(0,1) !== '1' || value.substring(1,2) === '0') {
				if (key === 'telNumber') {
					this.setData({
						'formData.telNumber': ''
					});
				} else {
					this.setData({
						'formData.cardMobilePhone': ''
					});
				}
				return util.showToastNoIcon('非法号码');
			} else if (len < 11) {
				tip1 = key === 'cardMobilePhone' ? '*手机号未满11位，请检查' : '';
				tip3 = key === 'telNumber' ? '*手机号未满11位，请检查' : '';
			} else if (len === 11 && !flag) {
				util.showToastNoIcon('非法号码');
			}
		}
		if (key === 'cardPhoneCode' && e.detail.value.length > 4) { // 验证码
			formData[key] = e.detail.value.substring(0, 4);
		} else if (key === 'cardPhoneCode') {
			formData[key] = e.detail.value;
		}
		// 收货人姓名 校验
		if (key === 'userName') {
			let patrn = /[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘'，。、]/im;	// 校验非法字符
			let patrn1 = /^[A-Za-z]+$/;	// 校验英文
			let patrn2 = /^[\u4e00-\u9fa5]{0,}$/;	// 校验汉字
			if (len < 1) {
				tip2 = '姓名不可为空';
			} else if (patrn.test(value)) {
				value = '';
				tip2 = '非法字符';
				util.showToastNoIcon('非法字符');
			} else if (patrn2.test(value)) {
				tip2 = len > 13 ? '超出可输入最大数' : '';
				this.setData({
					size: 13
				});
			} else if (patrn1.test(value)) {
				tip2 = len > 26 ? '超出可输入最大数' : '';
				this.setData({
					size: 26
				});
			} else if (!patrn2.test(value) && !patrn1.test(value)) {
				tip2 = len > 26 ? '超出可输入最大数' : '';
				this.setData({
					size: 26
				});
			}
		}
		formData[key] = value;
		this.setData({
			formData,
			tip1,
			tip2,
			tip3
		});
		this.fangDou('',500);
	},
	fangDou (fn, time) {
		let that = this;
		return (function () {
			if (that.data.timeout) {
				clearTimeout(that.data.timeout);
			}
			that.data.timeout = setTimeout(() => {
				that.setData({
					available: that.validateAvailable(true)
				});
			}, time);
		})();
	},
	// 传车牌及车牌颜色校验是否已有黔通订单 三方接口
	async validateCar () {
		if (!app.globalData.userInfo.accessToken) {
			util.go('/pages/login/login/login');
			return;
		}
		this.setData({
			available: this.validateAvailable(true)
		});
		if (!this.data.available || this.data.isRequest) {
			return util.showToastNoIcon('请填写相关信息');
		}
		util.showLoading();
		if (!this.data.hasVeh) {
			this.next();
			return;
		}
		const res = await util.getDataFromServersV2('consumer/etc/qtzl/checkVehPlateExists', {
			vehiclePlate: this.data.carNoStr,
			vehicleColor: this.data.carNoStr.length === 8 ? 4 : 0 // 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】,
		});
		if (!res) return;
		if (res.code === 0) {
			util.hideLoading();
			if (res.data.canSubmit === 1) {
				this.next();
			} else {
				return util.showToastNoIcon(res.data.canSubmitMsg);
			}
		} else {
			util.hideLoading();
			return util.showToastNoIcon(res.message);
		}
	},
	// 点击添加新能源
	onClickNewPowerCarHandle (e) {
		if (this.data.orderInfo.vehPlate) {
			return;
		}
		this.setData({
			isNewPowerCar: true,
			currentCarNoColor: 1
		});
		this.setCurrentCarNo(e);
	},
	onUnload () {
	}
});
