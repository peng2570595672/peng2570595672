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
		beginDate: undefined,
		endDate: undefined,
		nextpageFlag: 0,// 是否向下翻页
		currentMonth: 0,// 当前月份
		list: [],
		page: 0,
		bankList: [],
		available: false, // 按钮是否可点击
		isRequest: false// 是否请求中
	},
	async onShow () {
		app.globalData.bankCardInfo.accountNo = app.globalData.bankCardInfo.accountNo.substr(0, 4) + ' *** *** ' + app.globalData.bankCardInfo.accountNo.substr(-4);
		const timestamp = Date.parse(new Date());
		const date = new Date(timestamp);
		this.setData({
			currentMonth: +util.formatTime(date).slice(5, 7),
			beginDate: `${util.formatTime(date).slice(0, 8)}01`,
			endDate: `${util.formatTime(date).slice(0, 10)}`,
			cardInfo: app.globalData.bankCardInfo
		});
		await this.fetchList();
	},
	async bindDateChange (e) {
		this.setData({
			currentMonth: +e.detail.value.slice(5, 7),
			beginDate: `${e.detail.value}-01`,
			endDate: `${e.detail.value}-${this.getCurrentMonthDayNum(e.detail.value)}`,
			cardInfo: app.globalData.bankCardInfo,
			list: [],
			page: 0
		});
		await this.fetchList();
	},
	// 计算这个月有多少天
	getCurrentMonthDayNum (time) {
		let currentMonth = +time.slice(5, 7);
		let currentYear = +time.slice(0, 4);
		let dayAllThisMonth = 31;
		if (currentMonth !== 12) {
			let currentMonthStartDate = new Date(currentYear + '/' + currentMonth + '/01'); // 本月1号的日期
			let nextMonthStartDate = new Date(currentYear + '/' + (currentMonth + 1) + '/01'); // 下个月1号的日期
			dayAllThisMonth = (nextMonthStartDate - currentMonthStartDate) / (24 * 3600 * 1000);
		}
		return dayAllThisMonth;
	},
	// 页面上拉触底事件的处理函数
	async onReachBottom () {
		if (!this.data.nextpageFlag) return;
		await this.fetchList();
	},
	async onPullDownRefresh () {
		this.setData({
			list: [],
			page: 0
		});
		await this.fetchList(() => { wx.stopPullDownRefresh(); });
	},
	// 加载列表
	async fetchList (callback) {
		if (!this.data.page) this.data.page = 0;
		this.setData({
			page: this.data.page + 1
		});
		util.showLoading({title: '加载中'});
		let params = {
            bankAccountId: app.globalData.bankCardInfo.bankAccountId,
			beginDate: app.globalData.test ? '2021-06-01' : this.data.beginDate,
			endDate: app.globalData.test ? '2021-06-01' : this.data.endDate,
			queryMode: this.data.page === 1 ? 1 : 3,// 查询方式1-首次查询2-上一页3-下一页 必填
			page: this.data.page,
			pnBusidate: this.data.page > 1 ? this.data.list[this.data.list.length - 1].busidate : '',
			pnRowRecord: this.data.page > 1 ? this.data.list[this.data.list.length - 1].rowRecord : '',
			pageSize: 10
		};
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/detailAccount', params);
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		let record = result.data.page;
		let list = result.data.orderDetail || [];
		this.setData({
			nextpageFlag: result.data.nextpageFlag,
			list: this.data.list.concat(list),
			page: +record
		});
	},
	onClickRecharge () {
		util.go(`/pages/account_management/account_recharge/account_recharge`);
	}
});
