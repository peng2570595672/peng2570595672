/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		contractType: 0,
		orderInfo: undefined,
		// isContractBond: true,// 是否签约保证金
		// isContractToll: true,// 是否签约通行费
		// isContractPoundage: true,// 是否签约通行手续费
		contractTollInfo: undefined,
		contractPoundageInfo: undefined,
		contractBondInfo: undefined,
		bankCardInfo: {},
		isRequest: false,
		available: false
	},
	async onLoad () {
		this.setData({
			bankCardInfo: app.globalData.bankCardInfo
		});
		app.globalData.signAContract = 3;
	},
	async onShow () {
		if (app.globalData.signAContract === 4) {
			// 货车签约车主返回
			await this.queryContractForTruckHandling();
		} else {
			await this.getETCDetail();
		}
	},
	// 货车-查询车主服务签约
	async queryContractForTruckHandling () {
		util.showLoading({
			title: '签约查询中...'
		});
		const result = await util.getDataFromServersV2('consumer/order/newTrucksContractQuery', {
			orderId: app.globalData.orderInfo.orderId,
			contractType: this.data.contractType,
			immediately: true
		});
		console.log(result);
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		app.globalData.signAContract = 3;
		// 签约成功 userState: "NORMAL"
		console.log(result.data);
		if (result.data.contractStatus === 1) {
			console.log('-----------');
			await this.getETCDetail();
		} else {
			util.showToastNoIcon('未签约成功！');
		}
	},
	// 加载订单详情
	async getETCDetail () {
		const result = await util.getDataFromServersV2('consumer/order/order-detail', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			let [isContractBond, isContractToll, isContractPoundage] = [false, false, false];
			let [contractTollInfo, contractPoundageInfo, contractBondInfo] = [undefined, undefined, undefined];
			result.data.multiContractList.map(item => {
				if (item.contractType === 1) {
					isContractToll = true;
					contractTollInfo = item;
				}
				if (item.contractType === 2) {
					isContractPoundage = true;
					contractPoundageInfo = item;
				}
				if (item.contractType === 3) {
					isContractBond = true;
					contractBondInfo = item;
				}
			});
			const list = result.data.multiContractList.filter(item => item.contractStatus === 1);
			// if (!result.data.multiContractList.length) isContractToll = true;
			this.setData({
				// isContractBond,
				// isContractToll,
				// isContractPoundage,
				available: list.length === 3,
				contractTollInfo,
				contractPoundageInfo,
				contractBondInfo,
				orderInfo: result.data
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async go (e) {
		let item = e.currentTarget.dataset.item;
		console.log(item)
		this.setData({
			contractType: item.contractType
		});
		if (item.contractStatus === 1) return;
		if (item.contractType === 3 && !item.memberAccountId) {
			const isOk = await util.updateOrderContractMappingBankAccountId(item, app.globalData.bankCardInfo);
			if (isOk) this.onclickSign(item);
			return;
		}
		if (item.contractType === 3 && item?.contractStatus === 2 && item?.userState.includes('PAUSE')) {
			app.globalData.isTruckHandling = true;
			app.globalData.signAContract = 4;
			wx.navigateToMiniProgram({
				appId: 'wxbcad394b3d99dac9',
				path: 'pages/etc/index',
				extraData: {
					contract_id: item.contractId
				},
				success () {
				},
				fail (e) {
					// 未成功跳转到签约小程序
					util.showToastNoIcon('调起微信签约小程序失败, 请重试！');
				}
			});
			return;
		}
		this.onclickSign(item);
	},
	// 微信签约
	async onclickSign (item) {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		// mta.Event.stat('information_list_next',{});
		util.showLoading('加载中');
		let params = {
			dataComplete: 0,// 资料已完善
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			orderId: app.globalData.orderInfo.orderId,// 订单id
			contractType: item.contractType,// 签约类型：1-通行费，2-服务费，3-保证金
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		if (this.data.contractStatus === 1 || this.data.isModifiedData) {
			delete params.needSignContract;
			delete params.clientMobilePhone;
			delete params.clientOpenid;
		}
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({isRequest: false});
		if (!result) return;
		if (result.code === 0) {
			app.globalData.isTruckHandling = true;
			app.globalData.signAContract = 4;
			let res = result.data.contract;
			util.weChatSigning(res);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	next () {
		util.go('/pages/truck_handling/recharge_instructions/recharge_instructions');
	}
});
