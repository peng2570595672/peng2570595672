// pages/default/choose_a_package/Choose_a_package.js
Page({

	/**
	 * 页面的初始数据
	 */
	data: {
		isFade: false,
		activeIndex: -1,
		isCloseUpperPart: -1,
		basicServiceList: [
			{title: 'ETC设备与卡片', tips: '包邮', ico: 'service_of_etc'},
			{title: '设备质保一年', ico: 'service_of_equipment'},
			{title: '开具通行费发票', ico: 'service_of_invoice'},
			{title: '高速通行9.5折', ico: 'service_of_discount'}
		]
	},

	onLoad (options) {

	},

	onShow () {

	},
	// 测试------------------------------------------------
	test (e) {
		let isFade = !this.data.isFade;
		this.setData({
			isFade,
			activeIndex: isFade ? e.currentTarget.dataset.index : -1,
			isCloseUpperPart: isFade ? e.currentTarget.dataset.index : -1
		});
	},
	test1 (e) {
		this.setData({
			isCloseUpperPart: -1
		});
	},
	// end-------------------------------------------------

	onUnload () {

	}
});
