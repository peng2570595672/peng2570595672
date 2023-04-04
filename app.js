// 是否为测试 TODO
export const IS_TEST = true; // false为正式接口地址，true为测试接口地址
const util = require('./utils/util.js');
const uma = require('./utils/umtrack-wx.js');
App({
	umengConfig: {
		appKey: '603c8fc86ee47d382b6a91da', // 由友盟分配的APP_KEY
		// 使用Openid进行统计，此项为false时将使用友盟+uuid进行用户统计。
		// 使用Openid来统计微信小程序的用户，会使统计的指标更为准确，对系统准确性要求高的应用推荐使用Openid。
		useOpenid: true,
		// 使用openid进行统计时，是否授权友盟自动获取Openid，
		// 如若需要，请到友盟后台"设置管理-应用信息"(https://mp.umeng.com/setting/appset)中设置appId及secret
		autoGetOpenid: true,
		debug: false, // 是否打开调试模式
		uploadUserInfo: true, // 自动上传用户信息，设为false取消上传，默认为false
		enableVerify: true
	},
	globalData: {
		uma,
		host: IS_TEST ? 'https://etctest.cyzl.com/etc2-client' : 'https://etc.cyzl.com', // 接口主机地址 正式 etc.cyzl.com/ 测试 etctest.cyzl.com/
		test: IS_TEST, // 是否为测试
		// uploadOcrUrl: IS_TEST ? 'https://etctest.cyzl.com/file-service/file/upload-ocr' : 'https://file.cyzl.com/file/upload-ocr', // 上传图片需要识别地址
		uploadOcrUrl: 'https://file.cyzl.com/file/upload-ocr', // 上传图片需要识别地址
		uploadUrl: 'https://file.cyzl.com/file/upload', // 上传图片无需审核地址
		plamKey: '123456', // 签名用到的key --- 二发
		mapKey: '2PEBZ-EJKKX-V624T-Z4MH6-LVHUS-D6BNM', // 腾讯地图所使用key
		platformId: '500338116821778434', // 平台id
		miniProgramServiceProvidersId: '611607716116299776', // 主流程小程序服务商id 用于加载不同套餐
		otherPlatformsServiceProvidersId: undefined, // 其他入口/其他平台服务商id 用于加载不同套餐
		salesmanMerchant: undefined, // 业务员商户
		scanCodeToHandle: undefined,// 扫描小程序码办理
		isServiceProvidersPackage: true, // 其他平台服务商过来办理是否有套餐 默认有
		isThirdGeneralize: false, // 第三方扫码办理
		isCitiesServices: false, // 从城市服务进入
		isWeChatSudoku: false, // 从微信九宫格进入(微信--生活缴费--ETC办理)
		isContinentInsurance: false, // 是否是大地保险 用来屏蔽微保
		isToastAgreement: true,
		isPingAn: false, // 是否是平安 用来屏蔽微保
		isJinYiXing: false, // 是否是津易行办理
		belongToPlatform: '500338116821778434', // 套餐所属平台id,用于判断流程
		salesmanScanCodeToHandleId: undefined,// 业务员扫描小程序码办理订单ID
		isSalesmanPromotion: false,// 业务员扫描小程序码推广办理
		isSignUpImmediately: false,// 是否是首页或我的ETC列表点击立即签约,是则需要直接查主库
		isHighSpeedTraffic: undefined,// 是否是高速通行公众号进入办理
		isHighSpeedTrafficActivity: false,// 是否是高速通行活动进入办理
		systemTime: undefined,// 系统时间
		isSecondSigning: false,// 是否二次签约
		isSecondSigningInformationPerfect: false,// 是否二次签约-资料完善
		otherEntrance: {
			isPayH5Signing: false,// 是否是付费h5签约
			isUnicom: false// 是否是联通归属转化
		},
		isSystemTime: false,// 是否是通过接口获取过系统时间
		isSalesmanOrder: false,// 是否是业务员审核订单
		officialChannel: false,// 是否是公众号渠道引流
		SDKVersion: '',// 小程序基础库版本
		capsule: '', // 胶囊
		statusBarHeight: 0,
		mobilePhoneMode: 0, // 0 适配iphone 678系列 1 iphone x 2 1080 3 最新全面屏
		mobilePhoneSystem: false, // false非ios     true:ios
		firstVersionData: false, // 是否是1.0数据
		isModifiedData: false, // 是否是修改资料 是则需要上传车主身份证
		isFaceToFaceCCB: false, // 是否是面对面建行活动
		isFaceToFaceICBC: false, // 是否是面对面工行活动
		isFaceToFaceWeChat: false, // 是否是面对面微信活动
		isToMicroInsurancePromote: false, // 是否是微保推广
		isTelemarketing: false, // 是否是电销模式
		faceToFacePromotionId: undefined, // 面对面推广ID
		activitiesOfDrainage: false, // 活动引流
		activityUrl: undefined, // 活动地址
		rechargeCode: undefined, // 业务员办理激活扫码进入充值
		billingDetails: undefined, // 账单详情(总对总)
		splitDetails: undefined, // 账单详情(拆分账单)
		quality: 80,
		isChannelPromotion: 0,// 渠道推广参数
		signAContract: 3,// -1正常签约  1  解约重签  4 货车签约管理页签约
		signTongTongQuanAContract: 0,// 0 未签约  1 去签约 2解约重签
		userInfo: {},// 用户信息
		navbarHeight: 0,
		processFlowVersion: 0,// 流程版本
		memberStatusInfo: {},// 用户交行信息
		membershipCoupon: {},// 会员券带参进入
		ownerServiceArrearsList: [],// 车主服务欠费列表
		serverInfoId: '',
		accountChannelInfo: {},// 账户渠道-用于圈存跳转不同账户
		truckLicensePlate: '',// 货车车牌
		memberId: '',// 用户id,用于京东客服
		mobilePhone: '',// 用户手机用于京东客服
		openId: '',// 用于查签约/解约
		shopProductId: '', // 套餐id
		contractStatus: '', // 签约状态   签约状态 -1 签约失败 0发起签约 1已签约 2解约
		orderStatus: '', // 订单状态
		isHeadImg: true, // 是否上传车头照
		serviceCardVoucherDetails: undefined, // 卡券详情
		crowdsourcingUserInfo: undefined, // 众包用户信息
		screenWindowAttribute: undefined, // 屏幕属性
		crowdsourcingShopMsg: undefined, // 众包信息
		crowdsourcingPromotionId: undefined, // 众包推广ID
		isCrowdsourcingPromote: false, // 是不是众包推广
		MTCChannel: false, // 是不是MTC推广
		isCheckCarChargeType: false, // 是否需要校检黔通车型
		crowdsourcingServiceProvidersId: undefined, // 众包服务商id 用于加载不同套餐
		rightsPackageBuyRecords: undefined, // 权益购买记录
		myEtcList: {}, // 车辆列表
		accountList: [], // 权益列表
		packagePageData: undefined, // 套餐页面数据
		orderInfo: {
			orderId: ''
		},
		truckHandlingOCRType: 0,// 货车办理选择ocr上传类型
		handlingOCRType: 0,// 客车办理选择ocr上传类型
		isTruckHandling: false,// 是否新流程-货车办理
		isNeedReturnHome: false,// 是否需要返回首页
		isArrearageData: {
			isPayment: false,// 是否补缴
			isTrucksPayment: false,// 是否货车补缴
			trucksOrderList: [],// 货车订单
			etcMoney: 0, // 欠费金额
			etcTrucksMoney: 0 // 货车欠费金额
		},// 欠费数据
		newPackagePageData: {}, // 新套餐页面数据
		bankCardInfo: {}, // 二类户信息
		weiBoUrl: IS_TEST ? '/pages/base/redirect/index?routeKey=CAR_WEBVIEW&url=https://static-dsu.wesure.cn/uatapp/app2/h5-reserve-ad/vendors&query=' : '/pages/base/redirect/index?routeKey=CAR_WEBVIEW&url=https://static.wesure.cn/app2/h5-reserve-ad/vendors&query=',
		disclaimerDesc: {
			// 免责弹窗
			title: '免责声明',
			content: '您即将通过该链接跳转至第三方页面。在第三方页面中提交信息将由第三方按照其相关用户服务协议及隐私协议正常执行并负责，服务及责任均由第三方提供或承担，如有疑问请致电第三方客服电话。',
			confirm: '我知道了'
		},
		isEquityRights: undefined,	//	权益券额套餐的用户： true表示是，false表示不是
		isVip: undefined,	// 收取综合服务费的用户：  true表示是，false表示不是
		handledByTelephone: undefined,	// 4.0办理人的电话
		newEnergy: false,	// false 表示不是新能源车牌
		citicBankShopId: IS_TEST ? '1091000458138361856' : '',	// 中信银行套餐的商户ID 分别是测试环境下和正式环境下
		citicBankShopshopProductId: IS_TEST ? '1091001046012010496' : '',	// 中信银行里的白金套餐的套餐ID 分别是测试环境下和正式环境下
		citicBankRightId: IS_TEST ? '1092482405515665408' : ''	// 中信银行签约后独立权益ID
	},
	onLaunch (options) {
		// 统计逻辑结束
		util.setApp(this);
		// 获取是否为iphone x系列
		wx.getSystemInfo({
			success: (res) => {
				this.globalData.capsule = wx.getMenuButtonBoundingClientRect();
				this.globalData.screenWindowAttribute = res;
				this.globalData.SDKVersion = res.SDKVersion;
				this.globalData.statusBarHeight = res.statusBarHeight;
				this.globalData.mobilePhoneSystem = res.system.indexOf('iOS') !== -1 ? true : false;
				this.globalData.navbarHeight = (this.globalData.capsule.top - this.globalData.statusBarHeight) * 2 + this.globalData.capsule.height + this.globalData.statusBarHeight;
				if (res.model.toLowerCase().search('iphone x') !== -1) {
					this.globalData.mobilePhoneMode = 1;
				} else if (res.model.toLowerCase().search('iphone') !== -1) {
					this.globalData.mobilePhoneMode = 0; // iphone 678
				} else if (!res.windowWidth * res.pixelRatio === 1080) {
					this.globalData.mobilePhoneMode = 2; // 1080
				} else {
					this.globalData.mobilePhoneMode = 3; // 安卓全面屏
				}
			}
		});
		// 检测更新
		this.checkUpdate();
	},
	// 将url路径转成json a=1&=2 => {a: 1,b: 2}
	path2json (scene) {
		let arr = scene.split('&');
		let obj = {};
		let temp;
		for (let i = 0; i < arr.length; i++) {
			temp = arr[i].split('=');
			if (temp.length > 1) {
				obj[temp[0]] = temp[1];
			}
		}
		return obj;
	},
	// 初始化数据
	initData (options) {
		console.log(options);
		// 扫码 长按识别 相册选取进入拿到分享二维码人的id
		if (options.scene === 1047 || options.scene === 1048 || options.scene === 1049 || options.scene === 1017) {
			let obj = this.path2json(decodeURIComponent(options.query.scene));
			if (obj && JSON.stringify(obj) !== '{}') {
				if (obj.orderId && (obj.orderId.length === 18 || obj.orderId.length === 19)) {
					util.resetData();// 重置数据
					// 业务员端订单码
					this.globalData.salesmanScanCodeToHandleId = obj.orderId;
				} else {
					util.resetData();// 重置数据
					let sceneKey,sceneValue;
					for (let i in obj) {
						sceneKey = i;
						sceneValue = obj[i];
					}
					if (sceneKey === 'MCS') {
						this.globalData.crowdsourcingShopMsg = sceneValue;
					} else if (sceneKey === 'BSCS') {
						this.globalData.rechargeCode = sceneValue;
					} else {
						this.getPromoterInfo(sceneKey,sceneValue);
					}
				}
			}
		}
		if (options.query.channelValue && options.query.serverInfoId) {
			util.resetData();// 重置数据
			// 1.0大地保险扫码/链接进入
			this.globalData.isContinentInsurance = true;
			let sceneValue = JSON.stringify(options.query);
			this.getPromoterInfo('channelValue',sceneValue);
		}
		if (options.query.officialChannelId) {
			util.resetData();// 重置数据
			this.globalData.otherPlatformsServiceProvidersId = options.query.officialChannelId;
			this.globalData.officialChannel = true;
		}
		if (options.query.MTCChannel) {
			util.resetData();// 重置数据
			this.globalData.MTCChannel = true;
		}
		if (options.query.carInsurance) {
			util.resetData();// 重置数据
			// 2.0大地保险链接进入
			this.globalData.isContinentInsurance = true;
			this.getPromoterInfo('SGC',options.query.carInsurance);
		}
	},
	// 根据扫描获取到的二维码信息获取推广参数
	getPromoterInfo (sceneKey,sceneValue) {
		// 场景key，二维码scene的格式为sceneKey=sceneValue
		// 可选值： shareId，tmpId，shareTmp，SGC，SUC
		// 特殊情况：在大地的二维码中,格式为：{channelValue:xxx,serverInfoId:xxx},sceneKey为channelValue，sceneValue为：{channelValue:xxx,serverInfoId:xxx}JSON字符串
		util.getDataFromServer('consumer/system/common/get-promoter-info', {
			sceneKey: sceneKey,
			sceneValue: sceneValue // 场景value
		}, () => {
			util.hideLoading();
		}, (res) => {
			if (res.code === 0) {
				if (res.data.codeType === 1) {
					// 2.0大地保险
					this.globalData.isContinentInsurance = true;
				}
				if (res.data.shopId) {
					this.globalData.otherPlatformsServiceProvidersId = res.data.shopId;
				}
				if (res.data.thirdGeneralizeNo) {
					this.globalData.isThirdGeneralize = true;
				}
				this.globalData.scanCodeToHandle = res.data;
				if (res.data.hasOwnProperty('isCrowdsourcing')) {
					wx.reLaunch({
						url: '/pages/default/receiving_address/receiving_address'
					});
				}
			} else {
				util.hideLoading();
			}
		});
	},
	checkUpdate () {
		// getUpdateManager 微信版本是否支持
		if (!wx.canIUse('getUpdateManager')) {
			return;
		}
		let updateManager = wx.getUpdateManager();
		updateManager.onCheckForUpdate((res) => {
			// 有更新
			if (res.hasUpdate) {
				// 下载好后回调
				updateManager.onUpdateReady(() => {
					util.alert({
						title: '更新提示',
						content: '新版本已经准备好，是否重启应用？',
						confirmText: '重启',
						confirm: () => {
							// 新的版本已经下载好，调用 applyUpdate 应用新版本并重启
							updateManager.applyUpdate();
						}
					});
				});
			}
		});
	},
	onShow (res) {
		// 初始化数据
		this.initData(res);
		if (res.path === 'pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license' ||
			res.path === 'pages/default/shot_bank_card/shot_bank_card' ||
			res.path === 'pages/default/information_validation/information_validation'
		) {
			// 解决安卓平台上传行驶证自动返回上一页
			return;
		}
		if ((res && res.referrerInfo && res.referrerInfo.appId && (res.referrerInfo.appId === 'wxbcad394b3d99dac9' || res.referrerInfo.appId === 'wxbd687630cd02ce1d')) ||
			(res && res.scene === 1038)) { // 场景值1038：从被打开的小程序返回
			// 因微信场景值问题,故未用场景值判断
			console.log('this.globalData.signAContract');
			console.log(this.globalData.signAContract);
			if (res.path === 'pages/default/citic_bank_sign/citic_bank_sign') {
				return;
			}
			const {appId} = res.referrerInfo;
			if (this.globalData.signAContract === -1) {
				// 车主服务签约
				if (appId === 'wxbcad394b3d99dac9' || appId === 'wxbd687630cd02ce1d') {
					if (res.path === 'pages/default/package_the_rights_and_interests/package_the_rights_and_interests') {
						if (this.globalData.isTelemarketing || this.globalData.isSalesmanOrder) {
						} else {
							return;
						}
					}
					this.globalData.isTruckHandling ? util.queryContractForTruckHandling() : this.queryContract(appId);
				}
			} else if (this.globalData.signAContract === 1) {
				// 解约状态
				if (res.path === 'pages/default/package_the_rights_and_interests/package_the_rights_and_interests') {
					if (this.globalData.isTelemarketing || this.globalData.isSalesmanOrder) {
					} else {
						return;
					}
				}
				this.globalData.isTruckHandling ? util.queryContractForTruckHandling() : this.queryContract(appId);
			}
		}
		if (res && res.scene === 1038 && res.referrerInfo.appId === 'wxbd687630cd02ce1d') {
			// 解约重签通通券
			if (res.path === 'pages/default/package_the_rights_and_interests/package_the_rights_and_interests') {
				return;
			}
			this.getOrderInfo();
		}
	},
	async getOrderInfo () {
		const result = await util.getDataFromServersV2('consumer/order/get-order-info', {
			orderId: this.globalData.orderInfo.orderId,
			dataType: '3'
		});
		if (!result) return;
		if (result.code === 0) {
			this.globalData.signTongTongQuanAContract = 0;
			if (result.data.product?.ttContractStatus === 1) {
				util.showToastNoIcon('签约成功');
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 查询车主服务签约
	queryContract (appId) {
		util.showLoading({
			title: '签约查询中...'
		});
		util.getDataFromServer('consumer/order/query-contract', {
			orderId: this.globalData.orderInfo.orderId,
			immediately: true
		}, () => {
			util.hideLoading();
		}, async (res) => {
			util.hideLoading();
			if (res.code === 0) {
				this.globalData.signAContract = 3;
				this.globalData.isSalesmanOrder = false;
				this.globalData.isTelemarketing = false;
				// 签约成功 userState: "NORMAL"
				if (res.data.contractStatus === 1 && res.data.userState === 'NORMAL') {
					console.log('this.globalData.isCheckCarChargeType');
					console.log(this.globalData.isCheckCarChargeType);
					if (this.globalData.isCheckCarChargeType) {
						await this.brandChargingModel();
					}
					if (this.globalData.signAContract === 1) {
						this.globalData.signAContract = 3;
						wx.switchTab({
							url: '/pages/Home/Home'
						});
						return;
					}
					// 办理付费h5
					if (this.globalData.otherEntrance.isPayH5Signing) {
						this.globalData.otherEntrance.isPayH5Signing = false;
						wx.reLaunch({
							url: '/pages/pay_h5/signed_successfully/signed_successfully'
						});
						return;
					}
					// 办理联通转化
					if (this.globalData.otherEntrance.isUnicom) {
						this.globalData.otherEntrance.isUnicom = false;
						wx.reLaunch({
							url: '/pages/unicom/signed_successfully/signed_successfully'
						});
						return;
					}
					if (this.globalData.isSecondSigning) {
						this.globalData.isSecondSigning = false;
						util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${this.globalData.orderInfo.orderId}`);
						return;
					}
					if (this.globalData.isSecondSigningInformationPerfect) {
						this.globalData.isSecondSigningInformationPerfect = false;// 是否二次签约-资料完善
						this.globalData.isTruckHandling = false;// 是否新流程-货车办理
						util.go(`/pages/default/processing_progress/processing_progress?orderId=${this.globalData.orderInfo.orderId}`);
						return;
					}
					// 是否是津易行办理
					if (this.globalData.isJinYiXing) {
						wx.navigateBackMiniProgram({
							extraData: {
								state: 'succeed'
							}
						});
					} else {
						util.go(`/pages/default/processing_progress/processing_progress?orderId=${this.globalData.orderInfo.orderId}`);
					}
				} else {
					util.showToastNoIcon('未签约成功！');
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, this.globalData.userInfo.accessToken);
	},
	// 车辆品牌收费车型校验
	async brandChargingModel () {
		console.log('车辆品牌收费车型校验');
		await util.getDataFromServersV2('consumer/etc/qtzl/checkCarChargeType', {
			orderId: this.globalData.orderInfo.orderId
		});
	}

});
