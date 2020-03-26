const app = getApp();
/**
 * @author 狂奔的蜗牛
 * @desc 登录
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		loginInfo: {}
	},
	onLoad () {
		let loginInfo = wx.getStorageSync('login_info');
		if (loginInfo) {
			this.setData({
				loginInfo: JSON.parse(loginInfo)
			});
		}
	},
	onGetPhoneNumber (e) {
		// 允许授权
		if (e.detail.errMsg === 'getPhoneNumber:ok') {
			let encryptedData = e.detail.encryptedData;
			let iv = e.detail.iv;
			util.showLoading({
				title: '登录中...'
			});
			util.getDataFromServer('consumer/member/common/applet/bindingPhone', {
				certificate: this.data.loginInfo.certificate,
				encryptedData: encryptedData, // 微信加密数据
				iv: iv // 微信加密数据
			}, () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}, (res) => {
				// 绑定手机号成功
				if (res.code === 0) {
					res.data['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
					app.globalData.userInfo = res.data; // 用户登录信息
					app.globalData.openId = res.data.openId;
					app.globalData.memberId = res.data.memberId;
					app.globalData.mobilePhone = res.data.mobilePhone;
					let loginInfo = this.data.loginInfo;
					loginInfo['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
					loginInfo.needBindingPhone = 0;
					wx.setStorageSync('login_info_final', JSON.stringify(loginInfo));
					wx.navigateBack({
						delta: 1 // 默认值是1
					});
				} else {
					util.hideLoading();
					util.showToastNoIcon(res.message);
				}
			});
		}
	}
});
