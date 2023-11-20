const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isTruckActivation: false,
		isBcoTruckActivation: false,
		isThree: false,
		isCharge: false,
		isFree: false,
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
		// 查询是否欠款
		await util.getIsArrearage();
		let [
			isQTAttribute,
			isNotQTAttribute,
			isQTNotAttribute,
			isNotQTNotAttribute,
			isTTQAttribute
		] = [false, false, false, false, false];

		let isTruckActivation = app.globalData.myEtcList.findIndex(item => (item.obuStatus === 1 || item.obuStatus === 5) && item.isNewTrucks === 1); //  货车已激活
		let isBcoTruckActivation = app.globalData.myEtcList.findIndex(item => (item.obuStatus === 1 || item.obuStatus === 5) && item.isNewTrucks === 1 && item.flowVersion === 7); //  交行货车已激活
		let isObuCardType = app.globalData.myEtcList.findIndex(item => (item.obuCardType === 1 || item.obuCardType === 21)); // 卡类型 (黔通 客车 & 易路通达货车)
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
			isObuCardType: isObuCardType,
			isTruckActivation: isTruckActivation !== -1,
			isBcoTruckActivation: isBcoTruckActivation !== -1,
			isQTAttribute,
			isNotQTAttribute,
			isQTNotAttribute,
			isTTQAttribute,
			isNotQTNotAttribute
		});
	},
	async onShow () {
		const result = await util.getDataFromServersV2('consumer/system/common/get-usable-agreements', {},'POST',false);
		if (result.code === 0) {
			let arr = [];
			let carAgreementList = [];
			let arr1 = [...new Set(result.data.map(item => { return item.name; }))];	// 去重
			for (let index = 0; index < arr1.length; index++) {
				let count = 1;
				let arr2 = result.data.filter(item => { if (item.name === arr1[index]) { return item; } });
				if (arr2.length > 1) {
					carAgreementList = carAgreementList.concat(arr2.map(item => { item.name = item.name + '(' + count++ + ')'; return item; }));
					continue;
				}
				arr = arr.concat(arr2);
			}
			this.setData({
				carAgreementList: carAgreementList.concat(arr)
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 客车协议
	carAgreementHandle (e) {
		let item = e.currentTarget.dataset.item;
        if (item.contentType === 1) {
            wx.navigateTo({
                url: '/pages/agreement_documents/background_agreement/background_agreement',
                success: function (res) {
                    // 通过eventChannel向被打开页面传送数据
                    res.eventChannel.emit('acceptDataFromOpenerPage', { data: item });
                }
            });
        } else { // 打开pdf
            util.openPdf(item.content,item.category);
        }
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
				util.go('/pages/agreement_documents/privacy_agreement/privacy_agreement');
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
		util.go(`/pages/agreement_documents/${url}/${url}`);
	}
});
