
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		type: 0,
		changeAmount: 0,// 充值金额，单位分
		orderId: app.globalData.orderInfo.orderId // "880106175582965760" //用户车辆订单号
	},
	onLoad (options) {
		const {type, changeAmount} = options;
		this.setData({
			changeAmount,
			type: +type
		});
	},
	async onShow () {
		if (this.data.type === 2) {
			await this.getBocomOrderBankConfigInfo();
		} else {
			this.getRechargeBalance();
		}
	},
	async getBocomOrderBankConfigInfo () {
		// 获取订单银行配置信息
		const result = await util.getDataFromServersV2('/consumer/order/getOrderBankConfigInfo', {
			orderId: this.data.orderId
		});
		if (result.code) {
			util.showToastNoIcon(result.message);
		} else {
			this.setData({
				changeAmount: result.data?.canLoadAmount || 0
			});
		}
	},
	async onSubmit () {
		if (!this.data.changeAmount) {
			util.showToastNoIcon('请先充值');
			return;
		}
		util.go(`/pages/obu/bluetooth/bluetooth?rechargeBalance=${this.data.changeAmount}&orderId=${this.data.orderId}&type=${this.data.type}`); // 链接蓝牙设备
	},
	// 可充值圈存金额查询
	async getRechargeBalance () {
		const result = await util.getDataFromServersV2('/consumer/order/after-sale-record/rechargeBalance',{orderId: this.data.orderId});
		if (result.code === 0) {
			this.setData({
				changeAmount: result.data.rechargeBalance
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	}

});
