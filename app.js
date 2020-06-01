// 是否为测试 TODO
const IS_TEST = false;
const util = require('./utils/util.js');
// 数据统计
let mta = require('./libs/mta_analysis.js');
App({
	globalData: {
		host: IS_TEST ? 'https://etctest.cyzl.com/etc2-client' : 'https://etc.cyzl.com', // 接口主机地址 正式 etc.cyzl.com/ 测试 etctest.cyzl.com/
		uploadOcrUrl: 'https://file.cyzl.com/file/upload-ocr', // 上传图片需要识别地址
		uploadUrl: 'https://file.cyzl.com/file/upload', // 上传图片无需审核地址
		plamKey: '123456', // 签名用到的key --- 二发
		mapKey: '4EYBZ-L6QC4-NCLUW-XFDUD-TANS7-DZFNG', // 腾讯地图所使用key
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
		isJinYiXing: false, // 是否是津易行办理
		belongToPlatform: '500338116821778434', // 套餐所属平台id,用于判断流程
		salesmanScanCodeToHandleId: undefined,// 业务员扫描小程序码办理订单ID
		isSalesmanPromotion: false,// 业务员扫描小程序码推广办理
		isSignUpImmediately: false,// 是否是首页或我的ETC列表点击立即签约,是则需要直接查主库
		isHighSpeedTraffic: undefined,// 是否是高速通行公众号进入办理
		isHighSpeedTrafficActivity: false,// 是否是高速通行活动进入办理
		systemTime: undefined,// 系统时间
		isSystemTime: false,// 是否是通过接口获取过系统时间
		isSalesmanOrder: false,// 是否是业务员审核订单
		officialChannel: false,// 是否是公众号渠道引流
		SDKVersion: '',// 小程序基础库版本
		mobilePhoneMode: 0, // 0 适配iphone 678系列 1 iphone x 2 1080 3 最新全面屏
		mobilePhoneSystem: false, // false非ios     true:ios
		firstVersionData: false, // 是否是1.0数据
		isModifiedData: false, // 是否是修改资料 是则需要上传车主身份证
		isFaceToFaceCCB: false, // 是否是面对面建行活动
		isFaceToFaceICBC: false, // 是否是面对面工行活动
		isFaceToFaceWeChat: false, // 是否是面对面微信活动
		isToMicroInsurancePromote: false, // 是否是微保推广
		faceToFacePromotionId: undefined, // 面对面推广ID
		quality: 80,
		signAContract: 3,// -1正常签约  1  解约重签
		userInfo: {},// 用户信息
		membershipCoupon: {},// 会员券带参进入
		ownerServiceArrearsList: [],// 车主服务欠费列表
		serverInfoId: '',
		memberId: '',// 用户id,用于京东客服
		mobilePhone: '',// 用户手机用于京东客服
		openId: '',// 用于查签约/解约
		shopProductId: '', // 套餐id
		contractStatus: '', // 签约状态   签约状态 -1 签约失败 0发起签约 1已签约 2解约
		orderStatus: '', // 订单状态
		isHeadImg: true, // 是否上传车头照
		myEtcList: {}, // 车辆列表
		orderInfo: {
			orderId: ''
		}
	},
	onLaunch (options) {
		console.log(options);
		// 统计逻辑开始
		mta.App.init({
			'appID': '500710698',
			'eventID': '500710700',
			'autoReport': true,// 每个页面自动上报
			'statParam': false,
			'ignoreParams': [],
			'lauchOpts': options
		});
		// 统计逻辑结束
		util.setApp(this);
		// 获取是否为iphone x系列
		wx.getSystemInfo({
			success: (res) => {
				console.log(res);
				this.globalData.SDKVersion = res.SDKVersion;
				this.globalData.mobilePhoneSystem = res.system.indexOf('iOS') !== -1 ? true : false;
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
		// 扫码 长按识别 相册选取进入拿到分享二维码人的id
		if (options.scene === 1047 || options.scene === 1048 || options.scene === 1049) {
			let obj = this.path2json(decodeURIComponent(options.query.scene));
			if (obj && JSON.stringify(obj) !== '{}') {
				if (obj.orderId && obj.orderId.length === 18) {
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
					this.getPromoterInfo(sceneKey,sceneValue);
				}
			} else {
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
		console.log(res);
		if (res.path === 'pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license' ||
			res.path === 'pages/default/shot_bank_card/shot_bank_card' ||
			res.path === 'pages/default/information_validation/information_validation'
		) {
			// 解决安卓平台上传行驶证自动返回上一页
			return;
		}
		if ((res && res.referrerInfo && res.referrerInfo.appId && res.referrerInfo.appId === 'wxbcad394b3d99dac9') || (res && res.scene === 1038)) { // 场景值1038：从被打开的小程序返回
			// 因微信场景值问题,故未用场景值判断
			if (this.globalData.signAContract === -1) {
				const {appId} = res.referrerInfo;
				// 车主服务签约
				if (appId === 'wxbcad394b3d99dac9') {
					this.queryContract();
				}
			} else if (this.globalData.signAContract === 1) {
				// 解约状态
				this.globalData.signAContract = 3;
				wx.reLaunch({
					// url: '/pages/default/index/index'
					url: '/pages/Home/Home'
				});
			}
		}
	},
	// 查询车主服务签约
	queryContract () {
		util.showLoading({
			title: '签约查询中...'
		});
		util.getDataFromServer('consumer/order/query-contract', {
			orderId: this.globalData.orderInfo.orderId
		}, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				this.globalData.signAContract = 3;
				// 签约成功 userState: "NORMAL"
				if (res.data.contractStatus === 1 && res.data.userState === 'NORMAL') {
					// 是否是津易行办理
					if (this.globalData.isJinYiXing) {
						wx.navigateBackMiniProgram({
							extraData: {
								state: 'succeed'
							}
						});
					} else if (this.globalData.belongToPlatform === this.globalData.platformId) {
						// 本平台签约
						// if (this.globalData.contractStatus === 2) { // 已解约   之前的逻辑
						// 	if (this.globalData.orderStatus === 5 || this.globalData.orderStatus === 8) {// 资料审核失败 &&高速验证不通过
						// 		util.go(`/pages/default/information_validation/information_validation?orderId=${this.globalData.orderInfo.orderId}`);
						// 	} else if (this.globalData.orderStatus === 3) { // 办理中 未上传行驶证
						// 		util.go('/pages/default/signed_successfully/signed_successfully');
						// 	} else { // 不可修改资料
						// 		util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${this.globalData.orderInfo.orderId}`);
						// 	}
						// } else {
						// 	util.go('/pages/default/signed_successfully/signed_successfully');
						// }
						util.go('/pages/default/signed_successfully/signed_successfully');
					} else {
						// 其他平台签约 :业务员端/h5
						if (this.globalData.isSalesmanOrder) {
							util.go(`/pages/default/processing_progress/processing_progress?orderId=${this.globalData.orderInfo.orderId}`);
						} else {
							util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${this.globalData.orderInfo.orderId}`);
						}
					}
				} else {
					util.showToastNoIcon('未签约成功！');
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, this.globalData.userInfo.accessToken);
	}
});
