const util = require('../../../utils/util.js');
const app = getApp();
Page({

	data: {
		isVip: '', // 是否VIP用户
		bgColor: '', // 背景色
		nicheng: '小男孩',
		userInfo: {} // 存放用户的头像和昵称
	},

	onLoad (options) {
		this.setData({
			isVip: options.isVip === 'true' ? true : false
		});
		this.decisionColor(options.isVip);
	},

	onShow () {

	},
	// 根据是否VIP决定此页面的背景色
	decisionColor (isVip) {
		if (isVip === 'false') { // 普通用户的背景
			wx.setNavigationBarColor({
				backgroundColor: '#BDE3D7',
				frontColor: '#000000'
			});
			this.setData({
				bgColor: 'linear-gradient(#BDE3D7 0%, #EBEDF0 16%, #EBEDF0 100%)'
			});
		} else {
			wx.setNavigationBarColor({ // vip用户的背景
				backgroundColor: '#E9CA7B',
				frontColor: '#000000'
			});
			this.setData({
				bgColor: 'linear-gradient(#E9CA7B 0%, #EBEDF0 16%, #EBEDF0 100%)'
			});
		}
	},

	getPhoto () {
		let that = this;
		wx.showActionSheet({
			itemList: ['用微信头像', '从相册选择'],
			success (res) {
				if (res.tapIndex === 0) {
					that.getUserProfile();
				} else {
					that.getChooseImage();
				}
			},
			fail (res) {
				console.log(res.errMsg);
			}
		});
	},
	// 获取微信头像和昵称
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
							util.showToastNoIcon(err);
						}
					});
				}
			}
		});
	},
	// 相册选择
	getChooseImage () {
		wx.chooseImage({
			count: 1,
			sizeType: ['original', 'compressed'],
			sourceType: ['album', 'camera'],
			success (res) {
				// tempFilePath可以作为 img 标签的 src 属性显示图片
				const tempFilePaths = res.tempFilePaths;
				console.log(res);
			}
		});
	}

});
