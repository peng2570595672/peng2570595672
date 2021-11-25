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
			{id: 0,name: '货车办理协议', update: 0},
			{id: 1,name: '黔通卡ETC用户协议', update: 0},
			{id: 2,name: '隐私协议', update: 0},
			{id: 3,name: '保理协议', update: 0},
			{id: 4,name: '个人征信授权书', update: 0}
		]
	},
	async onLoad () {
		// 查询是否欠款
		await util.getIsArrearage();
		let [isPassengerCarActivation, isQTAttribute, isNotQTAttribute, isQTNotAttribute, isNotQTNotAttribute] = [false, false, false, false, false];
		// 客车已激活  黔通自购  非黔通自购  黔通免费  非黔通免费
		app.globalData.myEtcList.map(item => {
			if ((item.obuStatus === 1 || item.obuStatus === 5) && item.isNewTrucks === 0) {
				//  客车已激活
				isPassengerCarActivation = true;
				if (item?.environmentAttribute === 1) {
					// 自购
					if (item.obuCardType === 1) {
						isQTAttribute = true;
					} else {
						isNotQTAttribute = true;
					}
				} else if (item?.environmentAttribute === 2) {
					// 免费
					if (item.obuCardType === 1) {
						isQTNotAttribute = true;
					} else {
						isNotQTNotAttribute = true;
					}
				} else {
					if (item.obuCardType === 1) {
						isQTNotAttribute = true;
					} else {
						isNotQTNotAttribute = true;
					}
				}
			}
		});
		let isTruckActivation = app.globalData.myEtcList.findIndex(item => (item.obuStatus === 1 || item.obuStatus === 5) && item.isNewTrucks === 1); //  货车已激活
		let isObuCardType = app.globalData.myEtcList.findIndex(item => (item.obuCardType === 1 || item.obuCardType === 21)); // 卡类型
   console.log(isObuCardType,'==============================卡类型==========================================',isTruckActivation);
	 if (isObuCardType) { // 其他卡
	 let 	truckAgreementList = [
		    {id: 0,name: '货车办理协议', update: 0},
				{id: 2,name: '隐私协议', update: 0}
	   	];
			this.setData({
				truckAgreementList: truckAgreementList
			});
  }
		this.setData({
			isPassengerCarActivation,
			isObuCardType: isObuCardType,
			isTruckActivation: isTruckActivation !== -1,
			isQTAttribute,
			isNotQTAttribute,
			isQTNotAttribute,
			isNotQTNotAttribute
		});
		if (isPassengerCarActivation) {
			let carAgreementList = [
				{id: 0,name: '用户办理协议', update: 0, url: 'agreement/agreement', isShow: isNotQTNotAttribute || isNotQTAttribute},
				{id: 1,name: '用户办理协议', update: 0, url: 'free_equipment_agreement/free_equipment_agreement', isShow: isQTNotAttribute},
				{id: 2,name: '用户办理协议', update: 0, url: 'self_buy_equipmemnt_agreement/self_buy_equipmemnt_agreement', isShow: isQTAttribute},
				{id: 3,name: '黔通卡ETC用户协议', update: 0, url: 'agreement_for_qiantong_to_free/agreement', isShow: isQTNotAttribute},
				{id: 4,name: '黔通卡ETC用户协议', update: 0, url: 'agreement_for_qiantong_to_charge/agreement', isShow: isQTAttribute},
				{id: 5,name: '隐私协议', update: 0, url: 'privacy_agreement/privacy_agreement', isShow: true}
			];
     console.log(isObuCardType,'=============================');
			if (isObuCardType) { // 其他卡不是黔通
		      carAgreementList = [
						{id: 0,name: '用户办理协议', update: 0, url: 'agreement/agreement', isShow: isNotQTNotAttribute || isNotQTAttribute},
						{id: 1,name: '用户办理协议', update: 0, url: 'free_equipment_agreement/free_equipment_agreement', isShow: isQTNotAttribute},
						{id: 5,name: '隐私协议', update: 0, url: 'privacy_agreement/privacy_agreement', isShow: true}
					];
			}
			carAgreementList = carAgreementList.filter(item => item.isShow === true);

			let arr = [
				{name: '用户办理协议', count: 0},
				{name: '黔通卡ETC用户协议', count: 0}
			];
			carAgreementList.forEach(item => {
				const obj = arr.find(it => {
					return it.name === item.name;
				});
				if (obj) {
					obj.count++;
				}
			});
			carAgreementList = carAgreementList.map((item, index) => {
				const obj = arr.find((it, i) => {
					return it.name === item.name;
				});
				if ((obj?.name === item.name && item.name === '用户办理协议') && obj?.count > 1) {
					item.name = item.name + '(' + (index + 1) + ')';
				}
				if ((obj?.name === item.name && item.name === '黔通卡ETC用户协议') && obj?.count > 1) {
					item.name = item.name + '(' + (index + 1 - arr[0].count) + ')';
				}
				return item;
			});
			this.setData({
				carAgreementList
			});
		}
	},
	// 客车协议
	carAgreementHandle (e) {
		let itme = e.currentTarget.dataset.index;
		const path = itme.url;
		util.go(`/pages/${path.includes('qiantong') ? 'truck_handling' : 'default'}/${path}`);
	},
	// 货车协议
	truckAgreementHandle (e) {
		let itme = e.currentTarget.dataset.index;
		let index = itme.id;
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
