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
		isRequest: false,
		available: false
	},
	async onLoad () {
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
		if (!result) return;
		if (result.code === 0) {
			app.globalData.signAContract = 3;
			// 签约成功 userState: "NORMAL"
			if (result.data.contractStatus === 1) {
				await this.getETCDetail();
			} else {
				util.showToastNoIcon('未签约成功！');
			}
		} else {
			util.showToastNoIcon(result.message);
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
			// if (!result.data.multiContractList.length) isContractToll = true;
			this.setData({
				// isContractBond,
				// isContractToll,
				// isContractPoundage,
				contractTollInfo,
				contractPoundageInfo,
				contractBondInfo,
				orderInfo: result.data
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 查询车主服务签约
	async queryContract () {
		const result = await util.getDataFromServersV2('consumer/order/query-contract', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				contractStatus: result.data.contractStatus
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	go (e) {
		let item = e.currentTarget.dataset.item;
		if (item.contractStatus === 1) return;
		console.log(item)
		this.onclickSign(item);
	},
	// 微信签约
	async onclickSign (item) {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		this.setData({
			contractType: item.contractType
		});
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
	}
});
