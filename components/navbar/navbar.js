import { goHome } from '../../utils/util';
const app = getApp();
Component({
	properties: {
		title: {
			type: String,
			value: ''
		},
		background: {
			type: String,
			value: '#1296db'
		},
		isShowArrow: {
			type: Boolean,
			value: false
		},
		list: {
			type: Array,
			value: []
		}
	},
	data: {
		capsuleTop: '',
		capsuleHeight: '',
		navbarHeight: ''
	},
	attached () {
		if (!app.globalData.capsule?.top) {
			wx.getSystemInfo({
				success: (res) => {
					app.globalData.capsule = wx.getMenuButtonBoundingClientRect();
					app.globalData.screenWindowAttribute = res;
					app.globalData.SDKVersion = res.SDKVersion;
					app.globalData.statusBarHeight = res.statusBarHeight;
					app.globalData.mobilePhoneSystem = res.system.indexOf('iOS') !== -1 ? true : false;
					app.globalData.navbarHeight = (app.globalData.capsule.top - app.globalData.statusBarHeight) * 2 + app.globalData.capsule.height + app.globalData.statusBarHeight;
					if (res.model.toLowerCase().search('iphone x') !== -1) {
						app.globalData.mobilePhoneMode = 1;
					} else if (res.model.toLowerCase().search('iphone') !== -1) {
						app.globalData.mobilePhoneMode = 0; // iphone 678
					} else if (!res.windowWidth * res.pixelRatio === 1080) {
						app.globalData.mobilePhoneMode = 2; // 1080
					} else {
						app.globalData.mobilePhoneMode = 3; // 安卓全面屏
					}
					this.setData({
						capsuleTop: app.globalData.capsule.top,
						capsuleHeight: app.globalData.capsule.height,
						navbarHeight: (app.globalData.capsule.top - app.globalData.statusBarHeight) * 2 + app.globalData.capsule.height + app.globalData.statusBarHeight
					});
				}
			});
		} else {
			this.setData({
				capsuleTop: app.globalData.capsule.top,
				capsuleHeight: app.globalData.capsule.height,
				navbarHeight: (app.globalData.capsule.top - app.globalData.statusBarHeight) * 2 + app.globalData.capsule.height + app.globalData.statusBarHeight
			});
		}
	},
	methods: {
		handleGoToBack () {
			goHome(false);
		}
	}
});
