
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
		available: false,
		getAgreement: false,// 是否接受协议
		nmOrderList: []
	},
	async onLoad (options) {
		await this.IsAnActivationOrder();
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
	// 是否接受协议   点击同意协议并且跳转指定套餐模块
    onClickAgreementHandle () {
        let getAgreement = !this.data.getAgreement;
        this.setData({
            getAgreement
        });
    },
	validateCar () {
		// if (!this.data.available) {
		// 	return;
		// }
		// 判断是否存在未完成的换牌申请
        // this.selectComponent('#popTipComp').show({
        //     type: 'shenfenyanzhifail',
        //     title: '提示',
        //     btnCancel: '好的',
        //     refundStatus: true,
        //     content: '新车牌存在历史订单，无法重复办理!!',
        //     bgColor: 'rgba(0,0,0, 0.6)'
        // });
		app.globalData.orderInfo.orderId = this.data.orderId || '1239514002741006336';
		util.go(`/pages/default/information_validation/information_validation?vehPlates=${this.data.carNoStr_new}&vehColor=4&obuCardType=2`);
	},
	// 是否存在多个已激活订单
    async IsAnActivationOrder () {
        const result = await util.getDataFromServersV2('consumer/order/order-veh-plates-change/getNmgActOrder', {
        });
        if (!result) return;
        if (result.code === 0 && result.data) {
            this.setData({
                // 保存已激活订单 至少有一条
                nmOrderList: result.data
            });
        } else {
            util.showToastNoIcon(result.message);
        }
    },
	setOtherCarNo () {
		// 历史办理页
        let url = 'optionalOldLicensePlateList';
        util.go(`/pages/default/${url}/${url}`);
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
