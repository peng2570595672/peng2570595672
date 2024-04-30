
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		imageCardIndex: 0, // 第一个设备
		carNoStr: '', // 车牌字符串
		carNo: ['', '', '', '', '', '', '', ''], // 车牌对应的数组
		carNoStr_new: '', // 车牌字符串
		carNo_new: ['', '', '', '', '', '', '', ''], // 车牌对应的数组
		mobilePhoneMode: 0, // 0 适配iphone 678系列 1 iphone x 2 1080 3 最新全面屏
		showKeyboard: false, // 是否显示键盘
		currentIndex: -1, // 当前选中的输入车牌位置
		showKeyboard_new: false, // 是否显示键盘
		currentIndex_new: -1, // 当前选中的输入车牌位置
		carNoStrflag: false, // 旧车牌是否校验成功
		carNoStr_newflag: false, // 旧车牌是否校验成功
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
		isDisableClick: false, // 是否禁止点击
		available: false
	},
	onLoad (options) {

	},
	onReady () {

	},
	onShow () {

	},
	onHide () {

	},
	onUnload () {

	},
	setCurrentCarData (e) {
		let imageCardIndex = +e.currentTarget.dataset.index;
		this.setData({
			imageCardIndex
		});
	},
	// 点击添加新能源
	onClickNewPowerCarHandle (e) {
		if (this.data.isDisableClick) return;
		this.setData({
			isNewPowerCar: true
		});
		this.setCurrentCarNo(e);
	},
	// 点击添加新能源
	onClickNewPowerCarHandle_new (e) {
		if (this.data.isDisableClick) return;
		this.setData({
			isNewPowerCar: true
		});
		this.setCurrentCarNo_new(e);
	},
	validateCar () {
		if (!this.data.available) {
			return;
		}
		this.selectComponent('#popTipComp').show({
			type: 'eight',
			title: '提交审核提醒',
			content: '您的车牌更换申请已提交，系统将在3~5个工作日内完成处理，届时将通知您更换结果，请留意通知消息!',
			btnconfirm: '我知道了',
			callBack: (res) => {
				console.log('123');
				wx.switchTab({
					url: '/pages/Home/Home'
				});
			}
		});
		// util.alert({
		// 	title: '车牌号提交审核确认提醒',
		// 	content: '请再次确认您的新旧车牌号！',
		// 	confirmText: '确认',
		// 	cancelText: '取消',
		// 	confirm: () => {
		// 	}
		// });
	},
	// 校验字段是否满足
	validateAvailable (checkLicensePlate,carNoType) {
		let isOk = true;
		let formData = this.data.formData;
		// const
		// 验证车牌和车牌颜色
		if (this.data[carNoType].length === 7) { // 7位数的车牌
			// isOk = isOk && (formData.currentCarNoColor === 0 || formData.currentCarNoColor === 2);
			// 进行正则匹配
			if (isOk) {
				let creg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1}$/;
				isOk = creg.test(this.data[carNoType]);
				if (checkLicensePlate && isOk) {
					this.setData({
						[carNoType + 'flag']: true
					});
				}
				if (checkLicensePlate && !isOk) {
					util.showToastNoIcon('车牌输入不合法，请检查重填');
				}
			}
		} else if (this.data[carNoType].length === 8) { // 8位数的车牌
			// isOk = isOk && formData.currentCarNoColor === 1;
			// 进行正则匹配
			if (isOk) {
				let xreg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{6}$/;
				isOk = xreg.test(this.data[carNoType]);
				if (checkLicensePlate && isOk) {
					this.setData({
						[carNoType + 'flag']: true
					});
				}
				if (checkLicensePlate && !isOk) {
					util.showToastNoIcon('车牌输入不合法，请检查重填');
				}
			}
		} else {
			isOk = false;
		}
		if (!this.data.carNoStrflag || !this.data.carNoStr_newflag) {
			isOk = false;
		}
		return isOk;
	},
	// 定义一个更新键盘状态和数据的辅助函数
	updateKeyboardAndData (e) {
		const newCarType = e.currentTarget.dataset['is_new'];
		const keyboardId = newCarType ? '#keyboard_new' : '#keyboard';
		const carNoKey = newCarType ? 'carNo_new' : 'carNo';
		const carNoStrKey = newCarType ? 'carNoStr_new' : 'carNoStr';
		const currentIndexKey = newCarType ? 'currentIndex_new' : 'currentIndex';
		const showKeyboardKey = newCarType ? 'showKeyboard_new' : 'showKeyboard';
		console.log(carNoKey, e.detail);

		// 兼容处理
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent(keyboardId);
			keyboard.indexMethod(e.detail.index, this.data[currentIndexKey]);
			keyboard.showMethod(this.data[showKeyboardKey]);
		}

		// 设置数据
		let formData = this.data.formData;
		this.setData({
			[carNoKey]: e.detail.carNo, // 车牌号数组
			[carNoStrKey]: e.detail.carNo.join(''), // 车牌号字符串
			[currentIndexKey]: e.detail.index, // 当前输入车牌号位置
			[showKeyboardKey]: e.detail.show // 是否显示键盘
		});

		// 不是新能源且输入到最后一位隐藏键盘
		if (!this.data.isNewPowerCar && this.data[currentIndexKey] === 7) {
			this.setData({
				[showKeyboardKey]: false,
				[currentIndexKey]: -1
			});
		}

		// 键盘关闭时的逻辑
		if (!this.data[showKeyboardKey]) {
			let checkLicensePlate = e.detail.carNo.join('').length >= 7;
			this.setData({
				[currentIndexKey]: -1
			});
			this.setData({
				available: this.validateAvailable(checkLicensePlate,carNoStrKey)
			});
		}
	},

	// 共享的处理逻辑
	handleKeyboardInteraction (e, keyboardId, currentIndexState) {
		if (this.data.isDisableClick) return;

		const index = parseInt(e.currentTarget.dataset.index);
		console.log('11');
		if (app.globalData.SDKVersion < '2.6.1') {
			const keyboard = this.selectComponent(`#${keyboardId}`);
			keyboard.indexMethod(index, this.data[currentIndexState]);
		}

		this.setData({
			[currentIndexState]: index,
			showKeyboard: true
		});
		if (app.globalData.SDKVersion < '2.6.1') {
			const keyboard = this.selectComponent(`#${keyboardId}`);
			keyboard.showMethod(this.data[`showKeyboard_${keyboardId.slice(-4)}`]);
		}
	},

	// 点击某一位输入车牌
	setCurrentCarNo (e) {
		if (this.data.isDisableClick) return;
		let index = e.currentTarget.dataset['index'];
		index = parseInt(index);
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.indexMethod(index, this.data.currentIndex);
		}
		this.setData({
			currentIndex: index,
			showKeyboard_new: false,
			showKeyboard: true
		});
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.showMethod(this.data.showKeyboard);
		}
	},

	// 点击某一位输入车牌（新）
	setCurrentCarNo_new (e) {
		if (this.data.isDisableClick) return;
		let index = e.currentTarget.dataset['index'];
		index = parseInt(index);
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboardNew = this.selectComponent('#keyboard_new');
			keyboardNew.indexMethod(index, this.data.currentIndex_new);
		}
		this.setData({
			currentIndex_new: index,
			showKeyboard_new: true,
			showKeyboard: false
		});
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboardNew = this.selectComponent('#keyboard_new');
			keyboardNew.showMethod(this.data.showKeyboard_new);
		}
	}
});
