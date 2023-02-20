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
			detailInfo: '' // 收货地址详细信息
		}, // 提交数据
		enterType: -1,// 进入小程序类型  23.搜一搜小程序独立办理链接A，24.搜一搜小程序独立办理链接B
		productId: '',
		rightsPackageId: '',
		shopId: '',
		operatorPhoneNumber: '',	// 线上：用户点好；线下：经办人电话
		tip1: '',	// 经办人电话号码校验提示
		tip2: '',	// 收件人姓名校验
		tip3: ''	// 校验收件人电话号码提示
	},
	async onLoad (options) {
		if (app.globalData.scanCodeToHandle && app.globalData.scanCodeToHandle.hasOwnProperty('isCrowdsourcing')) {
			wx.hideHomeButton();
		}
		if (options.shareId) {
			util.resetData();// 重置数据
			// 高速通行公众号进入办理
			app.globalData.isHighSpeedTraffic = options.shareId;
		}
		if (options.enterType) {
			this.setData({
				enterType: +options.enterType,
				shopId: options.shopId,
				rightsPackageId: options.rightsPackageId || '',
				productId: options.productId
			});
		}
		app.globalData.firstVersionData = false; // 非1.0数据办理
		app.globalData.isModifiedData = false; // 非修改资料
		app.globalData.signAContract = 3;
		// 会员券进入,线下取货
		if (app.globalData.membershipCoupon.id) {
			let formData = this.data.formData;
			formData.userName = '线下取货'; // 姓名
			formData.detailInfo = '沙文镇科教街188号';
			formData.region = ['贵州省', '贵阳市', '白云区']; // 省市区
			this.setData({
				isOnlineDealWith: false,
				formData
			});
		}
		if (app.globalData.userInfo.accessToken) {
			// 查询是否欠款
			await util.getIsArrearage();
		}
	},
	async onShow () {
		if (app.globalData.userInfo.accessToken) {
			this.setData({
				mobilePhoneMode: app.globalData.mobilePhoneMode
			});
		} else {
			// 公众号进入需要登录
			this.login();
		}
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
					// 查询是否欠款
					await util.getIsArrearage();
				} else {
					wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
					util.go('/pages/login/login/login');
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
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
			orderId: app.globalData.orderInfo.orderId, // 订单id
			orderType: this.data.isOnlineDealWith ? 11 : 12,
			dataType: '12', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:获取实名信息，5:获取银行卡信息
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			vehPlates: this.data.carNoStr, // 车牌号
			// vehColor: formData.currentCarNoColor === 1 ? 4 : formData.currentCarNoColor === 2 ? 1 : 0, // 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】
			vehColor: formData.currentCarNoColor === 1 ? 4 : 0, // 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】
			receiveMan: formData.userName, // 收货人姓名 【dataType包含2】
			receivePhone: formData.telNumber, // 收货人手机号 【dataType包含2】
			receiveProvince: formData.region[0], // 收货人省份 【dataType包含2】
			receiveCity: formData.region[1], // 收货人城市 【dataType包含2】
			receiveCounty: formData.region[2], // 收货人区县 【dataType包含2】
			receiveAddress: formData.detailInfo, // 收货人详细地址 【dataType包含2】
			notVerifyReceivePhone: true // true 时不需要验证码
		};
		if (app.globalData.otherPlatformsServiceProvidersId) {
			params['shopId'] = app.globalData.otherPlatformsServiceProvidersId;
		} else {
			params['shopId'] = app.globalData.miniProgramServiceProvidersId;
		}
		if (app.globalData.otherPlatformsServiceProvidersId) {
			// 扫描小程序码进入办理
			if (app.globalData.scanCodeToHandle) {
				params['promoterId'] = app.globalData.scanCodeToHandle.promoterId;// 推广者ID标识
				params['promoterType'] = app.globalData.scanCodeToHandle.promoterType; // 推广类型 0-平台引流 1-用户引流 2-渠道引流 3-活动引流 4-业务员推广  6:微信推广  默认为0  5  扫小程序码进入
				if (app.globalData.scanCodeToHandle.hasOwnProperty('isCrowdsourcing')) {
					// 业务员端众包用户推广
					params['isCrowdsourcing'] = app.globalData.scanCodeToHandle.isCrowdsourcing;
				}
			}
			// 高速通行活动进入办理
			if (app.globalData.isHighSpeedTrafficActivity) {
				params['promoterId'] = 0;// 推广者ID标识
				params['promoterType'] = 14; // 推广类型 0-平台引流 1-用户引流 2-渠道引流 3-活动引流 4-业务员推广  6:微信推广  默认为0  5  扫小程序码进入
			}
			// 面对面活动进入办理
			if ((app.globalData.isFaceToFaceCCB || app.globalData.isFaceToFaceICBC || app.globalData.isFaceToFaceWeChat) && app.globalData.faceToFacePromotionId) {
				params['promoterId'] = app.globalData.faceToFacePromotionId;// 推广者ID标识
				params['promoterType'] = 3; // 推广类型 0-平台引流 1-用户引流 2-渠道引流 3-活动引流 4-业务员推广  6:微信推广  默认为0  5  扫小程序码进入
				if (app.globalData.isFaceToFaceCCB) {
					params['thirdGeneralizeNo'] = 'isFaceToFaceCCB';
				} else if (app.globalData.isFaceToFaceICBC) {
					params['thirdGeneralizeNo'] = 'isFaceToFaceICBC';
				} else {
					params['thirdGeneralizeNo'] = 'isFaceToFaceWeChat';
				}
			}
			// 微保小程序推广进入办理
			if (app.globalData.isToMicroInsurancePromote) {
				params['promoterId'] = app.globalData.otherPlatformsServiceProvidersId;// 推广者ID标识
				params['promoterType'] = 17; // 推广类型 0-平台引流 1-用户引流 2-渠道引流 3-活动引流 4-业务员推广  6:微信推广  默认为0  5  扫小程序码进入
			}
		}
		// 活动引流
		if (app.globalData.activitiesOfDrainage) {
			params['promoterId'] = app.globalData.otherPlatformsServiceProvidersId;// 推广者ID标识
			params['promoterType'] = 3; // 推广类型 0-平台引流 1-用户引流 2-渠道引流 3-活动引流 4-业务员推广  6:微信推广  默认为0  5  扫小程序码进入
		}
		// 公众号带服务商引流进入办理
		if (app.globalData.officialChannel) {
			params['promoterId'] = app.globalData.otherPlatformsServiceProvidersId;// 推广者ID标识
			params['promoterType'] = 2; // 推广类型 0-平台引流 1-用户引流 2-渠道引流 3-活动引流 4-业务员推广  6:微信推广  默认为0  5  扫小程序码进入
		}
		// 城市服务进入办理
		if (app.globalData.isCitiesServices) {
			params['promoterId'] = 1;// 推广者ID标识
			params['promoterType'] = 6; // 推广类型 0-平台引流 1-用户引流 2-渠道引流 3-活动引流 4-业务员推广  6:微信推广  默认为0  5  扫小程序码进入
		}
		// 微信九宫格进入办理
		if (app.globalData.isWeChatSudoku) {
			params['promoterId'] = app.globalData.otherPlatformsServiceProvidersId;// 推广者ID标识
			params['promoterType'] = 9; // 推广类型 0-平台引流 1-用户引流 2-渠道引流 3-活动引流 4-业务员推广  6:微信推广  默认为0  5  扫小程序码进入  9 微信九宫格进入
		}
		//  第三方扫码办理
		if (app.globalData.isThirdGeneralize) {
			params['thirdGeneralizeNo'] = app.globalData.scanCodeToHandle.thirdGeneralizeNo;
			params['shopId'] = app.globalData.miniProgramServiceProvidersId;
			params['promoterId'] = app.globalData.scanCodeToHandle.promoterId;// 推广者ID标识
			params['promoterType'] = app.globalData.scanCodeToHandle.promoterType; // 推广类型 0-平台引流 1-用户引流 2-渠道引流 3-活动引流 4-业务员推广  6:微信推广  默认为0  5  扫小程序码进入
		}
		// 高速通行公众号进入办理
		if (app.globalData.isHighSpeedTraffic) {
			params['promoterId'] = app.globalData.isHighSpeedTraffic;// 推广者ID标识
			params['promoterType'] = 6; // 推广类型 0-平台引流 1-用户引流 2-渠道引流 3-活动引流 4-业务员推广  6:微信推广  默认为0  5  扫小程序码进入
		}
		if (app.globalData.membershipCoupon && app.globalData.membershipCoupon.id) {
			params['couponRecordsId'] = app.globalData.membershipCoupon.id;// 优惠券id
			params['discountsAmount'] = app.globalData.membershipCoupon.faceAmount;// 优惠券金额
			params['shopId'] = app.globalData.membershipCoupon.shopId;// 优惠券商户id
			params['promoterId'] = app.globalData.membershipCoupon.shopId;// 优惠券商户id
			params['promoterType'] = 12; // 推广类型 0-平台引流 1-用户引流 2-渠道引流 3-活动引流 4-业务员推广  6:微信推广  默认为0  5-扫小程序码进入 12-会员券创建
		}
		// 众包推广
		if (app.globalData.isCrowdsourcingPromote) {
			params['shopId'] = app.globalData.crowdsourcingServiceProvidersId;
			params['promoterId'] = app.globalData.crowdsourcingPromotionId;// 推广者ID标识
			params['promoterType'] = 1; // 推广类型 0-平台引流 1-用户引流 2-渠道引流 3-活动引流 4-业务员推广  6:微信推广  默认为0  5  扫小程序码进入
		}
		// 搜一搜进入
		if (this.data.enterType === 23 || this.data.enterType === 24) {
			params['shopId'] = this.data.shopId;
			params['promoterId'] = 0;// 推广者ID标识
			params['promoterType'] = this.data.enterType; // 推广类型 0-平台引流 1-用户引流 2-渠道引流 3-活动引流 4-业务员推广  6:微信推广  默认为0  5  扫小程序码进入
			if (this.data.enterType === 23) {
				let locationInfo = wx.getStorageSync('location-info');
				let regionCode = [0];
				if (locationInfo) {
					let res = JSON.parse(locationInfo);
					let info = res.result.ad_info;
					// 获取区域编码
					regionCode = [`${info.city_code.substring(3).substring(0, 2)}0000`, info.city_code.substring(3), info.adcode];
				}
				params['dataType'] = '123';
				params['shopProductId'] = this.data.productId;
				params['rightsPackageId'] = this.data.rightsPackageId;
				params['areaCode'] = regionCode[0];
			}
		}

		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		if (!result) return;
		this.setData({
			available: true,
			isRequest: false
		});
		if (result.code === 0) {
			app.globalData.orderInfo.orderId = result.data.orderId; // 订单id
			if (app.globalData.scanCodeToHandle && app.globalData.scanCodeToHandle.hasOwnProperty('isCrowdsourcing')) {
				await this.getProduct();
			} else {
				// 选择套餐页面
				let orderInfo = {
					shopId: params.shopId,
					thirdGeneralizeNo: params.thirdGeneralizeNo || '',
					promoterType: params.promoterType || ''
				};
				await util.initLocationInfo(orderInfo);
				if (!app.globalData.newPackagePageData.listOfPackages?.length) return;// 没有套餐
				console.log(app.globalData.newPackagePageData.type,'==============================');
				if (app.globalData.newPackagePageData.type) {
					// 只有分对分套餐 || 只有总对总套餐
					util.go(`/pages/default/package_the_rights_and_interests/package_the_rights_and_interests?type=${this.data.enterType === 23 ? '' : app.globalData.newPackagePageData.type}`);
				} else {
					util.go(`/pages/default/choose_the_way_to_handle/choose_the_way_to_handle`);
				}
			}
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
	// 根据套餐id获取套餐信息
	async getProduct () {
		const result = await util.getDataFromServersV2('consumer/system/get-product-by-id', {
			shopProductId: app.globalData.scanCodeToHandle.productId
		});
		if (!result) return;
		if (result.code === 0) {
			await this.submitProduct();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 付费提交套餐信息
	async submitProduct () {
		let locationInfo = wx.getStorageSync('location-info');
		let regionCode = [0];
		if (locationInfo) {
			let res = JSON.parse(locationInfo);
			let info = res.result.ad_info;
			// 获取区域编码
			regionCode = [`${info.city_code.substring(3).substring(0, 2)}0000`, info.city_code.substring(3), info.adcode];
		}
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', {
			dataType: '3',
			orderId: app.globalData.orderInfo.orderId,
			shopProductId: app.globalData.scanCodeToHandle.productId,
			areaCode: regionCode[0],
			shopId: app.globalData.scanCodeToHandle.shopId
		});
		if (!result) return;
		if (result.code === 0) {
			util.go(`/pages/default/package_the_rights_and_interests/package_the_rights_and_interests`);
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
		// if (!this.data.showKeyboard) {
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
	// 从微信选择地址
	onClickAutoFillHandle () {
		// 统计点击事件
		wx.uma.trackEvent('receiving_select_the_wechat_address');
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
		console.log(e);
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
		// 统计点击事件
		wx.uma.trackEvent('receiving_select_the_address');
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
		this.validateNew(e);
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
		// 校验经办人手机号码
		isOk = isOk && this.data.operatorPhoneNumber && /^1[0-9]{10}$/.test(this.data.operatorPhoneNumber);
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
	getWchatPhoneNumber (e) {
		if (e.detail.errMsg === 'getPhoneNumber:ok') {	// 同意授权
			console.log(app.globalData.userInfo);
			if (app.globalData.userInfo.needBindingPhone === 0) {	// 判断是否绑定过手机号
				this.setData({
					operatorPhoneNumber: app.globalData.mobilePhone,
					available: this.validateAvailable(true)
				});
			} else {
				util.showToastNoIcon('手机号为绑定，马上跳转登录页登录');
				setTimeout(() => {
					wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
					util.go('/pages/login/login/login');
				},1500);
			}
		}
	},
	// etc4.0:新增-校验(手机号，收件人，地址等)
	validateNew (e) {
		let name = e.currentTarget.dataset.name;
		let value = e.detail.value;
		let len = e.detail.cursor;
		// 校验手机号
		if (name === 'operator' || name === 'telNumber') {
			let flag = /^1[1-9][0-9]{9}$/.test(value);
			let tip = len < 11 ? '*手机号未满11位，请检查' : (len === 11 ? (flag ? '' : '非法号码') : '非法号码');
			if (tip === '非法号码') {
				if (name === 'operator') {
					this.setData({
						operatorPhoneNumber: '',
						tip1: tip
					});
				} else {
					this.setData({
						'formData.telNumber': '',
						tip3: tip
					});
				}
				util.showToastNoIcon('非法号码');
			} else {
				if (name === 'operator') {
					this.setData({
						tip1: tip
					});
					this.fangDou('',1500);
				} else {
					this.setData({
						tip3: tip
					});
					this.fangDou('',1500);
				}
			}
		}
		// 收件人姓名校验
		if (name === 'name') {
			let patrn = /[`~!@#$%^&*()_\-+=<>?:"{}|,.\/;'\\[\]·~！@#￥%……&*（）——\-+={}|《》？：“”【】、；‘'，。、]/im;	// 校验非法字符
			let patrn1 = /^[a-zA-Z]+$/;	// 校验英文
			let patrn2 = /^[\u4e00-\u9fa5]{0,}$/;	// 校验汉字
			let tip2 = '';
			if (len < 1) {
				this.setData({
					tip2: '姓名不可为空'
				});
			} else if (patrn.test(value)) {
				util.showToastNoIcon('非法字符');
			} else {
				if (patrn2.test(value)) {
					tip2 = len < 5 ? '' : '最大输入文字为4';
				} else {
					tip2 = len < 9 ? '' : '英文最大可输入8';
				}
				this.setData({
					tip2: tip2
				});
				this.fangDou('',1500);
			}
		}
		this.controllTopTabBar();
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
	// 传车牌及车牌颜色校验是否已有黔通订单
	async validateCar () {
		this.setData({
			available: this.validateAvailable(true)
		});
		if (!this.data.available || this.data.isRequest) {
			return;
		}
		let formData = this.data.formData; // 输入信息
		const res = await util.getDataFromServersV2('consumer/etc/qtzl/checkVehPlateExists', {
			vehiclePlate: this.data.carNoStr,
			vehicleColor: formData.currentCarNoColor === 1 ? 4 : 0 // 车牌颜色 0-蓝色 1-黄色 2-黑色 3-白色 4-渐变绿色 5-黄绿双拼色 6-蓝白渐变色 【dataType包含1】,
		},'POST',false);
		console.log('车牌颜色L:L:',res);
		if (!res) return;
		if (res.code === 0) {
			this.next();
		} else {
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
		let num = 0;
		if (this.data.carNoStr.length > 0) {
			num += 1;
		}
		if (this.data.formData.userName) {
			num += 1;
		}
		if (this.data.formData.region) {
			num += 1;
		}
		if (this.data.formData.detailInfo) {
			num += 1;
		}
		if (this.data.operatorPhoneNumber) {
			num += 1;
		}
		this.setData({
			topProgressBar: 1 + 0.15 * num
		});
	},
	onUnload () {
		// 统计点击事件
		wx.uma.trackEvent('receiving_address_return');
		// 清除会员券信息
		app.globalData.membershipCoupon = {};
	}
});
