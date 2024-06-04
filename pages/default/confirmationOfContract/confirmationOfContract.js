const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		orderInfo: {},
		contractStatus: 0, // 1已签约
		contractStatus_jcx: 0// 1已签约
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
		// await this.getSchedule();
		// 查询是否欠款
		// await util.getIsArrearage();
	},
	async onShow () {
		await this.queryContract(1);
		await this.queryContract(2);
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
	// 查询驾乘险服务签约状态
	async queryContract (contractType) {
		const result = await util.getDataFromServersV2('consumer/order/severalContractQuery', {
			orderId: app.globalData.orderInfo.orderId,
			contractType // 1-通行费，2-服务费，3-保证金
		});
		if (!result) return;
		if (result.code === 0) {
			if (contractType === 1) {
				this.setData({
					contractStatus: result.data.contractStatus // 车主服务签约状态
				});
			}
			if (contractType === 2) {
				this.setData({
					contractStatus_jcx: result.data.contractStatus // 驾乘险服务签约状态
				});
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 微信签约
	async next (e) {
		let contractType = e.currentTarget.dataset.type;
		if ((contractType === 1 && this.data.contractStatus === 1) || (contractType === 2 && this.data.contractStatus_jcx === 1)) {
			util.showToastNoIcon('您已签约，请勿重复签约');
			return;
		}
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
			contractType, // 1-通行费，2-服务费，3-保证金
			severalContract: 1,// 标识多签模式
			needSignContract: true // 是否需要签约 true-是，false-否
		};

		if (this.data.contractStatus === 1) {
			delete params.needSignContract;
		}
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({
			isRequest: false
		});
		if (!result) return;
		if (result.code === 0) {
			// if (this.data.contractStatus === 1) {
			// 	// 1.0 已签约
			// 	util.go(`/pages/default/processing_progress/processing_progress?type=main_process&orderId=${app.globalData.orderInfo.orderId}`);
			// 	return;
			// }
			let res = result.data.contract;
			if (contractType === 1) {
				// 签约车主服务 2.0
				app.globalData.signAContract = -1;
				app.globalData.belongToPlatform = app.globalData.platformId;
				// app.globalData.isNeedReturnHome = true;
			}
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
			util.showToastNoIcon('检查完成所有签约');
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
