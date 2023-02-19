const util = require('../../../utils/util.js');
const app = getApp();
Page({

	data: {
		isVip: '', // 是否VIP用户
		bgColor: '', // 背景色
		nicheng: '',
		headPhoto: '',
		userInfo: {} // 存放用户的头像和昵称
	},

	onLoad (options) {
		this.setData({
			isVip: options.isVip === 'true' ? true : false
		});
		this.decisionColor(options.isVip);
	},

	onShow () {
		let personInformation = wx.getStorageSync('person_information');
		if (personInformation) {
			this.setData({
				headPhoto: personInformation.headPhoto,
				nicheng: personInformation.nicheng
			});
		}
	},
	// 保存个人信息 到本地环境
	save () {
		wx.setStorageSync('person_information', {
			nicheng: this.data.nicheng,
			headPhoto: this.data.headPhoto
		});
		util.showToastNoIcon('保存成功');
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
								userInfo: res.userInfo,
								headPhoto: res.userInfo.avatarUrl,
								nicheng: res.userInfo.nickName
							});
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
		let that = this;
		wx.chooseImage({
			count: 1,
			sizeType: ['original', 'compressed'],
			sourceType: ['album', 'camera'],
			success (res) {
				// tempFilePath可以作为 img 标签的 src 属性显示图片
				const tempFilePaths = res.tempFilePaths;
				that.setData({
					headPhoto: tempFilePaths
				});
			},
			fail (err) {
				util.showToastNoIcon(err);
			}
		});
	}

});
