const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		interestsList: [
			{img: 'icon_make_invoice', title: '开具通行费发票', url: 'make_invoice'},
			{img: 'icon_query', title: '违章不限次数查询', url: 'violation_enquiry'},
			{img: 'icon_customer_service', title: '在线客服', url: 'online_customer_service'},
			{img: 'icon_make_invoice', title: '开具付费办理发票', url: 'collect_paid_up_interest'}
		]
	},
	onLoad () {
	},
	onShow () {
	},
	go (e) {
		let url = e.currentTarget.dataset.url;
		if (url === 'violation_enquiry') {
			// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
			wx.navigateToMiniProgram({
				appId: 'wx06a561655ab8f5b2',
				path: 'pages/base/redirect/index?routeKey=PC01_REDIRECT&autoRoute=CHECKILLEGAL&outsource=souyisou&wtagid=116.115.10',
				envVersion: 'release', // 正式版
				fail () {
					util.showToastNoIcon('调起小程序失败, 请重试！');
				}
			});
			return;
		}
		if (url === 'online_customer_service') {
			util.go(`/pages/web/web/web?type=${url}`);
			return;
		}
		if (url === 'collect_paid_up_interest') {
			util.go(`/pages/personal_center/invoice_issued_list/invoice_issued_list`);
			return;
		}
		if (url === 'collect_paid_up_interest') {
			this.goMakeInvoice();
		}
	},
	goMakeInvoice () {
		wx.navigateToMiniProgram({
			appId: 'wx9040bb0d3f910004',
			path: 'pages/index/index',
			envVersion: 'release', // 目前联调为体验版
			fail () {
				util.showToastNoIcon('调起票根小程序失败, 请重试！');
			}
		});
	}
});
