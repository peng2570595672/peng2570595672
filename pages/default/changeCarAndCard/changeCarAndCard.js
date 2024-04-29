import {wxApi2Promise} from '../../../utils/utils';
const util = require('../../../utils/util.js');
const app = getApp();
Page({
  data: {
    carNoStr: '', // 车牌字符串
		carNo: ['', '', '', '', '', '', '', ''], // 车牌对应的数组
    mobilePhoneMode: 0, // 0 适配iphone 678系列 1 iphone x 2 1080 3 最新全面屏
		showKeyboard: false, // 是否显示键盘
		currentIndex: -1, // 当前选中的输入车牌位置
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
  // 校验字段是否满足
	validateAvailable (checkLicensePlate) {
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
		return isOk;
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
		if (this.data.isDisableClick) return;
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
		}
	},
  onShareAppMessage () {
    return {
      title: ''
    };
  }
});
