/**
 * @author 狂奔的蜗牛
 * @desc 修改车牌号
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
		available: false, // 按钮是否可点击
		isRequest: false,// 是否请求中
		isNewPowerCar: false, // 是否为新能源
		formData: {
			currentCarNoColor: 0 // 0 蓝色 1 渐变绿 2黄色
		}, // 提交数据
		oldCarNo: '' // 老车牌
	},
	onLoad (options) {
		this.setData({
			oldCarNo: options.carNo || ''
		});
		// 旧车牌
		if (this.data.oldCarNo) {
			let formData = this.data.formData;
			formData.currentCarNoColor = this.data.oldCarNo.length === 8 ? 1 : 0;
			this.setData({
				carNoStr: this.data.oldCarNo, // 车牌字符串
				carNo: this.data.oldCarNo.split(''), // 车牌对应的数组
				formData: formData,
				isNewPowerCar: formData.currentCarNoColor === 1
			});
			this.setData({
				available: this.validateAvailable()
			});
		}
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
			dataType: '1', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:获取实名信息，5:获取银行卡信息
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			vehPlates: this.data.carNoStr, // 车牌号
			vehColor: formData.currentCarNoColor === 1 ? 4 : formData.currentCarNoColor === 2 ? 1 : 0 // 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】
		};
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
		}, (res) => {
			if (res.code === 0) {
				app.globalData.orderInfo.orderId = res.data.orderId; // 订单id
				// 选择套餐页面
				app.globalData.packagePageData = undefined;
				util.go('/pages/default/payment_way/payment_way');
			} else if (res.code === 301) { // 已存在当前车牌未完成订单
				util.alert({
					content: '系统检测到当前车牌您已在办理中，是否更新信息？',
					showCancel: true,
					confirmText: '更新',
					confirm: () => {
						// 订单id
						app.globalData.orderInfo.orderId = res.data.id; // 订单id
						this.next();
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
	// 校验字段是否满足
	validateAvailable () {
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
			}
		} else if (this.data.carNoStr.length === 8) {
			isOk = isOk && formData.currentCarNoColor === 1;
			// 进行正则匹配
			if (isOk) {
				let xreg = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}(([0-9]{5}[ADGF]$)|([ADGF][A-HJ-NP-Z0-9][0-9]{4}$))/;
				isOk = xreg.test(this.data.carNoStr);
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
	}
});
