/**
 * @author 老刘
 * @desc 账户管理
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		navbarHeight: app.globalData.navbarHeight,
		equityList: []
	},
	async onLoad (options) {
	},
	async onShow () {
		await this.getRightAccount();
	},
	async getRightAccount () {
		const result = await util.getDataFromServersV2('/consumer/member/right/account', {
			page: 1,
			pageSize: 1
		});
		if (result.code) {
			util.showToastNoIcon(result.message);
		} else {
			this.setData({
				equityList: result.data
			});
		}
	},
	async handleAccount (e) {
		const index = e.target.dataset.index;
		const item = this.data.equityList[index];
		const result = await util.getDataFromServersV2('/consumer/order/walfare/noPassLogin', {
			accountId: item.id
		});
		console.log(result);
	}
});
