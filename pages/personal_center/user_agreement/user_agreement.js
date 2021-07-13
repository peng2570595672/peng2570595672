const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		carAgreementList: [
			{name: '用户办理协议', update: 0},
			{name: '隐私协议', update: 0}
		],
		truckAgreementList: [
			{name: '货车办理协议', update: 0},
			{name: '隐私协议', update: 0},
			{name: '个人征信授权书', update: 0}
		]
	},
	onLoad (options) {
	},
	// 客车协议
	carAgreementHandle (e) {
		let index = e.currentTarget.dataset.index;
		switch (index) {
			case 0:
				// 办理协议
				break;
			case 1:
				// 隐私协议
				break;
			default:
				break;
		}
	},
	// 货车协议
	truckAgreementHandle (e) {
		let index = e.currentTarget.dataset.index;
		switch (index) {
			case 0:
				// 办理协议
				break;
			case 1:
				// 隐私协议
				break;
			case 2:
				// 征信授权书
				break;
			default:
				break;
		}
	}
});
