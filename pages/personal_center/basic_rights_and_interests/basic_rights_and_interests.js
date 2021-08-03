const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isContinentInsurance: false, // 是否是大地保险
		interestsList: [
			{img: 'icon_make_invoice', title: '开具ETC办理发票', url: 'invoice_issued_list', statisticsEvent: 'equities_for_make_etc_invoice'},
			{img: 'icon_query', title: '违章不限次数查询', appId: 'wx06a561655ab8f5b2', url: 'pages/base/redirect/index?routeKey=PC01_REDIRECT&autoRoute=CHECKILLEGAL&outsource=souyisou&wtagid=116.115.10', statisticsEvent: 'equities_for_violation_enquiry'},
			{img: 'icon_make_invoice', title: '开具通行费发票', appId: 'wx9040bb0d3f910004', url: 'pages/index/index', statisticsEvent: 'equities_for_make_invoice'},
			{img: 'driving_risk', title: '每月领取驾驶险', appId: 'wx06a561655ab8f5b2', url: 'pages/base/redirect/index?routeKey=WD_PAZZ&wtagid=116.115.27', statisticsEvent: 'equities_for_driving_risk'},
			{img: 'icon_customer_service', title: '在线客服', url: 'online_customer_service', statisticsEvent: 'equities_for_service'}
		]
	},
	async onLoad () {
		this.setData({
			isContinentInsurance: app.globalData.isContinentInsurance
		});
		if (this.data.isContinentInsurance) {
			const interestsList = this.data.interestsList.filter(item => item.appId !== 'wx06a561655ab8f5b2');// 大地保险屏蔽微保&和爱车
			this.setData({interestsList});
		}
		// 查询是否欠款
		await util.getIsArrearage();
	},
	go (e) {
		let index = e.currentTarget.dataset.index;
		let item = this.data.interestsList[index];
		if (item.appId) {
			// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
			wx.navigateToMiniProgram({
				appId: item.appId,
				path: item.url,
				envVersion: 'release', // 正式版
				fail () {
					util.showToastNoIcon('调起小程序失败, 请重试！');
				}
			});
			return;
		}
		if (item.url === 'online_customer_service') {
			util.go(`/pages/web/web/web?type=${item.url}`);
			return;
		}
		if (item.url === 'invoice_issued_list') {
			util.go(`/pages/personal_center/${item.url}/${item.url}`);
		}
	}
});
