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
		cardInfo: undefined,
		list: [],
		totalPage: 2,
		page: 0,
		bankList: [],
		available: false, // 按钮是否可点击
		isRequest: false// 是否请求中
	},
	async onShow () {
		app.globalData.bankCardInfo.accountNo = app.globalData.bankCardInfo.accountNo.substr(0, 4) + ' *** *** ' + app.globalData.bankCardInfo.accountNo.substr(-4);
		this.setData({
			cardInfo: app.globalData.bankCardInfo
		});
		await this.fetchList();
	},
	// 页面上拉触底事件的处理函数
	async onReachBottom () {
		if (this.data.page > this.data.totalPage) return;
		await this.fetchList();
	},
	async onPullDownRefresh () {
		this.setData({
			list: [],
			loaded: false,
			page: 0
		});
		await this.fetchList(() => { wx.stopPullDownRefresh(); });
	},
	// 加载列表
	async fetchList (callback) {
		this.setData({
			page: this.data.page + 1
		});
		util.showLoading({title: '加载中'});
		let params = {
			beginDate: '2021-05-10',
			endDate: '2021-05-21',
			queryMode: this.data.page === 1 ? 1 : 3,// 查询方式1-首次查询2-上一页3-下一页 必填
			page: this.data.page,
			pageSize: 10
		};
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/detailAccount', params);
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
