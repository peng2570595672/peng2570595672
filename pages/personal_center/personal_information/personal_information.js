const util = require('../../../utils/util.js');
const app = getApp();
Page({

	data: {
		isVip: '', // 是否VIP用户
		bgColor: '', // 背景色
		nicheng: undefined,	// 昵称
		avatarUrl: undefined,	// 头像
		wChatHeadImg: 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132' // 微信默认头像
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
				avatarUrl: personInformation.avatarUrl || this.data.wChatHeadImg,
				nicheng: personInformation.nicheng || 'E+车主'
			});
		}
	},
	// 保存个人信息 到本地环境
	save () {
		wx.setStorageSync('person_information', {
			avatarUrl: this.data.avatarUrl,
			nicheng: this.data.nicheng
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
	onChooseAvatar (e) {
		const { avatarUrl } = e.detail;
		this.setData({
			avatarUrl
		});
	},
	bindKeyInput (e) {
		const { value } = e.detail;
		this.fangDou(value,500);
	},
	fangDou (value, time) {
		let that = this;
		return (function () {
			if (that.data.timeout) {
				clearTimeout(that.data.timeout);
			}
			that.data.timeout = setTimeout(() => {
				that.setData({
					nicheng: value
				});
			}, time);
		})();
	}
	// 旧版本
	// getUserProfile (e) {
	// 	wx.getUserProfile({
	// 		desc: '用于完善用户资料',
	// 		success: (res) => {
	// 			this.setData({
	// 				userInfo: res.userInfo
	// 			});
	// 			if (res.userInfo) {
	// 				this.submitUserInfo(res);
	// 			}
	// 		}
	// 	});
	// },
	// bindGetUserInfo (e) {
	// 	this.setData({
	// 		userInfo: e.detail.userInfo
	// 	});
	// 	if (e.detail.userInfo) {
	// 		this.submitUserInfo(e.detail);
	// 	}
	// }
	// async submitUserInfo (user) {
	// 	let params = {
	// 		encryptedData: user.encryptedData,
	// 		iv: user.iv
	// 	};
	// 	console.log('参数：',params);
	// 	console.log('值：',user);
	// 	const result = await util.getDataFromServersV2('consumer/member/applet/update-user-info', params);
	// 	if (result.code) util.showToastNoIcon(result.message);
	// },

});
