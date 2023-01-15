// pages/my/index.js
const util = require('../../utils/util.js');
const app = getApp();

Page({

	data: {
		isVip: false, //	用户是否是Vip
		mobilePhone: undefined,	// 微信绑定的电话号码
		userInfo: {},	// 存放用户的头像和昵称
		testImg: 'https://file.cyzl.com/g001/M00/B7/CF/oYYBAGO_qS-ASZFtAABBq9PjXMc834.png'	// 测试所用的图片和icon
	},

	onLoad (options) {
		this.setUserInfoStorageTime();
	},

	onShow () {
		util.customTabbar(this, 3);
		this.setData({
			mobilePhone: app.globalData.mobilePhone
		});
	},

	getUserProfile () {
		var that = this;
		wx.showModal({
			title: '提示',
			content: '是否允许获取微信昵称和头像？',
			success (res) {
				if (res.confirm) {
					wx.getUserProfile({
						desc: '用于完善用户资料', // 声明获取用户个人信息后的用途，后续会展示在弹窗中，请谨慎填写
						success: (res) => {
							console.log(res.userInfo);
							app.globalData.userInfo = res.userInfo; // 这个我有时候获取不到
							that.setData({
								userInfo: res.userInfo
							});
							wx.setStorageSync('userInfo', res.userInfo);
							let setNowTime = Date.now() + 3600 * 1000 * 24 * 30; // 设置30天有效期
							wx.setStorageSync('userInfoStorageTime', setNowTime);
						},
						fail: function (err) {
							console.log(err);
						}
					});
				}
			}
		});
	},

	setUserInfoStorageTime () {
		var that = this;
		let nowTime = Date.now();
		let oldTime = wx.getStorageSync('userInfoStorageTime');
		let userInfo = wx.getStorageSync('userInfo');
		if (userInfo.nickName !== undefined && userInfo.nickName !== null && userInfo.nickName !== '') {
			if (oldTime && nowTime < oldTime) {
				that.setData({
					userInfo: userInfo
				});
			} else {
				that.getUserProfile();
			}
		} else {
			that.getUserProfile();
		}
	},

	// 测试是否Vip的变化
	btnChange () {
		this.setData({
			isVip: !this.data.isVip
		});
	},

	onUnload () {

	}
});
