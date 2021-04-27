/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		number: 0,
		orderInfo: undefined,
		auditStatus: 0
	},
	async onLoad () {
		await this.getSchedule();
	},
	// 查询车主服务签约
	async getSchedule () {
		let that = this;
		const result = await util.getDataFromServersV2('consumer/order/transact-schedule', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				auditStatus: result.data.auditStatus,
				orderInfo: result.data
			});
			if (result.data.autoAuditStatus === 0 && result.data.auditStatus === 0) {
				if (that.data.number >= 4) {
					return;
				}
				this.setData({
					number: that.data.number++
				});
				setTimeout(async () => {
					await that.getSchedule();
				}, 2000);
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async next () {
		if (this.data.auditStatus === 0) {
			this.goHome();
			return;
		}
		if (this.data.auditStatus === 2) {
			this.selectComponent('#notSigningPrompt').show();
			return;
		}
		await this.cancelOrder();
	},
	// 取消订单
	async cancelOrder () {
		const result = await util.getDataFromServersV2('consumer/order/cancel-order', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			this.goHome();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	goHome () {
		wx.reLaunch({
			url: '/pages/Home/Home'
		});
	},
	onClickOnlineService () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	onUnload () {
		this.goHome();
	}
});
