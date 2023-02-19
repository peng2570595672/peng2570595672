const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		listOne: [
			{name: '开票说明',url: 'invoicing_instructions',icon: 'explain'},
			{name: '通行费开票',url: 'toll',icon: 'toll'},
			{name: '办理费开票',url: 'invoice_issued_detail',icon: 'handlingFee'}
		],
		disclaimerDesc: app.globalData.disclaimerDesc
	},

	onLoad (options) {

	},

	onShow () {

	},
	go (e) {
		let url = e.currentTarget.dataset.url;
		if (url === 'invoicing_instructions' || url === 'invoice_issued_detail') {
			return util.go(`/pages/personal_center/${url}/${url}`);
		}
		if (url === 'toll') {
			this.selectComponent('#dialog1').show('invoice');
		}
	},
	popUp (tes) {
		console.log(tes);
		let str = this.selectComponent('#dialog1').noShow();
		console.log(str);
		if (str === 'invoice') {
			this.goMakeInvoice();
		}
	},
	// 通行发票
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
