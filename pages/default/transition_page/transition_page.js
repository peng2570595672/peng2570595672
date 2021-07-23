/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		orderInfo: undefined
	},
	async onLoad () {
		await this.getSchedule();
	},
	// 查询车主服务签约
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
	async next () {
		if (this.data.orderInfo.flowVersion === 3) {
			await this.getSteps();
			return;
		}
		this.selectComponent('#notSigningPrompt').show();
	},
	// 获取选装签约步骤
	async getSteps () {
		const result = await util.getDataFromServersV2('consumer/etc/qtzl/getSteps', {
			orderId: app.globalData.orderInfo.orderId,
			mobile: this.data.orderInfo.cardMobilePhone
		});
		if (!result) return;
		if (result.code === 0) {
			// 1用户需登录，走发送短信步骤 2用户需开户，走用户开户步骤，其余值走获取签约列表步骤
			let stepNum = result.data.stepNum;
			if (stepNum === 1) {
				this.selectComponent('#verifyCode').show();
			} else if (stepNum === 2) {
				await this.openAccountPersonal();
			} else {
				util.go(`/pages/default/choose_bank_and_bind_veh/choose_bank_and_bind_veh`);
			}
		} else if (result.code === 0) {
			// 登录已过期
			this.selectComponent('#verifyCode').show();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 开户
	async openAccountPersonal () {
		util.showLoading({
			title: '请求中...'
		});
		const result = await util.getDataFromServersV2('consumer/etc/qtzl/openAccountPersonal', {
			orderId: app.globalData.orderInfo.orderId,
			mobile: this.data.orderInfo.cardMobilePhone
		});
		if (!result) return;
		if (result.code === 0) {
			util.go(`/pages/default/choose_bank_and_bind_veh/choose_bank_and_bind_veh`);
		} else {
			util.showToastNoIcon(result.message);
		}
	}
});
