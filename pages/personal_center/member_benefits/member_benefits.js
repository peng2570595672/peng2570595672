const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isMembers: false,
		userInfo: undefined, // 用户信息
		benefitsList: [
			{
				id: 0,
				img: 'https://file.cyzl.com/g001/M05/E0/4A/oYYBAF36zsmAJT1KAAA1qnJOMf4027.svg',
				title: '优惠洗车',
				abbreviation: '洗车',
				content: '会员超值洗车服务，最高可省192元/年。最高可支持全国上万家洗车门店，适用于小轿车、七 SUV、商务车7座及其私家车车型。支持全国上万家洗车门店，适用于小轿车、SUV、商'
			},
			{
				id: 1,
				img: 'https://file.cyzl.com/g001/M05/E0/47/oYYBAF36znmAWHtwAAAVvzkvmGs826.svg',
				title: '优惠代驾',
				abbreviation: '代驾',
				content: '会员超值洗车服务，最高可省192元/年。最高可支持全国上万家洗车门店，适用于小轿车、七 SUV、商务车7座及其私家车车型。支持全国上万家洗车门店，适用于小轿车、SUV、商'
			},
			{
				id: 2,
				img: 'https://file.cyzl.com/g001/M00/02/91/CgAAD1zmPLiAD785AAAN5PuoTHU995.svg',
				title: '预约检车',
				abbreviation: '检车',
				content: '会员超值洗车服务，最高可省192元/年。最高可支持全国上万家洗车门店，适用于小轿车、七 SUV、商务车7座及其私家车车型。支持全国上万家洗车门店，适用于小轿车、SUV、商'
			},
			{
				id: 3,
				img: 'https://file.cyzl.com/g001/M05/E0/49/oYYBAF36zreALlcTAAAj2PVIIwM800.svg',
				title: '违章查询',
				abbreviation: '违章查询',
				content: '会员超值洗车服务，最高可省192元/年。最高可支持全国上万家洗车门店，适用于小轿车、七 SUV、商务车7座及其私家车车型。支持全国上万家洗车门店，适用于小轿车、SUV、商'
			},
			{
				id: 4,
				img: 'https://file.cyzl.com/g001/M05/E0/49/oYYBAF36zqWAGm4yAAARW0S0iVY590.svg',
				title: '查找车位',
				abbreviation: '查找车位',
				content: '会员超值洗车服务，最高可省192元/年。最高可支持全国上万家洗车门店，适用于小轿车、七 SUV、商务车7座及其私家车车型。支持全国上万家洗车门店，适用于小轿车、SUV、商'
			}
		],
		detailsContent: '',
		showDetailMask: false,
		showDetailWtapper: false
	},
	onLoad () {
		let that = this;
		wx.getSetting({
			success (res) {
				if (res.authSetting['scope.userInfo']) {
					// 已经授权，可以直接调用 getUserInfo 获取头像昵称
					wx.getUserInfo({
						success: function (res) {
							console.log(res);
							that.setData({
								userInfo: res.userInfo
							});
						}
					});
				}
			}
		});
	},
	onShow () {
		this.getMemberBenefits();
	},
	bindGetUserInfo (e) {
		console.log(e);
		console.log(e.detail.userInfo);
		this.setData({
			userInfo: e.detail.userInfo
		});
	},
	// 获取会员信息
	getMemberBenefits () {
		util.showLoading();
		util.getDataFromServer('consumer/member/member-status', {}, () => {
			util.showToastNoIcon('获取会员信息失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					isMembers: res.data.vipGrade === 1 ? true : false
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 弹出详情
	showDetail (e) {
		let content = e.currentTarget.dataset['content'];
		this.setData({
			detailsContent: content,
			showDetailMask: true,
			showDetailWtapper: true
		});
	},
	// 关闭详情
	hide () {
		this.setData({
			showDetailWtapper: false
		});
		setTimeout(() => {
			this.setData({
				showDetailMask: false
			});
		}, 400);
	},
	// 成为会员&一键体验
	go () {
		if (!this.data.isMembers) {
		app.globalData.orderInfo.orderId = '';
			util.go('/pages/default/receiving_address/receiving_address');
		} else {
			console.log('去微信客服');
		}
	}
});
