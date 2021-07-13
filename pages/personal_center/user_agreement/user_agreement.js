const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isPassengerCarActivation: false,
		isTruckActivation: false,
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
	onLoad () {
		let isPassengerCarActivation = app.globalData.myEtcList.findIndex(item => (item.obuStatus === 1 || item.obuStatus === 5) && item.isNewTrucks === 0); //  客车已激活
		let isTruckActivation = app.globalData.myEtcList.findIndex(item => (item.obuStatus === 1 || item.obuStatus === 5) && item.isNewTrucks === 1); //  货车已激活
		this.setData({
			isPassengerCarActivation: isPassengerCarActivation !== -1,
			isTruckActivation: isTruckActivation !== -1
		});
	},
	// 客车协议
	carAgreementHandle (e) {
		let index = e.currentTarget.dataset.index;
		switch (index) {
			case 0:
				// 办理协议
				util.go('/pages/default/agreement/agreement');
				break;
			case 1:
				// 隐私协议
				util.go('/pages/default/privacy_agreement/privacy_agreement');
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
				util.go('/pages/truck_handling/agreement/agreement');
				break;
			case 1:
				// 隐私协议
				util.go('/pages/default/privacy_agreement/privacy_agreement');
				break;
			case 2:
				// 征信授权书
				util.go('/pages/truck_handling/truck_credit_investigation_authorization/truck_credit_investigation_authorization');
				break;
			default:
				break;
		}
	}
});
