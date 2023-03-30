/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		orderInfo: {},
		contractStatus: 0, // 1已签约
		citicBank: false	// false 不是中信银行联名套餐
	},
	async onLoad (options) {
		console.log(options);
		if (options.citicBank || options.citicBank === 'true') {
			this.setData({
				citicBank: true
			});
		}
		await this.queryContract();
		await this.getSchedule();
		// 查询是否欠款
		await util.getIsArrearage();
	},
	// 查询办理进度
	async getSchedule () {
		const result = await util.getDataFromServersV2('consumer/order/transact-schedule', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
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
	// 微信签约
	async next () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		if (this.data.orderInfo.flowVersion !== 1) {
			util.go('/pages/default/transition_page/transition_page');
			return;
		}
		util.showLoading('加载中');
		let params = {
			dataComplete: 1,// 已完善资料,进入待审核
			orderId: app.globalData.orderInfo.orderId,// 订单id
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		if (this.data.contractStatus === 1) {
			delete params.needSignContract;
		}
		wx.uma.trackEvent('payment_successful_next');
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({isRequest: false});
		if (!result) return;
		if (result.code === 0) {
			if (this.data.contractStatus === 1) {
				// 1.0 已签约
				util.go(`/pages/default/processing_progress/processing_progress?type=main_process&orderId=${app.globalData.orderInfo.orderId}`);
				return;
			}
			let res = result.data.contract;
			// 签约车主服务 2.0
			app.globalData.signAContract = -1;
			app.globalData.belongToPlatform = app.globalData.platformId;
			app.globalData.isNeedReturnHome = true;
			util.weChatSigning(res);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	go () {
		util.go(`pages/default/information_list/information_list?citicBank=true`);
	},
	onUnload () {
		wx.switchTab({
			url: '/pages/Home/Home'
		});
	}
});
