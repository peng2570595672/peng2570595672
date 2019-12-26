// 是否为测试 TODO
const IS_TEST = true;
const util = require('./utils/util.js');
App({
	globalData: {
		host: IS_TEST ? 'https://etctest.cyzl.com/etc2-client' : 'https://etc.cyzl.com', // 接口主机地址 正式 etc.cyzl.com/ 测试 etctest.cyzl.com/
		uploadOcrUrl: 'https://file.cyzl.com/file/upload-ocr', // 上传图片需要识别地址
		uploadUrl: 'https://file.cyzl.com/file/upload', // 上传图片无需审核地址
		plamKey: '123456', // 签名用到的key --- 二发
		mapKey: '4EYBZ-L6QC4-NCLUW-XFDUD-TANS7-DZFNG', // 腾讯地图所使用key
		platformId: '123456789012345678', // 平台id
		SDKVersion: '',// 小程序基础库版本
		mobilePhoneMode: 0, // 0 适配iphone 678系列 1 iphone x 2 1080 3 最新全面屏
		quality: 80,
		userInfo: {},// 用户信息
		serverInfoId: '',
		orderInfo: {
			orderId: ''
		}
	},
	onLaunch (options) {
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
	}
});
