/**
 * @author 老刘
 * @desc 填写车牌和收货信息
 */
const util = require('../../../utils/util.js');
const app = getApp();
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
		isOnlineDealWith: true, // 是否是线上办理
		formData: {
			currentCarNoColor: 0, // 0 蓝色 1 渐变绿 2黄色
			region: [], // 省市区
			regionCode: [], // 省份编码
			userName: '', // 收货人姓名
			telNumber: '', // 电话号码
			detailInfo: '', // 收货地址详细信息
			operator: ''// 线上：用户点好；线下：经办人电话
		}, // 提交数据
		enterType: -1,// 进入小程序类型  23.搜一搜小程序独立办理链接A，24.搜一搜小程序独立办理链接B
		productId: '',
		rightsPackageId: '',
		shopId: '',
		tip1: '',	// 经办人电话号码校验提示
		tip2: '',	// 收件人姓名校验
		tip3: '',	// 校验收件人电话号码提示
		isName: true,	// 控制收货人名称是否合格
		size: 30
	},
	async onLoad (options) {
		app.globalData.orderInfo.orderId = '';
		app.globalData.firstVersionData = false; // 非1.0数据办理
		app.globalData.isModifiedData = false; // 非修改资料
		app.globalData.signAContract = 3;
	},
	async onShow () {
		this.getWchatPhoneNumber();
		this.controllTopTabBar();
	},
	// 下一步
	async next () {
		// 统计点击事件
		wx.uma.trackEvent('receiving_address_next');
		this.setData({
			available: false, // 禁用按钮
			isRequest: true // 设置状态为请求中
		});
		let formData = this.data.formData; // 输入信息
		let params = {
		};

		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		if (!result) return;
		this.setData({
			available: true,
			isRequest: false
		});
		if (result.code === 0) {
		} else if (result.code === 301) { // 已存在当前车牌未完成订单
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
	// 点击车牌颜色选择车牌颜色
	onClickCarNoColorHandle (e) {
		let index = e.currentTarget.dataset.index;
		let formData = this.data.formData;
		formData.currentCarNoColor = parseInt(index);
		this.setData({
			formData,
			isNewPowerCar: formData.currentCarNoColor === 1// 如果选择了新能源 那么最后一个显示可输入
		});
		if (parseInt(index) === 0 && this.data.carNoStr.length === 8) {
			util.showToastNoIcon('8位车牌号为绿牌车！');
		} else if (parseInt(index) === 1 && this.data.carNoStr.length === 7) {
			util.showToastNoIcon('7位车牌号为蓝牌车！');
			// util.showToastNoIcon('7位车牌号为蓝牌车或黄牌车！');
		}
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
	// 校验字段是否满足
	validateAvailable (checkLicensePlate) {
		console.log('ssss');
		// 是否接受协议
		let isOk = true;
		let formData = this.data.formData;
		// 验证车牌和车牌颜色
		if (this.data.carNoStr.length === 7) { // 蓝牌或者黄牌
			isOk = isOk && (formData.currentCarNoColor === 0 || formData.currentCarNoColor === 2);
			// 进行正则匹配
			if (isOk) {
				let creg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1}$/;
				isOk = creg.test(this.data.carNoStr);
				if (checkLicensePlate && !isOk) {
					util.showToastNoIcon('车牌输入不合法，请检查重填');
				}
			}
		} else if (this.data.carNoStr.length === 8) {
			isOk = isOk && formData.currentCarNoColor === 1;
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
		isOk = isOk && this.data.formData.operator && /^1[0-9]{10}$/.test(this.data.formData.operator);
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
		this.controllTopTabBar();
		return isOk;
	},
	// etc4.0：新增-拉起微信授权手机号
	focus () {
		// 拉起下面输入框键盘时关闭 输入车牌号键盘
		this.selectComponent('#keyboard').hide();
	},
	getWchatPhoneNumber () {
		if (app.globalData.userInfo.needBindingPhone !== 1) {	// 判断是否绑定过手机号
			this.setData({
				tip1: '',
				'formData.operator': app.globalData.mobilePhone,
				available: this.validateAvailable(true)
			});
		} else {
			util.showToastNoIcon('手机号未绑定，马上跳转登录页登录');
			setTimeout(() => {
				wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
				// util.go('/pages/login/login/login');
			},1500);
		}
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
		if (key === 'telNumber' || key === 'operator') {
			let value = e.detail.value;
			let flag = /^1[1-9][0-9]{9}$/.test(value);
			if (value.substring(0,1) !== '1' || value.substring(1,2) === '0') {
				if (key === 'telNumber') {
					this.setData({
						'formData.telNumber': ''
					});
				} else {
					this.setData({
						'formData.operator': ''
					});
				}
				return util.showToastNoIcon('非法号码');
			} else if (len < 11) {
				tip1 = key === 'operator' ? '*手机号未满11位，请检查' : '';
				tip3 = key === 'telNumber' ? '*手机号未满11位，请检查' : '';
			} else if (len === 11 && !flag) {
				util.showToastNoIcon('非法号码');
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
		this.setData({
			available: this.validateAvailable(true)
		});
		util.showLoading();
		if (!this.data.available || this.data.isRequest) {
			return util.showToastNoIcon('请填写相关信息');
		}
		let formData = this.data.formData; // 输入信息
		const res = await util.getDataFromServersV2('consumer/etc/qtzl/checkVehPlateExists', {
			vehiclePlate: this.data.carNoStr,
			vehicleColor: formData.currentCarNoColor === 1 ? 4 : 0 // 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】,
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
		this.setData({
			isNewPowerCar: true,
			currentCarNoColor: 1
		});
		this.setCurrentCarNo(e);
	},
	// 控制顶部进度条的大小
	controllTopTabBar () {
		this.setData({
			topProgressBar: 2.0
		});
	},
	onUnload () {
	}
});
