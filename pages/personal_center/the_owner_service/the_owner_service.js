const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		isContinentInsurance: false // 是否是大地保险
	},
	onLoad () {
		this.setData({
			isContinentInsurance: app.globalData.isContinentInsurance
		});
	},
	// 跳转
	go (e) {
		let type = +e.currentTarget.dataset['type'];
		const urlObj = {
			1: 'owner_service_for_driving',
			2: 'owner_service_for_check_illegal',
			3: 'owner_service_for_quality_assurance',
			4: 'owner_service_for_international_license'
		};
		wx.uma.trackEvent(urlObj[url]);
		switch (type) {
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
				util.showToastNoIcon('暂未开放');
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
