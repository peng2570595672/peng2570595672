const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		orderInfo: {},
		contractStatus: 0, // 1已签约
		contractStatus_jcx: 0,// 1已签约
		contractType: 1
	},
	async onLoad (options) {
		if (options.multiple) {
			// 多发流程
			this.setData({
				multiple: true,
				topProgressBar: 3,
				progressColor: '#fff',
				contractStatus_jcx: 0
			});
		}
		await this.queryContract();
		// await this.getSchedule();
		// 查询是否欠款
		// await util.getIsArrearage();
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
	// 查询驾乘险服务签约
	// async queryContract_jcx () {
	// 	const result = await util.getDataFromServersV2('consumer/order/query-contract', {
	// 		orderId: app.globalData.orderInfo.orderId
	// 	});
	// 	if (!result) return;
	// 	if (result.code === 0) {
	// 		this.setData({
	// 			contractStatus_jcx: result.data.contractStatus
	// 		});
	// 	} else {
	// 		util.showToastNoIcon(result.message);
	// 	}
	// },
	// 微信签约
	async next (contractType = '') {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({
				isRequest: true
			});
		}
		util.showLoading('加载中');
		let params = {
			dataComplete: 1, // 已完善资料,进入待审核
			orderId: app.globalData.orderInfo.orderId, // 订单id
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			contractType,
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
			util.weChatSigning(res);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	validateCar () {
		if (this.data.contractStatus === 1 && this.data.contractStatus_jcx === 1) {
			util.go(`/pages/default/processing_progress/processing_progress?orderId=${app.globalData.orderInfo.orderId}`);
			//  已签约
		} else {
			util.showToastNoIcon('检查是否正常签约');
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
