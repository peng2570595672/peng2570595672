// 是否为测试 TODO
const IS_TEST = true;
const util = require('./utils/util.js');
App({
	globalData: {
		host: IS_TEST ? 'http://129.204.11.115:8700' : 'https://etc.cyzl.com', // 接口主机地址 正式 etc.cyzl.com/ 测试 etctest.cyzl.com/
		uploadOcrUrl: 'https://file.cyzl.com/file/upload-ocr', // 上传图片需要识别地址
		uploadUrl: 'https://file.cyzl.com/file/upload', // 上传图片无需审核地址
		plamKey: '123456', // 签名用到的key --- 二发
		mapKey: '4EYBZ-L6QC4-NCLUW-XFDUD-TANS7-DZFNG', // 腾讯地图所使用key
		platformId: '123456789012345678', // 平台id
		SDKVersion: '',// 小程序基础库版本
		pixelRatio: 2,
		screenWidth: 750,
		quality: 80,
		userInfo: {},// 用户信息
		serverInfoId: ''
	},
	onLaunch (options) {
		util.setApp(this);
		// 获取是否为iphone x系列
		wx.getSystemInfo({
			success: (res) => {
				console.log(res);
				this.globalData.SDKVersion = res.SDKVersion;
				this.globalData.pixelRatio = res.pixelRatio;
				this.globalData.screenWidth = res.screenWidth;
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
