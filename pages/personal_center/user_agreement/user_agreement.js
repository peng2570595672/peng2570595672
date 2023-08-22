const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isPassengerCarActivation: false,
		isTruckActivation: false,
		isBcoTruckActivation: false,
		isThree: false,
		isCharge: false,
		isFree: false,
		isCheckTwoPercent: 0,
		carAgreementList: [],
		truckAgreementList: [
			{id: 0,name: '货车办理协议', update: 0},
			{id: 1,name: '黔通卡ETC用户协议', update: 0},
			{id: 2,name: '隐私协议', update: 0},
			{id: 3,name: '保理协议', update: 0},
			{id: 4,name: '个人征信授权书', update: 0}
		],
		listThree: [
			{id: 6,name: '隐私协议',url: 'privacy_agreement',update: 0}
		],
		listFour: [
			{name: '通通券会员服务协议',url: '',update: 0},
			{name: '工商银行开户协议',url: '',update: 0}
		]
	},
	async onLoad (options) {
		if (options.isCheckTwoPercent) {
			this.setData({
				isCheckTwoPercent: +options.isCheckTwoPercent
			});
		}
		// 查询是否欠款
		await util.getIsArrearage();
		let [
			isPassengerCarActivation,
			isQTAttribute,
			isNotQTAttribute,
			isQTNotAttribute,
			isNotQTNotAttribute,
			isTTQAttribute,
			isServiceFeeType,
			isNm,
			isNotNm,
			isQTOnlineProcessing,
			isQTNotOnlineProcessing,
			isNMOnlineProcessing,
			isNMNotOnlineProcessing,
			oldProcessing
		] = [false, false, false, false, false, false, false, false, false, false, false, false, false];
		// 客车已激活  黔通自购  非黔通自购  黔通免费  非黔通免费  通通券
		let QTOrderStatus = 0;// 1-新订单 2-老订单 3-新老订单都存在
		app.globalData.myEtcList.map(item => {
			//  客车已激活
			isPassengerCarActivation = true;
			if ((item.obuStatus === 1 || item.obuStatus === 5) && item.isNewTrucks === 0) {
				if (item.obuCardType === 1) {
					const timeComparison = util.timeComparison('2023/8/23', item.addTime);
					if (timeComparison === 1) {
						// timeComparison 1-新订单 2-老订单
						QTOrderStatus = QTOrderStatus > 1 ? 3 : 1;
					} else {
						QTOrderStatus = QTOrderStatus === 1 || QTOrderStatus === 3 ? 3 : 2;
					}
					if (item.orderType === 11 || (item.orderType === 71 && item.platformId === '500338116821778433')) {
						// 邮寄
						isQTOnlineProcessing = true;
					} else {
						isQTNotOnlineProcessing = true;
					}
				} else if (item.obuCardType === 2) {
					if (item.orderType === 11 || (item.orderType === 71 && item.platformId === '500338116821778433') || item.orderType === 81) {
						// 邮寄
						isNMOnlineProcessing = true;
					} else {
						isNMNotOnlineProcessing = true;
					}
				} else {
					oldProcessing = true;
				}
				if (item.obuCardType === 2) {
					isNm = true;
				} else {
					isNotNm = true;
				}
				if (item?.environmentAttribute === 2) {
					// 免费
					if (item.obuCardType === 1) {
						isQTNotAttribute = true;
					} else {
						isNotQTNotAttribute = true;
					}
				} else {
					if (item.isSignTtCoupon === 1) {
						isTTQAttribute = true;
					} else {
						if (item.obuCardType === 1) {
							isQTAttribute = true;
						} else {
							isNotQTAttribute = true;
						}
					}
				}
			}
		});
		let isTruckActivation = app.globalData.myEtcList.findIndex(item => (item.obuStatus === 1 || item.obuStatus === 5) && item.isNewTrucks === 1); //  货车已激活
		let isBcoTruckActivation = app.globalData.myEtcList.findIndex(item => (item.obuStatus === 1 || item.obuStatus === 5) && item.isNewTrucks === 1 && item.flowVersion === 7); //  交行货车已激活
		let isObuCardType = app.globalData.myEtcList.findIndex(item => (item.obuCardType === 1 || item.obuCardType === 21)); // 卡类型 (黔通 客车 & 易路通达货车)
		let isShowCoupon = app.globalData.myEtcList.findIndex(item => (item.isSignTtCoupon === 1 && item.ttContractStatus !== 0)); // 通通券 存在签约或解约
		console.log(isObuCardType,'==============================卡类型==========================================',isTruckActivation);
		if (isObuCardType === -1) { // 其他卡
			let truckAgreementList = [
				{id: 0,name: '货车办理协议', update: 0},
				{id: 2,name: '隐私协议', update: 0}
			];
			this.setData({
				truckAgreementList: truckAgreementList
			});
		}
		if (isBcoTruckActivation !== -1) {
			// 交行二类户
			const truckAgreementList = [
				{id: 0,name: '货车办理协议', update: 0},
				{id: 1,name: '黔通卡ETC用户协议', update: 0},
				{id: 2,name: '隐私协议', update: 0},
				{id: 101,name: '代收业务扣款授权书', update: 0},
				{id: 102,name: '涉税声明', update: 0},
				{id: 103,name: '买卖账户法律责任及惩戒措施相关条款', update: 0},
				{id: 104,name: '个人人民币银行结算账户管理协议', update: 0}
			];
			this.setData({
				truckAgreementList: truckAgreementList
			});
		}
		this.setData({
			isPassengerCarActivation,
			isObuCardType: isObuCardType,
			isTruckActivation: isTruckActivation !== -1,
			isBcoTruckActivation: isBcoTruckActivation !== -1,
			isQTAttribute,
			isNotQTAttribute,
			isQTNotAttribute,
			isTTQAttribute,
			isNotQTNotAttribute
		});
		if (isPassengerCarActivation) {
			let carAgreementList = [
				{id: 0,name: '用户办理协议', update: 0, url: 'equity_agreement/equity_agreement', isShow: oldProcessing},
				{id: 101,name: '用户办理协议', update: 0, url: 'equity_agreement/equity_agreement?type=QTnotFees', isShow: isQTOnlineProcessing && (QTOrderStatus === 2 || QTOrderStatus === 3), isNew: 1},
				{id: 102,name: '用户办理协议', update: 0, url: 'equity_agreement/equity_agreement?type=QTnotFeesNew', isShow: isQTOnlineProcessing && (QTOrderStatus === 1 || QTOrderStatus === 3), isNew: 1},
				{id: 103,name: '用户办理协议', update: 0, url: 'equity_agreement/equity_agreement?type=QT', isShow: isQTNotOnlineProcessing && (QTOrderStatus === 2 || QTOrderStatus === 3), isNew: 1},
				{id: 104,name: '用户办理协议', update: 0, url: 'equity_agreement/equity_agreement?type=QTNew', isShow: isQTNotOnlineProcessing && (QTOrderStatus === 1 || QTOrderStatus === 3), isNew: 1},
				{id: 105,name: '用户办理协议', update: 0, url: 'equity_agreement/equity_agreement?type=MTnotFees', isShow: isNMOnlineProcessing, isNew: 1},
				{id: 1,name: '用户办理协议', update: 0, url: 'equity_agreement/equity_agreement?type=MT', isShow: isNMNotOnlineProcessing, isNew: 1},
				// {id: 1,name: '用户办理协议', update: 0, url: 'free_equipment_agreement/free_equipment_agreement', isShow: isQTNotAttribute},
				// {id: 2,name: '用户办理协议（权益设备）', update: 0, url: 'self_buy_equipmemnt_agreement/self_buy_equipmemnt_agreement', isShow: isTTQAttribute},
				// {id: 3,name: '用户办理协议（付费设备）', update: 0, url: 'new_self_buy_equipmemnt_agreement/index', isShow: isQTAttribute},
				// {id: 4,name: '用户办理协议', update: 0, url: 'equity_agreement/equity_agreement', isShow: isServiceFeeType},
				{id: 5,name: '黔通卡ETC用户协议', update: 0, url: 'agreement_for_qiantong_to_free/agreement', isShow: isQTNotAttribute},
				{id: 6,name: '黔通卡ETC用户协议', update: 0, url: 'agreement_for_qiantong_to_charge/agreement', isShow: isQTAttribute || isQTNotAttribute},
				{id: 7,name: '隐私协议', update: 0, url: 'privacy_agreement/privacy_agreement', isShow: true}
			];
     console.log(carAgreementList,'=============================');
     console.log(isObuCardType,'=============================');
			// if (isObuCardType) { // 其他卡不是黔通
			// 	carAgreementList = [
			// 		{id: 0,name: '用户办理协议', update: 0, url: 'agreement/agreement', isShow: isCarActivation !== -1},
			// 		// {id: 1,name: '用户办理协议', update: 0, url: 'free_equipment_agreement/free_equipment_agreement', isShow: isQTNotAttribute},
			// 		{id: 5,name: '隐私协议', update: 0, url: 'privacy_agreement/privacy_agreement', isShow: true}
			// 	];
			// }
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
		if (isShowCoupon !== -1) {
			const obj = {id: 9,name: '通通券会员服务协议', update: 0, url: 'coupon_agreement/coupon_agreement', isShow: true};
			this.data.carAgreementList.push(obj);
			this.setData({
				carAgreementList: this.data.carAgreementList
			});
		}
	},
	// 客车协议
	carAgreementHandle (e) {
		let item = e.currentTarget.dataset.item;
		const path = item.url;
		util.go(`/pages/${path.includes('qiantong') ? 'truck_handling' : 'default'}/${path}`);
	},
	// 货车协议
	truckAgreementHandle (e) {
		let itme = e.currentTarget.dataset.index;
		let index = itme.id;
		switch (index) {
			case 0:
				// 办理协议
				if (this.data.isBcoTruckActivation) {
					util.go('/pages/truck_handling/bocom_handle_protocol/bocom_handle_protocol');
				}
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
			case 101:
				// 代收业务扣款授权书
				util.go('/pages/truck_handling/bocom_deduction_collection_protocol/bocom_deduction_collection_protocol');
				break;
			case 102:
				// 涉税声明
				util.go('/pages/truck_handling/bocom_tallage_protocol/bocom_tallage_protocol');
				break;
			case 103:
				// 买卖账户法律责任及惩戒措施相关条款
				util.go('/pages/truck_handling/bocom_clause_protocol/bocom_clause_protocol');
				break;
			case 104:
				// 个人人民币银行结算账户管理协议
				util.go('/pages/truck_handling/bocom_management_protocol/bocom_management_protocol');
				break;
			default:
				break;
		}
	},
	go (e) {
		let url = e.currentTarget.dataset.url;
		util.go(`/pages/default/${url}/${url}`);
	}
});
