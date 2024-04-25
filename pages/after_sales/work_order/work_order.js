const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		tabIndex: 0,
		tabList: [
			{name: '全部', status: 0},
			{name: '已审核', status: 1},
			{name: '审核中', status: 2},
			{name: '已关闭', status: 3}
		],
		list: []
	},
	onLoad () {
	},
	async onShow () {
		this.handleGetList();
	},
	async handleGetList () {
		const result = await util.getDataFromServersV2('consumer/order/orderAfterSale/getList', {
			tab: this.data.tabList[this.data.tabIndex].status
		}, 'POST', true);
		this.setData({
			list: result.data
		});
	},
	handleTabItem (e) {
		let index = +e.currentTarget.dataset.index;
		this.setData({
			tabIndex: index
		});
		this.handleGetList();
	},
	handleListItem (e) {
		let index = +e.currentTarget.dataset.index;
		const item = this.data.list[index];
		util.go(`/pages/after_sales/work_order_info/work_order_info?id=${item.id}`);
	}
});
