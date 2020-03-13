// 是否为测试 TODO
const IS_TEST = true;
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
		platformId: '123456789012345678', // 平台id
		belongToPlatform: '123456789012345678', // 套餐所属平台id,用于判断流程
		SDKVersion: '',// 小程序基础库版本
		mobilePhoneMode: 0, // 0 适配iphone 678系列 1 iphone x 2 1080 3 最新全面屏
		quality: 80,
		userInfo: {},// 用户信息
		serverInfoId: '',
		shopProductId: '', // 套餐id
		isHeadImg: true, // 是否上传车头照
		myEtcList: {}, // 车辆列表
		orderInfo: {
			orderId: ''
		}
	},
	onLaunch (options) {
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
		console.log(res);
		if (res.path === 'pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license'
			|| res.path === 'pages/default/shot_bank_card/shot_bank_card'
			|| res.path === 'pages/default/information_validation/information_validation'
		) {
			// 解决安卓平台上传行驶证自动返回上一页
			return;
		}
		if (res && res.scene === 1038 && this.globalData.signAContract !== -1) { // 场景值1038：从被打开的小程序返回
			const {appId} = res.referrerInfo;
			// 车主服务签约
			if (appId === 'wxbcad394b3d99dac9') {
				this.queryContract();
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
				// 签约成功 userState: "NORMAL"
				if (res.data.contractStatus === 1 && res.data.userState === 'NORMAL') {
					if (this.globalData.belongToPlatform === this.globalData.platformId) {
						// 本本台签约
						util.go('/pages/default/signed_successfully/signed_successfully');
					} else {
					// 	// 其他平台签约 :业务员端/h5
						util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${this.globalData.orderInfo.orderId}`);
					}
				} else {
					util.showToastNoIcon('暂未查到签约信息，请稍后再试！');
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, this.globalData.userInfo.accessToken);
	}
});
