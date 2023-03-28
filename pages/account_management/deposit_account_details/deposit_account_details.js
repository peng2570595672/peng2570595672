/**
 * @author 老刘
 * @desc 账户管理
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		Wallet: 0,
		info: {},
		beginDate: undefined,
		endDate: undefined,
		nextpageFlag: false, // 是否向下翻页
		currentMonth: 0, // 当前月份
		list: [],
		page: 0,
		available: false, // 按钮是否可点击
		isRequest: false, // 是否请求中
		id: '', // 对应数组下标
		infoData: undefined	// 账户数据
	},
	async onLoad (options) {
		console.log(options);
		const timestamp = Date.parse(new Date());
		const date = new Date(timestamp);
		this.setData({
			id: options.id,
			currentMonth: +util.formatTime(date).slice(5, 7),
			beginDate: `${util.formatTime(date).slice(0, 8)}01`,
			endDate: `${util.formatTime(date).slice(0, 10)}`
		});
		// 判断 margin ，如果为 true 执行押金的账单详细
		if (app.globalData.userInfo.accessToken) {
			await this.fetchList();
			util.hideLoading();
		} else {
			await this.login();
		}
	},
	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: async (res) => {
				const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				});
				if (result.code === 0) {
					result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
					this.setData({
						loginInfo: result.data
					});
					// 已经绑定了手机号
					if (result.data.needBindingPhone !== 1) {
						app.globalData.userInfo = result.data;
						app.globalData.openId = result.data.openId;
						app.globalData.memberId = result.data.memberId;
						app.globalData.mobilePhone = result.data.mobilePhone;
						util.showLoading();
						await this.fetchList();
						util.hideLoading();
					} else {
						wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
						util.go('/pages/login/login/login');
						util.hideLoading();
					}
				} else {
					util.showToastNoIcon(result.message);
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
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
		console.log('-------------------页面上拉触底事件的处理函数', this.data.nextpageFlag);
		if (this.data.nextpageFlag) return;
		await this.fetchList();
	},
	// 下拉刷新
	async onPullDownRefresh () {
		this.setData({
			list: [],
			page: 0
		});
		await this.fetchList(() => {
			wx.stopPullDownRefresh();
		});
	},
	// 加载列表
	async fetchList (callback) {
		if (!this.data.page) this.data.page = 0;
		this.setData({
			page: this.data.page + 1
		});
		util.showLoading({
			title: '加载中'
		});
		let params = {
			startTime: this.data.beginDate + ' 00:00:00',
			endTime: this.data.endDate + ' 23:59:59',
			page: this.data.page,
			pageSize: 10
		};
		const result = await util.getDataFromServersV2('/consumer/member/right/account', params);
		console.log(result);
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		const index = result.data.findIndex(item => item.id === this.data.id);
		let list = result.data[index].detailData.list || [];
		this.setData({
			// Wallet: result.data[index].balance + (result.data[index].serviceFeeBalance || 0),
			Wallet: result.data[index].balance,
			list: this.data.list.concat(list)
			// infoData: result.data[index]
		});
		console.log(this.data.list.length, '----------------------------------', result.data.total);
		if (this.data.list.length >= result.data[index].detailData.total) {
			this.setData({
				nextpageFlag: true
			});
		}
	},
	async onUnload () {
		const pages = getCurrentPages();
		const prevPage = pages[pages.length - 2]; // 上一个页面
		prevPage.setData({
			isReload: true // 重置状态
		});
		// util.getIsArrearage();
	},
	btnIcon () {
		util.alert({
			title: `券额有效期说明`,
			content: `办理了权益券额套餐或综合服务的用户获得的券额3年有效，过期不补`
		});
	}

});
