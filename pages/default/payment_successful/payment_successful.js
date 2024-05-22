/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const {
	handleJumpHunanMini
} = require('../../../utils/utils');
const app = getApp();
Page({
	data: {
		orderInfo: {},
		contractStatus: 0, // 1已签约
		citicBank: false, // false 不是中信银行联名套餐
		isHunan: false, // false 不是湖南信科
		cardBank: 0
	},
	async onLoad (options) {
		if (options.citicBank || options.citicBank === 'true') {
			this.setData({
				citicBank: true
			});
			return;
		}
		if (options.isHunan) {
			// 湖南信科
			this.setData({
				isHunan: true
			});
			return;
		}
		if (options.pro9901) {
			// 9901套餐
			this.setData({
				is9901: true
			});
			return;
		}
		if (options.cardBank) {
			this.setData({
				cardBank: +options.cardBank
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
		if (this.data.isHunan) {
			const result = await util.getDataFromServersV2('consumer/order/order-pay-transaction-info', {
				orderId: app.globalData.orderInfo.orderId
			});
			if (result.code) {
				util.showToastNoIcon(result.message);
				return;
			}
			handleJumpHunanMini(app.globalData.orderInfo.orderId, result.data.outTradeNo);
			return;
		}
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({
				isRequest: true
			});
		}
		if (this.data.orderInfo.flowVersion !== 1) {
			util.go('/pages/historical_pattern/transition_page/transition_page');
			return;
		}
		if (this.data.cardBank) {	// new 信用卡流程
			util.go(`/pages/bank_card/go_to_shenka/go_to_shenka?cardBank=${this.data.cardBank}`);
			return;
		}
		util.showLoading('加载中');
		let params = {
			dataComplete: 1, // 已完善资料,进入待审核
			orderId: app.globalData.orderInfo.orderId, // 订单id
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		if (this.data.contractStatus === 1) {
			delete params.needSignContract;
		}
		wx.uma.trackEvent('payment_successful_next');
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({
			isRequest: false
		});
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
			if (this.data.orderInfo?.isCallBack && (this.data.orderInfo?.orderType === 31 || this.data.orderInfo?.orderType === 51)) {
				util.aiReturn(this, '#popTipComp', app.globalData.orderInfo.orderId, () => {
					util.weChatSigning(res);
				});
			} else {
				util.weChatSigning(res);
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	go () {
		if (this.data.is9901) {
			// 调用获取账户列表 有用户信息则跳过身份证录入环境
			// 跳转上传证件页
			util.go(`/pages/default/information_list/information_list?pro9901=true`);
		} else {
			// 跳转上传证件页
			util.go(`/pages/default/information_list/information_list`);
		}
	},
	onUnload () {
		wx.switchTab({
			url: '/pages/Home/Home'
		});
	}
});
