/**
 * @author 老刘
 * @desc 账户管理
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		list: [],
		totalPage: 2,
		page: 0,
		bankList: [],
		available: false, // 按钮是否可点击
		isRequest: false// 是否请求中
	},
	onShow () {
		this.fetchList();
	},
	// 页面上拉触底事件的处理函数
	onReachBottom () {
		console.log(';;;;;');
		if (this.data.page > this.data.totalPage) return;
		this.fetchList();
	},
	onPullDownRefresh () {
		console.log('----');
		this.setData({
			list: [],
			loaded: false,
			page: 0
		});
		this.fetchList(() => { wx.stopPullDownRefresh(); });
	},
	// 加载列表
	async fetchList (callback) {
		return;
		this.setData({
			page: this.data.page + 1
		});
		util.showLoading({title: '加载中'});
		let params = {
			page: this.data.page,
			pageSize: 10
		};
		const result = await util.getDataFromServersV2('consumer/member/icbc/rechargePage', params);
		if (!result) return;
		if (result.code === 0) {
			let data = result.data;
			let record = data.record;
			let list = record.list || [];
			this.setData({
				balanceText,
				list: this.data.list.concat(list),
				page: +record.page,
				totalPage: +record.pages
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	onClickRecharge () {
		util.go(`/pages/account_management/account_recharge/account_recharge`);
	}
});
