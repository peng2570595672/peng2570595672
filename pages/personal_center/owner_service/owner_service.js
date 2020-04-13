const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isMembers: false,
		userInfo: undefined, // 用户信息
		serviceList: [
			{
				id: 0,
				img: 'https://file.cyzl.com/g001/M05/E0/4A/oYYBAF36zsmAJT1KAAA1qnJOMf4027.svg',
				title: '优惠洗车',
				abbreviation: '洗车',
				content: '享受ETC车主特惠洗车服务，一年最高可省192元；支持全国上万家洗车门店提供优惠洗车服务，适用于小轿车、SUV、商务车7座及其以下私家车车型。'
			},
			{
				id: 1,
				img: 'https://file.cyzl.com/g001/M05/E0/47/oYYBAF36znmAWHtwAAAVvzkvmGs826.svg',
				title: '优惠代驾',
				abbreviation: '代驾',
				content: '根据不同城市适配滴滴代驾和E代驾，每使用并完成一笔代驾服务，即可获赠1张1-100元高速通行抵扣券。'
			},
			{
				id: 2,
				img: 'https://file.cyzl.com/g001/M00/02/91/CgAAD1zmPLiAD785AAAN5PuoTHU995.svg',
				title: '预约检车',
				abbreviation: '检车',
				content: 'ETC车主尊享年检不过全额退款特权，支持全国范围内合作的检测站；线上提前支付预约，线下出示核销二维码即可享受年检服务。'
			},
			{
				id: 3,
				img: 'https://file.cyzl.com/g001/M05/E0/49/oYYBAF36zreALlcTAAAj2PVIIwM800.svg',
				title: '违章查询',
				abbreviation: '违章查询',
				content: '每月免费违章查询、违章订阅；还可获得一年免费驾乘意外险，定期推送额外保额奖励。'
			},
			{
				id: 4,
				img: 'https://file.cyzl.com/g001/M05/E0/49/oYYBAF36zqWAGm4yAAARW0S0iVY590.svg',
				title: '查找车位',
				abbreviation: '查找车位',
				content: '快速查询附近停车场及空闲车位，一键导航至车场，停车不用愁；支持全国上万个停车场信息查询服务。'
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
	},
	bindGetUserInfo (e) {
		this.setData({
			userInfo: e.detail.userInfo
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
	}
});
