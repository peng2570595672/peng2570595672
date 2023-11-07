const app = getApp();
const util = require('../../../utils/util.js');
Page({
	data: {
	},
	onLoad () {
	},
	onShow () {
		let installGuid = wx.getStorageSync('installGuid');
		if (!installGuid) return util.showToastNoIcon('用户信息丢失，请重新打开小程序');
		let endIndex = installGuid.indexOf('（') !== -1 ? installGuid.indexOf('（') : installGuid.indexOf('(');
		wx.setNavigationBarTitle({title: `安装指引-${installGuid.substring(0,endIndex).trim()}`});
	},
	handleGo () {
		util.go('/pages/obu_activate/neimeng_introduce/neimeng_introduce');
	}
});
