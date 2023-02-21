const util = require('../../../utils/util.js');
const app = getApp();
Page({

	data: {
		isVip: '', // 是否VIP用户
		bgColor: '', // 背景色
		nicheng: undefined, // 昵称
		avatarUrl: undefined, // 头像

		show: true,
		duration: 0,
		position: 'center',
		round: false,
		overlay: true,
		isOut: false,	// 用于控制子容器离开前的判断
		isInput: false,
		customStyle: 'overflow-y:auto !important;z-index:-1;',
		overlayStyle: 'z-index:-2;'

	},

	onLoad (options) {
		this.setData({
			isVip: options.isVip === 'true' ? true : false
		});
		this.decisionColor(options.isVip);
	},

	onShow () {
		let personInformation = wx.getStorageSync('person_information');
		let noVip = 'https://file.cyzl.com/g001/M01/C8/3F/oYYBAGP0VgGAQa01AAAG5Ng7rok991.svg';
		let yesVip = 'https://file.cyzl.com/g001/M01/C8/3F/oYYBAGP0VdeAZ2uZAAAG57UJ39U085.svg';
		let isVip = this.data.isVip;
		this.setData({
			avatarUrl: personInformation.avatarUrl ? personInformation.avatarUrl : isVip ? yesVip : noVip,
			nicheng: personInformation.nicheng ? personInformation.nicheng : 'E+车主'
		});
	},
	// 保存个人信息 到本地环境
	save () {
		let flag = this.data.nicheng.indexOf('emoji');
		if (flag !== -1) {
			return util.showToastNoIcon('非法字符');
		}
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
		const {
			avatarUrl
		} = e.detail;
		this.setData({
			avatarUrl
		});
	},
	bindKeyInput (e) {
		const {
			value
		} = e.detail;
		// let regs = /[~~!@#$%&*()+=l[':;',//[\].<>/?~! @#￥%....* ()-+[]; : 。，、? ]/;
		// let flag = regs.test(value);
		let flag = value.indexOf('emoji');
		if (flag !== -1) {
			return util.showToastNoIcon('非法字符');
		}
		this.fangDou(value, 300);
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
	},
	onBeforeLeave () {
		let personInformation = wx.getStorageSync('person_information');
		if (personInformation.avatarUrl !== this.data.avatarUrl || personInformation.nicheng !== this.data.nicheng) {
			util.alert({
				content: '您的资料尚未保存',
				showCancel: false,
				confirmText: '知道了',
				confirm: () => {},
				cancel: () => {}
			});
		} else {
			wx.switchTab({
				url: '/pages/my/index'
			});
		}
	}
});
