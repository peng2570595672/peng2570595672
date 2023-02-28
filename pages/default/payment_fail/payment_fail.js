/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isRequest: false,
		isMainProcess: false
	},
	async onLoad (options) {
		if (options.type === 'main_process') {
			this.setData({isMainProcess: true});
		}
	},
	// 发起通通券扣款
	async deductByContractThird () {
		const result = await util.getDataFromServersV2('consumer/order/deductByContractThird', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			await this.getOrderInfo();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async getOrderInfo () {
		const result = await util.getDataFromServersV2('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '3'
		});
		if (!result) return;
		if (result.code === 0) {
			if (result.data.product?.ttDeductStatus === 0) {
				util.showToastNoIcon('扣款失败');
			} else {
				util.showToastNoIcon('扣款成功');
				this.submitOrder();
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 提交订单
	async submitOrder () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		util.showLoading('加载中');
		let params = {
			dataComplete: 1,// 资料已完善
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			orderId: app.globalData.orderInfo.orderId
		};
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({isRequest: false});
		if (!result) return;
		if (result.code === 0) {
			util.go(`/pages/default/processing_progress/processing_progress?orderId=${app.globalData.orderInfo.orderId}&type=main_process`);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	onUnload () {
		if (this.data.isMainProcess) {
			wx.switchTab({
				url: '/pages/Home/Home'
			});
		}
	}
});
