/**
 * @author 老刘
 * @desc 填写车牌和收货信息
 */
const util = require('../../../utils/util.js');
const app = getApp();
let timer;
Page({
	data: {
		choiceIndex: 0,// 当前选中套餐下标
		activeIndex: 0,
		isFade: true,
		isLoaded: true,
		getAgreement: false, // 是否接受协议
		isSalesmanOrder: false,// 是否是业务员端办理
		equityListMap: [],	// 权益列表集合
		isCloseUpperPart: false, // 控制 详情是否显示
		isCloseUpperPart1: false, // 控制 详情是否显示
		isCloseUpperPart2: false, // 控制 详情是否显示
		isSelected: false,// 是否选中当前权益包
		listOfPackages: [
		],
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
		await this.getListOfPackages();
	},
	async onShow () {
		this.login();
	},
	// 黔通用户协议
	onClickGoQianTongAgreement () {
		util.go('/pages/truck_handling/agreement_for_qiantong_to_charge/agreement');
	},
	// 通通券协议
	onClickGoTTQAgreement1 () {
		util.go('/pages/agreement_documents/coupon_agreement/coupon_agreement');
	},
	// 查看隐私协议
	onClickGoPrivacyHandle () {
		util.go('/pages/agreement_documents/privacy_agreement/privacy_agreement');
	},
	// 查看办理协议
	onClickGoAgreementHandle () {
		const item = this.data.listOfPackages[this.data.choiceIndex];
		if (item.etcCardId === 1) {
			// serviceFeeType  是否收取权益服务费：0否，1是
			// productType: 套餐类型 1-业务员套餐 2-小程序套餐  3-H5套餐  4-后台办理套餐，5-APi办理  6-空发套餐
			// deliveryType: 1-邮寄 2-线下取货 3-现场办理
			const timeComparison = util.timeComparison('2023/8/23', this.data.orderInfo.base.addTime);
			// timeComparison 1-新订单 2-老订单
			if (item.deliveryType === 1 && (item.productType === 2 || item.productType === 3 || item.productType === 6)) {
				return util.go(`/pages/agreement_documents/equity_agreement/equity_agreement?type=${timeComparison === 1 ? 'QTnotFeesNew' : 'QTnotFees'}`);	// 不含注消费
			}
			if (item.deliveryType === 3 && (item.productType === 1 || item.productType === 5 || item.productType === 6)) {
				return util.go(`/pages/agreement_documents/equity_agreement/equity_agreement?type=${timeComparison === 1 ? 'QTNew' : 'QT'}`);
			}
		}
		if (item.etcCardId === 2) {
			if (item.deliveryType === 1 && (item.productType === 2 || item.productType === 3 || item.productType === 6)) {
				return util.go('/pages/agreement_documents/equity_agreement/equity_agreement?type=MTnotFees');	// 不含注消费
			}
			if (item.deliveryType === 3 && (item.productType === 1 || item.productType === 5 || item.productType === 6)) {
				return util.go('/pages/agreement_documents/equity_agreement/equity_agreement?type=MT');
			}
		}
		// 1-自购设备 2-免费设备 3-自购(其他)
		if (item?.environmentAttribute === 2) {
			util.go(`/pages/agreement_documents/agreement/agreement`);
		} else {
			util.go(`/pages/agreement_documents/new_self_buy_equipmemnt_agreement/index`);
		}
	},
	// 是否接受协议   点击同意协议并且跳转指定套餐模块
	onClickAgreementHandle () {
		let getAgreement = !this.data.getAgreement;
		this.setData({
			getAgreement
		});
	},
	btnOpenOrOff (e) { // 展开和收起
		let index = e.currentTarget.dataset.index[0];
		let activeIndex = e.currentTarget.dataset.index[2];
		let isCloseUpperPart = e.currentTarget.dataset.index[1];
		let flag = this.data.isCloseUpperPart1;
		let flag2 = this.data.isCloseUpperPart2;
		this.setData({
			isCloseUpperPart1: !flag,
			isCloseUpperPart2: isCloseUpperPart !== index ? false : !flag2
		});
	},
	// 根据商户获取套餐
	async getListOfPackages () {
		util.showLoading();
		let params = {
			needRightsPackageIds: true,
			productType: 2,
			vehType: 1,
			platformId: app.globalData.platformId,
			shopId: app.globalData.otherPlatformsServiceProvidersId
		};
		util.getDataFromServer('consumer/system/common/get-usable-product', params, () => {
			util.showToastNoIcon('获取套餐失败!');
		}, (res) => {
			if (res.code === 0) {
				if (res.data.length === 0) {
					util.showToastNoIcon('未查询到套餐，请联系工作人员处理！');
					return;
				}
				let listOfPackages = res.data;
				listOfPackages = listOfPackages.length === 1 ? listOfPackages : listOfPackages.slice(0, 1) || []; // 展示一个套餐
				this.setData({
					listOfPackages
				});
				// 获取 套餐模块的高度
				this.getNodeHeight(1);
			} else {
				util.showToastNoIcon(res.message);
			}
		}, '', () => {
			util.hideLoading();
		});
	},
	// 获取权益包信息
	async getNodeHeight (num) {
		this.setData({
			isLoaded: false
		});
		util.showLoading({
			title: '加载中'
		});
		let equityListMap = {
			defaultEquityList: [],	// 默认权益包列表
			addEquityList: [],	// 加购权益包列表
			serviceEquityList: [],	// 综合权益包
			bankList: [] // 信用卡套餐列表
		};
		let currentIndex = 0;
		for (currentIndex; currentIndex < num; currentIndex++) {
			// 后台返回的协议，格式转换
			if (this.data.listOfPackages[currentIndex]?.agreements) {
				try {
					this.setData({ [`listOfPackages[${currentIndex}].agreements`]: JSON.parse(this.data.listOfPackages[currentIndex]?.agreements) });
				} catch (error) { }
			}
			// 加购权益包
			const packageIds = this.data.listOfPackages[currentIndex]?.rightsPackageIds && this.data.listOfPackages[currentIndex]?.rightsPackageIds.length !== 0;
			if (!packageIds) {
				equityListMap.addEquityList.push({ index: currentIndex, packageName: '', payMoney: 0, aepIndex: -1 });
			} else {
				const result = await util.getDataFromServersV2('consumer/voucher/rights/common/get-packages-by-package-ids', {
					packageIds: this.data.listOfPackages[currentIndex]?.rightsPackageIds
				}, 'POST', false);
				if (result.code === 0) {
					// this.data.listOfPackages[currentIndex]?.mustChoiceRightsPackage === 1 ? 0 : -1
					let packageName = '';
					result.data.map((item, index) => {
						packageName += item.packageName;
						packageName += index < result.data.length - 1 ? '+' : '';
					});
					equityListMap.addEquityList.push({ index: currentIndex, packageName: packageName, subData: result.data, aepIndex: -1 });
				} else {
					// 占位
					equityListMap.addEquityList.push({ index: currentIndex, packageName: '', payMoney: 0, aepIndex: -1 });
				}
			}
			// 默认权益包(只能有一个)
			let defaultPackages = [];
			let sevicePackages = this.data.listOfPackages[currentIndex]?.serviceFeePackageId;
			if (sevicePackages) defaultPackages = sevicePackages.split(',');
			if (defaultPackages.length === 0) {
				equityListMap.serviceEquityList.push({ index: currentIndex, packageName: '', payMoney: 0 });
			} else {
				const result = await util.getDataFromServersV2('consumer/voucher/rights/common/get-packages-by-package-ids', {
					packageIds: defaultPackages
				}, 'POST', false);

				if (result.code === 0) {
					let packageName = '';
					// let payMoney = 0;	// 综合服务权益包 金额
					result.data.map((item, index) => {
						packageName += item.packageName;
						// payMoney += item.payMoney;
						packageName += index < result.data.length - 1 ? '+' : '';
					});
					equityListMap.serviceEquityList.push({ index: currentIndex, subData: result.data, packageName: packageName, payMoney: 0 });
				} else {
					// 占位
					equityListMap.serviceEquityList.push({ index: currentIndex, packageName: '', payMoney: 0 });
				}
			}
			// 2%综合服务费赠送的权益包
			let packageId = this.data.listOfPackages[currentIndex]?.rightsPackageId && this.data.listOfPackages[currentIndex]?.rightsPackageId !== 0;
			if (!packageId) {
				equityListMap.defaultEquityList.push({ index: currentIndex, packageName: '', payMoney: 0 });
			} else {
				const result = await util.getDataFromServersV2('consumer/voucher/rights/common/get-packages-by-package-ids', {
					packageIds: new Array(this.data.listOfPackages[currentIndex]?.rightsPackageId)
				}, 'POST', false);
				console.log('result', result);
				if (result.code === 0) {
					equityListMap.defaultEquityList.push({ index: currentIndex, subData: result.data });
				} else {
					// 占位
					equityListMap.defaultEquityList.push({ index: currentIndex, packageName: '', payMoney: 0 });
				}
			}
			// 判断套餐是否为银行行用卡套餐
			if (this.data.citicBankshopProductIds?.includes(this.data.listOfPackages[currentIndex]?.shopProductId)) {
				equityListMap.bankList.push({ index: currentIndex, isBank: true });
			} else {
				// 占位
				equityListMap.bankList.push({ index: currentIndex, isBank: false });
			}
		}
		this.setData({
			isLoaded: true,
			equityListMap: equityListMap
		});
	},
	// popTipComp组件 触发事件函数
	async confirmHandle (e) {
		let val = e.detail;
		switch (val) {
			case 'cictBank':
				await this.saveOrderInfo();
				break;
			default:
				break;
		}
	},
	// 弹窗详情
	popDetail (e) {
		let type = e.currentTarget.dataset.type;	// string
		let index = e.currentTarget.dataset.index;	// number
		let def = this.data.equityListMap.defaultEquityList[index];
		let service = this.data.equityListMap.serviceEquityList[index];
		console.log('this.data.activeIndex', this.data.activeIndex);
		console.log('this.index.index', index);
		switch (type) {
			case '1':
				this.selectComponent('#cdPopup').show({
					isBtnClose: true,
					argObj: {
						type: 'new_device',
						title: '第五代设备',
						isSplit: index === this.data.activeIndex ? true : this.data.isFade
					}
				});
				break;
			case '2':
				this.selectComponent('#cdPopup').show({
					isBtnClose: true,
					argObj: {
						type: 'default_equity_package',
						title: '加赠权益包',
						bgColor: 'linear-gradient(180deg, #FFF8EE 0%, #FFFFFF 30%,#FFFFFF 100%)',
						isSplit: index === this.data.activeIndex ? true : this.data.isFade,
						equityPackageInfo: service.subData && service.subData.length > 0 ? service.subData.concat(def.subData) : def.subData,
						isMinShen: this.data.listOfPackages[index].shopProductId === '1199301561518923776' // 判断是否为民生套餐
					}
				});
				break;
			case '3':
				this.selectComponent('#cdPopup').show({
					isBtnClose: true,
					argObj: {
						type: 'give_equity_package',
						title: '权益商城',
						bgColor: 'linear-gradient(180deg, #FFF8EE 0%, #FFFFFF 30%,#FFFFFF 100%)',
						isSplit: index === this.data.activeIndex ? true : this.data.isFade
					}
				});
				break;
			case '4':
				this.selectComponent('#cdPopup').show({
					isBtnClose: true,
					argObj: {
						type: this.data.listOfPackages[index].shopProductId === this.data.roadRescueShopProductId ? 'road_rescue1' : 'sign_tt_coupon',
						title: '通通券',
						bgColor: 'linear-gradient(180deg, #FFF8EE 0%, #FFFFFF 30%,#FFFFFF 100%)',
						isSplit: index === this.data.activeIndex ? true : this.data.isFade
					}
				});
				break;
			case '5':
				this.selectComponent('#cdPopup').show({
					isBtnClose: true,
					argObj: {
						type: 'add_equity_package',
						title: '加购权益包',
						isSplit: true,
						bgColor: 'linear-gradient(180deg, #FFF8EE 0%, #FFFFFF 40%,#FFFFFF 100%)',
						equityPackageInfo: this.data.equityListMap.addEquityList[index].subData,
						mustEquity: this.data.listOfPackages[index].mustChoiceRightsPackage,
						aepIndex: this.data.equityListMap.addEquityList[this.data.activeIndex].aepIndex,
						isMinShen: this.data.listOfPackages[index].shopProductId === '1199301561518923776' // 判断是否为民生套餐
					}
				});
				break;
			case '6':
				this.selectComponent('#cdPopup').show({
					isBtnClose: true,
					argObj: {
						type: 'road_rescue',
						title: '下单送500元道路救援服务',
						isSplit: true,
						bgColor: 'linear-gradient(180deg, #FFF8EE 0%, #FFFFFF 40%,#FFFFFF 100%)'
					}
				});
				break;
			default:
				break;
		}
	},
	// 弹窗组件
	cDPopup (e) {
		let choiceIndex = parseInt(e.detail.choiceIndex);
		let equityListMap = this.data.equityListMap;
		equityListMap.addEquityList[this.data.activeIndex].aepIndex = choiceIndex;
		this.setData({ equityListMap });
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
				console.log('address', address);
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
			this.setData({ time: --this.data.time });
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
	// 选择权益
	onClickDetailsHandle (e) {
		this.setData({
			isSelected: false,
			activeEquitiesIndex: e.detail.isSelected ? -1 : this.data.rightsPackageDetails.index
		});
		if (this.data.listOfPackages[this.data.choiceIndex]?.mustChoiceRightsPackage === 1) {
			const index = this.data.rightsAndInterestsList.findIndex(item => item.id === this.data.listOfPackages[0]?.rightsPackageIds[0]);
			if (index !== -1 && this.data.choiceIndex !== -1) {
				this.setData({
					activeEquitiesIndex: index
				});
			}
		}
		this.data.viewRightsAndInterests.switchDisplay(false);
	},
	// 查看权益详情
	showRightsAndInterests (e) {
		if (this.data.isSalesmanOrder) return;
		let index = e.currentTarget.dataset['index'];
		let rightsPackageDetails = this.data.rightsAndInterestsList[index];
		rightsPackageDetails.index = index;
		const isSelected = this.data.activeEquitiesIndex === index;
		this.setData({
			isSelected,
			viewRightsAndInterests: this.selectComponent('#showRightsPackage'),
			rightsPackageDetails
		});
		this.data.viewRightsAndInterests.switchDisplay(true);
	},
	onClickClose () {
		this.data.viewRightsService?.switchDisplay(false);
		this.data.viewLifeService?.switchDisplay(false);
	},
	onClickHandle () {
		this.data.viewRightsAndInterests.switchDisplay(false);
	},
	// 支付
	async marginPayment (pledgeType) {
		if (this.data.isRequest) return;
		this.setData({ isRequest: true });
		util.showLoading();
		let params = {};
		if (pledgeType === 4) {
			// 押金模式
			params = {
				payVersion: 'v3',
				tradeType: 1,
				orderId: app.globalData.orderInfo.orderId,
				openid: app.globalData.openId
			};
		} else {
			// 普通模式
			params = {
				orderId: app.globalData.orderInfo.orderId
			};
		}
		const result = await util.getDataFromServersV2('consumer/order/pledge-pay', params);
		console.log(result);
		if (!result) {
			this.setData({ isRequest: false });
			return;
		}
		if (result.code === 0) {
			let extraData = result.data.extraData;
			wx.requestPayment({
				nonceStr: extraData.nonceStr,
				package: extraData.package,
				paySign: extraData.paySign,
				signType: extraData.signType,
				timeStamp: extraData.timeStamp,
				success: (res) => {
					this.setData({ isRequest: false });
					if (res.errMsg === 'requestPayment:ok') {
						util.go('/pages/empty_hair/processing_progress/processing_progress');
					} else {
						util.showToastNoIcon('支付失败！');
					}
				},
				fail: (res) => {
					this.setData({ isRequest: false });
					if (res.errMsg !== 'requestPayment:fail cancel') {
						util.showToastNoIcon('支付失败！');
					}
				}
			});
		} else {
			this.setData({ isRequest: false });
			util.showToastNoIcon(result.message);
		}
	},
	// 下一步
	async next () {
		this.setData({
			available: false, // 禁用按钮
			isRequest: true // 设置状态为请求中
		});
		let formData = this.data.formData; // 输入信息
		let params = {
			orderId: app.globalData.orderInfo.orderId || '',
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
			let obj1 = this.data.listOfPackages[this.data.choiceIndex];
			if (obj1.mustChoiceRightsPackage === 1 && this.data.equityListMap.addEquityList[this.data.choiceIndex].aepIndex === -1) {
				util.showToastNoIcon('请选择一个权益包');
				return;
			}
			if (obj1.pledgeType === 4) {
				// 判断是否是 权益券额套餐模式 ，如果是再判断以前是否有过办理，如果有则弹窗提示，并且不执行后面流程
				const result = await util.getDataFromServersV2('consumer/order/precharge/list', {
					orderId: app.globalData.orderInfo.orderId // 订单id
				});
				if (!result) return;
				if (result.code === 0) {
					if (result.data.length >= 5) {
						util.alert({
							title: `提示`,
							content: `该套餐目前暂只支持单人办理五台车辆`,
							confirmColor: '#576B95',
							cancelColor: '#000000',
							cancelText: '我知道了',
							confirm: () => {
							},
							cancel: async () => {
							}
						});
						return;
					}
				} else {
					util.showToastNoIcon(result.message);
					return;
				}
			}
			// 银行信用卡 细则提示弹窗
			if (obj1.shopProductId === app.globalData.cictBankObj.citicBankShopshopProductId || obj1.shopProductId === app.globalData.cictBankObj.cictBankNmPlatinumCard || obj1.shopProductId === app.globalData.cictBankObj.minshenBank || obj1.shopProductId === app.globalData.cictBankObj.guangfaBank) {
				// let subType = obj1.shopProductId === app.globalData.cictBankObj.citicBankShopshopProductId ? 1 : obj1.shopProductId === app.globalData.cictBankObj.cictBankNmPlatinumCard ? 2 : 3;
				let subType = 0; // subType 1-中信 2-中信内蒙 3-民生 4-广发
				switch (obj1.shopProductId) {
					case app.globalData.cictBankObj.citicBankShopshopProductId:
						subType = 1; break;
					case app.globalData.cictBankObj.cictBankNmPlatinumCard:
						subType = 2; break;
					case app.globalData.cictBankObj.minshenBank:
						subType = 3; break;
					case app.globalData.cictBankObj.guangfaBank:
						subType = 4; break;
					default:
						break;
				}
				this.selectComponent('#popTipComp').show({
					type: 'five',
					title: '活动细则',
					btnCancel: '我再想想',
					btnconfirm: '我知道了',
					subType: subType
				});
				return;
			}
			if (obj1.mustChoiceRightsPackage === 0 && this.data.rightsAndInterestsList?.length) {
				// 不必选权益 有权益包 未选中权益包
				util.alert({
					title: `优惠提醒`,
					content: `73%的用户都选择加购券权益，你确定要放弃吗？`,
					showCancel: true,
					confirmColor: '#576B95',
					cancelColor: '#000000',
					cancelText: '确认放弃',
					confirmText: '我再看看',
					confirm: () => {
					},
					cancel: async () => {
						await this.saveOrderInfo();
					}
				});
				return;
			}
			// 绑定套餐 保存订单
			await this.saveOrderInfo();
		} else if (result.code === 301) { // 已存在当前车牌未完成订单
			// if (result.data.shopProductId === '0') { // 已经绑定了套餐 去订单列表支付
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
			// }
			// 绑定套餐 保存订单
			// await this.saveOrderInfo();
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
			if (value.substring(0, 1) !== '1' || value.substring(1, 2) === '0') {
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
		this.fangDou('', 500);
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
	// 提交订单绑定套餐
	async saveOrderInfo () {
		wx.uma.trackEvent('package_the_rights_and_interests_next');
		const res = await util.getDataFromServersV2('consumer/order/after-sale-record/addProtocolRecord', {
			orderId: app.globalData.orderInfo.orderId // 订单id
		});
		if (!res) return;
		this.setData({ isRequest: false });
		let addEquity = this.data.equityListMap.addEquityList[this.data.choiceIndex];	// 加购权益包
		let params = {
			orderId: app.globalData.orderInfo.orderId, // 订单id
			shopId: this.data.listOfPackages[this.data.choiceIndex].shopId || app.globalData.otherPlatformsServiceProvidersId, // 商户id
			dataType: '3', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:微信实名信息，5:获取银行卡信息，6:行驶证信息，7:车头照，8:车主身份证信息, 9-营业执照
			dataComplete: 0, // 订单资料是否已完善 1-是，0-否
			shopProductId: this.data.listOfPackages[this.data.choiceIndex].shopProductId,
			rightsPackageId: addEquity.aepIndex !== -1 ? addEquity.subData[addEquity.aepIndex].id : '',
			areaCode: app.globalData.newPackagePageData?.areaCode || '0'
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({ isRequest: false });
		if (!result) return;
		if (result.code === 0) {
			if (this.data.listOfPackages[this.data.choiceIndex]?.pledgePrice || addEquity.aepIndex !== -1) {
				await this.marginPayment(this.data.listOfPackages[this.data.choiceIndex].pledgeType);
				return;
			}
			// 新版小程序空发 无需支付
			util.go('/pages/empty_hair/processing_progress/processing_progress');
		} else {
			util.showToastNoIcon(result.message);
		}
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
			return util.showToastNoIcon('请检查并填写相关信息');
		}
		if (!this.data.getAgreement) {
			util.showToastNoIcon('请同意并勾选协议！');
			return;
		}
		util.showLoading();
		if (this.data.hasVeh) {
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
		} else {
			this.next();
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
