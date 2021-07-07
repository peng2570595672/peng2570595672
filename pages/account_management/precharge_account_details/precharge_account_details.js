/**
 * @author 老刘
 * @desc 账户管理
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		orderId: undefined,
		Wallet: 0,
		prechargeInfo: {},
		billInfo: {},
		beginDate: undefined,
		endDate: undefined,
		nextpageFlag: 0,// 是否向下翻页
		currentMonth: 0,// 当前月份
		list: [],
		page: 0,
		available: false, // 按钮是否可点击
		isRequest: false// 是否请求中
	},
	async onLoad (options) {
		const timestamp = Date.parse(new Date());
		const date = new Date(timestamp);
		this.setData({
			orderId: options.orderId,
			currentMonth: +util.formatTime(date).slice(5, 7),
			beginDate: `${util.formatTime(date).slice(0, 8)}01`,
			endDate: `${util.formatTime(date).slice(0, 10)}`
		});
		await this.getFailBillDetails();
		await this.fetchList();
	},
	async getFailBillDetails () {
		const result = await util.getDataFromServersV2('consumer/etc/hw-details-fail', {
			orderId: this.data.orderId
		});
		util.hideLoading();
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				billInfo: result.data
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async bindDateChange (e) {
		this.setData({
			currentMonth: +e.detail.value.slice(5, 7),
			beginDate: `${e.detail.value}-01`,
			endDate: `${e.detail.value}-${this.getCurrentMonthDayNum(e.detail.value)}`,
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
			orderId: this.data.orderId,
			startTime: this.data.beginDate,
			endTime: this.data.endDate,
			curPage: this.data.page,
			pageSize: 10
		};
		const result = await util.getDataFromServersV2('consumer/order/third/queryWallet', params);
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		let list = result.data.data || [];
		list.map(item => {
			item.ChangeMoney = item.ChangeMoney.toString();
			if (item.ChangeMoney.includes('-')) item.ChangeMoney = item.ChangeMoney.substr(1);
		});
		this.setData({
			Wallet: result.data.Wallet,
			list: this.data.list.concat(list)
		});
		if (this.data.list.length < result.data.RecCount) this.data.nextpageFlag = 1;
	},
	async onClickRecharge () {
		util.showLoading('正在获取充值账户信息....');
		const result = await util.getDataFromServersV2('consumer/order/third/queryProcessInfo', {
			orderId: this.data.orderId
		});
		util.hideLoading();
		if (!result) return;
		if (result.code === 0) {
			if (!result.data.bankCardNum) {
				setTimeout(() => {
					wx.showToast({
						title: '获取失败',
						icon: 'none',
						duration: 5000
					});
				}, 100);
				return;
			}
			this.setData({
				prechargeInfo: result.data || {}
			});
			this.selectComponent('#rechargePrompt').show();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	onClickToMyOrder () {
		util.go(`/pages/personal_center/my_order/my_order`);
	},
	onClickDoubt () {
		util.alert({
			title: '',
			content: '若您对当前账户余额及变动明细有疑问，请拨打4001-18-4001咨询',
			showCancel: false,
			confirmText: '知道了'
		});
	},
	onUnload () {
		const pages = getCurrentPages();
		const prevPage = pages[pages.length - 2];// 上一个页面
		prevPage.setData({
			isReload: true // 重置状态
		});
	}
});
