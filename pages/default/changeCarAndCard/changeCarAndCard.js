/* eslint-disable camelcase */
import { wxApi2Promise } from '../../../utils/utils';
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		image_cardIndex: 0, // 第一个设备
		carNoStr: '', // 车牌字符串
		carNo: ['', '', '', '', '', '', '', ''], // 车牌对应的数组
		carNoStr_new: '', // 车牌字符串
		carNo_new: ['', '', '', '', '', '', '', ''], // 车牌对应的数组
		mobilePhoneMode: 0, // 0 适配iphone 678系列 1 iphone x 2 1080 3 最新全面屏
		showKeyboard: false, // 是否显示键盘
		currentIndex: -1, // 当前选中的输入车牌位置
		showKeyboard_new: false, // 是否显示键盘
		currentIndex_new: -1, // 当前选中的输入车牌位置
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
		isDisableClick: false // 是否禁止点击
	},
	onLoad(options) {

	},
	onReady() {

	},
	onShow() {

	},
	onHide() {

	},
	onUnload() {

	},
	setCurrentCarData(e) {
		let image_cardIndex = +e.currentTarget.dataset.index;
		this.setData({
			image_cardIndex
		})
	},
	// 点击添加新能源
	onClickNewPowerCarHandle(e) {
		if (this.data.isDisableClick) return;
		this.setData({
			isNewPowerCar: true
		});
		this.setCurrentCarNo(e);
	},
	// 点击添加新能源
	onClickNewPowerCarHandle_new(e) {
		if (this.data.isDisableClick) return;
		this.setData({
			isNewPowerCar: true
		});
		this.setCurrentCarNo_new(e);
	},
	async validateCar() {
		console.log('2');
		if (!this.validateAvailable(true)) {
			return;
		}
		this.selectComponent('#popTipComp').show({
			type: 'eight',
			title: '提交审核提醒',
			content: '您的车牌更换申请已提交，系统将在3~5个工作日内完成处理，届时将通知您更换结果，请留意通知消息!',
			btnconfirm: '我知道了'
		});
	},
	// 校验字段是否满足
	validateAvailable(checkLicensePlate) {
		let isOk = true;
		let formData = this.data.formData;
		// 验证车牌和车牌颜色
		if (this.data.carNoStr.length === 7 || this.data.carNoStr_new.length === 7) { // 蓝牌或者黄牌
			// isOk = isOk && (formData.currentCarNoColor === 0 || formData.currentCarNoColor === 2);
			// 进行正则匹配
			if (isOk) {
				let creg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳]{1}$/;
				isOk = creg.test(this.data.carNoStr) && creg.test(this.data.carNoStr_new);
				if (checkLicensePlate && !isOk) {
					util.showToastNoIcon('车牌输入不合法，请检查重填');
					return false;
				}
			}
		} else if (this.data.carNoStr.length === 8 || this.data.carNoStr_new.length === 8) {
			// isOk = isOk && formData.currentCarNoColor === 1;
			// 进行正则匹配
			if (isOk) {
				let xreg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{6}$/;
				isOk = xreg.test(this.data.carNoStr) && xreg.test(this.data.carNoStr_new);
				if (checkLicensePlate && !isOk) {
					util.showToastNoIcon('车牌输入不合法，请检查重填');
					return false;
				}
			}
		} else {
			isOk = false;
		}
		return isOk;
	},
	// 定义一个更新键盘状态和数据的辅助函数
	updateKeyboardAndData(e) {
		const is_new = e.currentTarget.dataset['is_new'];
		const keyboardId = is_new ? '#keyboard_new' : '#keyboard';
		const carNoKey = is_new ? 'carNo_new' : 'carNo';
		const carNoStrKey = is_new ? 'carNoStr_new' : 'carNoStr';
		const currentIndexKey = is_new ? 'currentIndex_new' : 'currentIndex';
		const showKeyboardKey = is_new ? 'showKeyboard_new' : 'showKeyboard';
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
				available: this.validateAvailable(checkLicensePlate)
			});
		}
	},

	// 共享的处理逻辑
	handleKeyboardInteraction(e, keyboardId, currentIndexState) {
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
	setCurrentCarNo(e) {
		if (this.data.isDisableClick) return;
		let index = e.currentTarget.dataset['index'];
		index = parseInt(index);
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.indexMethod(index, this.data.currentIndex);
		}
		this.setData({
			currentIndex: index,
			showKeyboard: true
		});
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard = this.selectComponent('#keyboard');
			keyboard.showMethod(this.data.showKeyboard);
		}
	},

	// 点击某一位输入车牌（新）
	setCurrentCarNo_new(e) {
		if (this.data.isDisableClick) return;
		let index = e.currentTarget.dataset['index'];
		index = parseInt(index);
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard_new = this.selectComponent('#keyboard_new');
			keyboard_new.indexMethod(index, this.data.currentIndex_new);
		}
		this.setData({
			currentIndex_new: index,
			showKeyboard_new: true
		});
		if (app.globalData.SDKVersion < '2.6.1') {
			let keyboard_new = this.selectComponent('#keyboard_new');
			keyboard_new.showMethod(this.data.showKeyboard_new);
		}
	},
	// 显示键盘时，点击其他区域关闭键盘
	touchHandle(e) {
		if (this.data.showKeyboard) {
			this.setData({
				showKeyboard: false
			});
			let keyboard = this.selectComponent('#keyboard');
			keyboard.showMethod(false);
		}
	},
	onShareAppMessage() {
		return {
			title: ''
		};
	}
});
