/**
 * @author 老刘
 * @desc 账户管理
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		cardInfo: undefined,
		beginDate: undefined,
		endDate: undefined,
		nextpageFlag: 0,// 是否向下翻页
		currentMonth: 0,// 当前月份
		list: [],
		page: 1,
		bankList: [],
		vehPlates: undefined,
		inqBegIndRec: '',
		holdBalance: 0,
		type: 0,// 0 预充模式  1 工行  2 交行
		available: false, // 按钮是否可点击
		isRequest: false// 是否请求中
	},
	async onLoad (options) {
		console.log(options);
		this.setData({
			type: +options.type,
			holdBalance: options.money,
			vehPlates: options.vehPlates
		});
		// 查询是否欠款
		await util.getIsArrearage();
	},
	async onShow () {
		const timestamp = Date.parse(new Date());
		const date = new Date(timestamp);
		this.setData({
			page: 1,
			nextpageFlag: 0,
			list: [],
			currentMonth: +util.formatTime(date).slice(5, 7),
			beginDate: `${util.formatTime(date).slice(0, 8)}01`,
			endDate: `${util.formatTime(date).slice(0, 10)}`
		});
		await this.fetchList();
	},
	async bindDateChange (e) {
		this.setData({
			currentMonth: +e.detail.value.slice(5, 7),
			beginDate: `${e.detail.value}-01`,
			endDate: `${e.detail.value}-${this.getCurrentMonthDayNum(e.detail.value)}`,
			list: [],
			page: 1
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
			page: 1
		});
		await this.fetchList(() => { wx.stopPullDownRefresh(); });
	},
	// 加载列表
	async fetchList (callback) {
		if (!this.data.page) this.data.page = 1;
		util.showLoading({title: '加载中'});
		let params = {
			orderId: app.globalData.orderInfo.orderId,
			inquiryStartTime: this.data.beginDate.replace(/-/g,''),// 起始查询日期；格式 yyyymmdd
			inquiryEndTime: this.data.endDate.replace(/-/g,''),// 结束查询日期 格式 yyyymmdd
			beginTime: '000000', // 起始查询时间；hhmmss；翻页前后此时间要保持一致
			endTime: '235959', // 结束查询时间；hhmmss；翻页前后此时间要保持一致
			isFirstRequest: this.data.page === 1 ? 1 : 0, // 是否为第一次请求；0代表非首次，1代表首次
			startRow: this.data.page > 1 ? this.data.list.length - 1 : 1, // 开始行；首次请求必须从1开始；非首次应大于1
			endRow: this.data.page > 1 ? this.data.list.length - 1 + 10 : 10, // 结束行
			inqBegIndRec: this.data.inqBegIndRec, // 查询起始标识记录；首次访问时为空，进行翻页操作时，将上一次请求获得值作为请求枚举值上送。为空即可
			endFlag: this.data.nextpageFlag, // 查询状态 第一次请求默认为0，翻页操作时，将上一次请求返回的查询状态值作为本次的入参枚举值上送
			dcFlag: '' // 借贷标志；枚举值：C: 入账; D: 出账；空值或者不传：出入账；
		};
		const result = await util.getDataFromServersV2('consumer/member/bcm/transactionDetails', params);
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		let list = result.data.response_data || [];
		list.map(item => {
			if (item.voucher_bus_remark.includes('快捷网关')) {
				item.accountType = 1;// 服务费划扣
			}
			if (item.voucher_bus_remark.includes('资金转入')) {
				item.accountType = 2;// 充值
			}
			if (item.voucher_bus_remark.includes('A097')) {
				item.accountType = 3;// 通行费划扣
			}
			if (item.voucher_bus_remark.includes('转账')) {
				item.accountType = 4;// 手机银行转账
			}
			item.transactionDate = `${item.transaction_date.substring(0, 4)}-${item.transaction_date.substring(4, 6)}-${item.transaction_date.substring(6, 8)}`;
		});
		this.setData({
			inqBegIndRec: result.data.inq_beg_ind_rec,
			nextpageFlag: result.data.end_flag,
			list: this.data.list.concat(list),
			page: this.data.page + 1
		});
	},
	onClickRecharge () {
		wx.uma.trackEvent('account_management_for_account_details_to_recharge');
		util.go(`/pages/account_management/account_recharge/account_recharge?type=${this.data.type}`);
	},
	onClickObu () {
		util.go(`/pages/obu/add/add?type=${this.data.type}`);
	}
});
