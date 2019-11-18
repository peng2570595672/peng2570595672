// 是否为测试 TODO
const IS_TEST = false;
const util = require('./utils/util.js');
App({
	globalData: {
		host: IS_TEST ? 'https://etctest.cyzl.com/' : 'https://etc.cyzl.com/', // 接口主机地址 正式 etc.cyzl.com/ 测试 etctest.cyzl.com/
		uploadOcrUrl: 'https://file.cyzl.com/file/upload-ocr', // 上传图片需要识别地址
		uploadUrl: 'https://file.cyzl.com/file/upload', // 上传图片无需审核地址
		plamKey: '7cbadfb0cb144733b866239b7adbca8c', // 签名用到的key --- 二发
		plamSelfKey: '62638495b4f44a2e8c043bd43c771112', // 签名用到的key 暂时无用
		platformId: '', // 平台id
		SDKVersion: '',// 小程序基础库版本
		userInfo: {},
		orderId: '', // 二发时所用
		memberId: '', // 二发时所用
		token: '',// 二发时所用
		quality: 80,
		finishCount: 0,
		openId: '',
		serverInfoId: '',
		channel: '',
		fromMiniProgram: false
	},
	onLaunch (options) {
		util.setApp(this);
		// 获取是否为iphone x系列
		wx.getSystemInfo({
			success: (res) => {
				this.globalData.SDKVersion = res.SDKVersion;
			}
		});
		// 获取其他小程序跳转过来携带的参数  platformId  orderId  memberId  token serverInfoId，channel
		let extra = options.referrerInfo.extraData;
		if (extra) {
			let keys = Object.keys(extra);
			if (keys.length === 5) {
				for (let key of keys) {
					this.globalData[key] = extra[key];
				}
				this.globalData.fromMiniProgram = true;
			} else {
				util.alert({
					title: '错误提示',
					content: '参数错误，所需参数：platformId、orderId、memberId、token、serverInfoId、channel'
				});
			}
		}
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
	onShow () {

	}
});
