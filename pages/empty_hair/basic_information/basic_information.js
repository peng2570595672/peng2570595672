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
		showToast: false, // 是否验证码错误
		mobilePhone: '',
		tip1: '',	// 经办人电话号码校验提示
		orderInfo: {},
		formData: {
			cardPhoneCode: '',
			cardMobilePhone: ''// 线上：用户点好；线下：经办人电话
		}, // 提交数据
		identifyingCode: '获取验证码',
		time: 59,// 倒计时
		isGetIdentifyingCoding: false // 获取验证码中
	},
	async onLoad (options) {
		this.setData({
			mobilePhone: app.globalData.mobilePhone,
			'formData.cardMobilePhone': app.globalData.mobilePhone,
			orderInfo: JSON.parse(options.info)
		});
		if (this.data.orderInfo.vehPlate) {
			this.setData({
				available: true,
				carNoStr: this.data.orderInfo.vehPlate,
				carNo: this.data.orderInfo.vehPlate.split('')
			});
		}
		app.globalData.orderInfo.orderId = this.data.orderInfo.orderId;
		app.globalData.firstVersionData = false; // 非1.0数据办理
		app.globalData.isModifiedData = false; // 非修改资料
		app.globalData.signAContract = 3;
	},
	async onShow () {
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
		let params = {
			mobilePhone: this.data.mobilePhone,
			orderId: this.data.orderInfo.orderId,
			vehPlates: this.data.carNoStr,
			vehColor: this.data.carNoStr.length === 8 ? 4 : 0,
			notVerifyCardPhone: this.data.formData.cardMobilePhone === this.data.mobilePhone ? 'true' : 'false',
			cardMobilePhone: this.data.formData.cardMobilePhone,
			cardPhoneCode: this.data.formData.cardPhoneCode,
			memberPhoneFlag: 1// 对办理人手机号调整
		};

		const result = await util.getDataFromServersV2('consumer/order/bindEmptySendOrder', params);
		if (!result) return;
		this.setData({
			available: true,
			isRequest: false
		});
		if (result.code === 0) {
			app.globalData.handledByTelephone = this.data.mobilePhone;
			util.go('/pages/default/package_the_rights_and_interests/package_the_rights_and_interests');
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
		// 是否接受协议
		let isOk = true;
		// 验证车牌和车牌颜色
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
		// 校验经办人手机号码
		isOk = isOk && this.data.formData.cardMobilePhone && /^1[0-9]{10}$/.test(this.data.formData.cardMobilePhone);
		// 校验经办人手机号码
		isOk = isOk && ((this.data.formData.cardMobilePhone === this.data.mobilePhone) || (this.data.formData.cardMobilePhone !== this.data.mobilePhone && this.data.formData.cardPhoneCode.length === 4));
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
		let tip1 = '';	// 办理人手机号提示
		// 手机号 校验
		let formData = this.data.formData;
		if (key === 'cardMobilePhone') {
			let value = e.detail.value;
			let flag = /^1[1-9][0-9]{9}$/.test(value);
			if (value.substring(0,1) !== '1' || value.substring(1,2) === '0') {
				this.setData({
					cardMobilePhone: ''
				});
				return util.showToastNoIcon('非法号码');
			} else if (len < 11) {
				tip1 = key === 'cardMobilePhone' ? '*手机号未满11位，请检查' : '';
			} else if (len === 11 && !flag) {
				util.showToastNoIcon('非法号码');
			}
			formData[key] = value;
		}
		if (key === 'cardPhoneCode' && e.detail.value.length > 4) { // 验证码
			formData[key] = e.detail.value.substring(0, 4);
		} else if (key === 'cardPhoneCode') {
			formData[key] = e.detail.value;
		}
		this.setData({
			formData,
			[key]: value,
			tip1
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
		this.setData({
			available: this.validateAvailable(true)
		});
		if (!this.data.available || this.data.isRequest) {
			return util.showToastNoIcon('请填写相关信息');
		}
		util.showLoading();
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
