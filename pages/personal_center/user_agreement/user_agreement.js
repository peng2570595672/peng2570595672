const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isPassengerCarActivation: false,
		isTruckActivation: false,
		isCharge: false,
		isFree: false,
		carAgreementList: [],
		truckAgreementList: [
			{name: '货车办理协议', update: 0},
			{name: '黔通卡ETC用户协议', update: 0},
			{name: '隐私协议', update: 0},
			{name: '保理协议', update: 0},
			{name: '个人征信授权书', update: 0}
		]
	},
	onLoad () {
		let isPassengerCarActivation = app.globalData.myEtcList.findIndex(item => (item.obuStatus === 1 || item.obuStatus === 5) && item.isNewTrucks === 0); //  客车已激活
		let isTruckActivation = app.globalData.myEtcList.findIndex(item => (item.obuStatus === 1 || item.obuStatus === 5) && item.isNewTrucks === 1); //  货车已激活
		let [isCharge, isFree] = [0, 0];
		if (isPassengerCarActivation !== -1) {
			isCharge = app.globalData.myEtcList.findIndex(item => (item.obuStatus === 1 || item.obuStatus === 5) && item.isNewTrucks === 0 && item.pledgeStatus === 0); //  客车已激活&收费
			isFree = app.globalData.myEtcList.findIndex(item => (item.obuStatus === 1 || item.obuStatus === 5) && item.isNewTrucks === 0 && item.pledgeStatus === -1); //  客车已激活&免费
		}
		this.setData({
			isPassengerCarActivation: isPassengerCarActivation !== -1,
			isTruckActivation: isTruckActivation !== -1,
			isFree: isFree !== -1,
			isCharge: isCharge !== -1
		});
		if (isFree !== -1 && isCharge !== -1) {
			// 付费和免费均有
			this.setData({
				carAgreementList: [
					{name: '用户办理协议（1）', update: 0, url: 'agreement'},
					{name: '用户办理协议（2）', update: 0, url: 'self_buy_equipmemnt_agreement'},
					{name: '黔通卡ETC用户协议（1）', update: 0, url: 'agreement_for_qiantong_to_free'},
					{name: '黔通卡ETC用户协议（2）', update: 0, url: 'agreement_for_qiantong_to_charge'},
					{name: '隐私协议', update: 0, url: 'privacy_agreement'}
				]
			});
		}
	},
	// 客车协议
	carAgreementHandle (e) {
		let index = e.currentTarget.dataset.index;
		if (this.data.carAgreementList.length === 2) {
			switch (index) {
				case 0:
					// 办理协议
					util.go(`/pages/default/${this.data.isCharge ? 'self_buy_equipmemnt_agreement' : 'agreement'}/${this.data.isCharge ? 'self_buy_equipmemnt_agreement' : 'agreement'}`);
					break;
				case 1:
					// 隐私协议
					util.go('/pages/default/privacy_agreement/privacy_agreement');
					break;
				default:
					break;
			}
		} else {
			const path = this.data.carAgreementList[index].url;
			util.go(`/pages/default/${path}/${path}`);
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
				let isCharge = app.globalData.myEtcList.findIndex(item => (item.obuStatus === 1 || item.obuStatus === 5) && item.isNewTrucks === 1 && item.environmentAttribute === 1); //  货车已激活&付费
				// 黔通卡ETC用户协议
				util.go(`/pages/truck_handling/agreement_for_qiantong_to_${isCharge ? 'charge' : 'free'}/agreement`);
				break;
			case 2:
				// 隐私协议
				util.go('/pages/default/privacy_agreement/privacy_agreement');
				break;
			case 3:
				// 保理协议
				util.go('/pages/truck_handling/agreement_for_factoring/agreement');
				break;
			case 4:
				// 征信授权书
				util.go('/pages/truck_handling/truck_credit_investigation_authorization/truck_credit_investigation_authorization');
				break;
			default:
				break;
		}
	}
});
