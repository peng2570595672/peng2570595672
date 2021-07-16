const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		ownerServiceList: [
			{title: '领驾驶险', ico: 'led_driving_icon', statisticsEvent: 'owner_service_for_driving', isShow: !app.globalData.isContinentInsurance},
			{title: '查违章', ico: 'check_illegal', statisticsEvent: 'owner_service_for_check_illegal', isShow: !app.globalData.isContinentInsurance},
			{title: '延保1年', ico: 'quality_assurance', statisticsEvent: 'owner_service_for_quality_assurance', isShow: true},
			{title: '国际驾照', ico: 'international_license', statisticsEvent: 'owner_service_for_international_license', isShow: true},
			{title: '优惠加油', ico: 'oil', statisticsEvent: 'owner_service_for_oil', isShow: true}
		]
	},
	onLoad () {
	},
	// 跳转
	go (e) {
		let item = e.currentTarget.dataset['item'];
		let index = +e.currentTarget.dataset['index'];
		wx.uma.trackEvent(item.statisticsEvent);
		switch (index + 1) {
			case 1:
				// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
				wx.navigateToMiniProgram({
					appId: 'wx06a561655ab8f5b2',
					path: 'pages/base/redirect/index?routeKey=WD_PAZZ&wtagid=116.115.27',
					envVersion: 'release', // 正式版
					fail () {
						util.showToastNoIcon('调起小程序失败, 请重试！');
					}
				});
				break;
			case 2:
				// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
				wx.navigateToMiniProgram({
					appId: 'wx06a561655ab8f5b2',
					path: 'pages/base/redirect/index?routeKey=PC01_REDIRECT&autoRoute=CHECKILLEGAL&outsource=souyisou&wtagid=116.115.10',
					envVersion: 'release', // 目前联调为体验版
					fail () {
						util.showToastNoIcon('调起小程序失败, 请重试！');
					}
				});
				break;
			case 3:
				this.setData({
					showDetailWrapper: true,
					showDetailMask: true
				});
				break;
			case 4:
				util.go('/pages/international_driving_document/index/index');
				break;
			case 5:
				// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
				wx.navigateToMiniProgram({
					appId: 'wx65cc950f42e8fff1',
					path: 'launch/launch?target=refuelStations&from=sjht_etc',
					envVersion: 'release', // 正式版
					fail () {
						util.showToastNoIcon('调起小程序失败, 请重试！');
					}
				});
				break;
		}
	},
	// 关闭详情
	close () {},
	hide () {
		this.setData({
			showDetailWrapper: false
		});
		setTimeout(() => {
			this.setData({
				showDetailMask: false
			});
		}, 400);
	}
});
