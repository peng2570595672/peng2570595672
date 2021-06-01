/**
 * @author 老刘
 * @desc 开户成功
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		info: undefined,
		bankCardInfo: undefined,
		isOk: false, // 是否将二类户绑卡到订单
		available: false, // 按钮是否可点击
		isRequest: false// 是否请求中
	},
	async onLoad () {
		const result = await util.getV2BankId();
		this.setData({
			bankCardInfo: result
		});
		const info = await util.getETCDetail();
		if (info[2]) {
			let isOk = true;
			if (!info[2].memberAccountId) isOk = await util.updateOrderContractMappingBankAccountId(info[2], app.globalData.bankCardInfo);
			this.setData({
				info: info[2],
				isOk
			});
		}
	},
	async onShow () {
		if (app.globalData.signAContract === 4) {
			// 货车签约车主返回
			const isContract = await util.queryContractForTruckHandling();
			if (isContract) {
				util.go('/pages/truck_handling/contract_management/contract_management');
			}
		}
	},
	// 微信签约
	async onclickSign () {
		if (!this.data.info || !this.data.isOk) return;
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		wx.uma.trackEvent('truck_binding_account_successful_to_signing');
		util.showLoading('加载中');
		let params = {
			dataComplete: 0,// 资料已完善
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			orderId: app.globalData.orderInfo.orderId,// 订单id
			contractType: 3,// 签约类型：1-通行费，2-服务费，3-保证金
			needSignContract: true // 是否需要签约 true-是，false-否
		};
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
