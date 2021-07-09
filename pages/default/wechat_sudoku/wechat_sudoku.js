const util = require('../../../utils/util.js');
// 九宫格入口
const app = getApp();
Page({
	data: {
		bankList: [
			{name: 'WeCha', buriedPoint: 'wechat_sudoku_wecha', shopIdTest: '', shopId: '700644029609549824'},// 微信支付
			{name: 'ICBC', buriedPoint: 'wechat_sudoku_icbc', shopIdTest: '', shopId: '700645534739734528'},// 工行
			{name: 'CCB', buriedPoint: 'wechat_sudoku_ccb', shopIdTest: '', shopId: '700651431658528768'},// 建行
			{name: 'ABC', buriedPoint: 'wechat_sudoku_abc', shopIdTest: '', shopId: '700645981810597888'},// 农业银行
			{name: 'BOC', buriedPoint: 'wechat_sudoku_boc', shopIdTest: '', shopId: '753936275050078208'},// 中国银行
			{name: 'PSBC', buriedPoint: 'wechat_sudoku_psbc', shopIdTest: '', shopId: '753936580412317696'},// 邮政银行
			{name: 'BOCOM', buriedPoint: 'wechat_sudoku_bocom', shopIdTest: '', shopId: '753936756191404032'},// 交通银行
			{name: 'CIB', buriedPoint: 'wechat_sudoku_cib', shopIdTest: '', shopId: '753936904262787072'},// 兴业银行
			{name: 'PAB', buriedPoint: 'wechat_sudoku_pab', shopIdTest: '', shopId: '753937063096885248'},// 平安银行
			{name: 'HXB', buriedPoint: 'wechat_sudoku_hxb', shopIdTest: '', shopId: '753937191039934464'},// 华夏银行
			{name: 'CMBC', buriedPoint: 'wechat_sudoku_cmbc', shopIdTest: '', shopId: '753937333151342592'},// 民生银行
			{name: 'CMB', buriedPoint: 'wechat_sudoku_cmb', shopIdTest: '', shopId: '753937460133896192'},//  招商银行
			{name: 'SPDB', buriedPoint: 'wechat_sudoku_spdb', shopIdTest: '', shopId: '753937598663368704'},// 浦发银行
			{name: 'GDB', buriedPoint: 'wechat_sudoku_gdb', shopIdTest: '', shopId: '753937718322667520'}// 广发银行
		]
	},
	onLoad (options) {
		util.resetData();// 重置数据
		app.globalData.isWeChatSudoku = true;
		if (options.bank) {
			let bank = this.data.bankList.find(item => {
				return item.name.toUpperCase() === options.bank.toUpperCase();
			});
			console.log(bank);
			app.globalData.otherPlatformsServiceProvidersId = bank.shopId;
			wx.uma.trackEvent(bank.buriedPoint);
		}
		wx.reLaunch({
			url: '/pages/default/receiving_address/receiving_address'
		});
	}
});
