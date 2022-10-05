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
		prechargeAmount: 0, // 约定金额
		info: {},
		prechargeInfo: {},
		billInfo: {},
		beginDate: undefined,
		endDate: undefined,
		nextpageFlag: false, // 是否向下翻页
		currentMonth: 0, // 当前月份
		list: [],
		page: 0,
		available: false, // 按钮是否可点击
		isRequest: false, // 是否请求中
		margin: false, // 是否押金模式的
		flag: false // 是否支付 true->已支付
	},
	async onLoad (options) {
		console.log(options);
		const timestamp = Date.parse(new Date());
		const date = new Date(timestamp);
		this.setData({
			memberId: options.memberId,
			currentMonth: +util.formatTime(date).slice(5, 7),
			beginDate: `${util.formatTime(date).slice(0, 8)}01`,
			endDate: `${util.formatTime(date).slice(0, 10)}`,
			margin: options.margin,
			orderId: options.Id,
			flag: options.select
		});
		// 判断 margin ，如果为 true 执行押金的账单详细
		if (this.data.margin) {
			await this.marginModeBillDetails();
			if (this.data.flag) {
				this.getStatus();
			}
		} else {
			if (app.globalData.userInfo.accessToken) {
				let requestList = [await this.getFailBillDetails(), await this.fetchList(), await this.getProcessingProgress()];
				util.showLoading();
				await Promise.all(requestList);
				util.hideLoading();
			} else {
				await this.login();
			}
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
						let requestList = [await this.getFailBillDetails(), await this.fetchList(), await this.getProcessingProgress()];
						util.showLoading();
						await Promise.all(requestList);
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
	// 获取办理进度
	async getProcessingProgress () {
		const result = await util.getDataFromServersV2('consumer/order/transact-schedule', {
			orderId: this.data.orderId
		});
		if (!result) return;
		this.setData({
			info: result.data
		});
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
		console.log('-------------------页面上拉触底事件的处理函数', this.data.nextpageFlag);
		if (this.data.nextpageFlag) return;
		if (this.data.margin) {
			this.setData({
				page: 1
			});
			await this.marginModeBillDetails(2);
		} else {
			await this.fetchList();
		}
	},
	// 下拉刷新
	async onPullDownRefresh () {
		if (this.data.margin) {
			this.setData({
				page: 1
			});
			await this.marginModeBillDetails(1);
		} else {
			this.setData({
				list: [],
				page: 0
			});
			await this.fetchList(() => {
				wx.stopPullDownRefresh();
			});
		}
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
			orderId: this.data.orderId,
			startTime: this.data.beginDate,
			endTime: this.data.endDate,
			page: this.data.page,
			pageSize: 10
		};
		const result = await util.getDataFromServersV2('consumer/order/third/queryWallet', params);
		console.log(result);
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		let list = result.data.list || [];
		list.map(item => {
			item.changeMoney = item.changeMoney.toString();
			if (item.changeMoney.includes('-')) item.changeMoney = parseInt(item.changeMoney.substr(1));
		});
		this.setData({
			Wallet: result.data.walletAmount / 100,
			prechargeAmount: result.data.prechargeAmount / 100,
			list: this.data.list.concat(list)
		});
		console.log(this.data.list.length, '----------------------------------', result.data.total);
		if (this.data.list.length >= result.data.total) {
			this.setData({
				nextpageFlag: true
			});
		}
	},
	// 充值支付
	async onProcessingProgress (e) {
		const id = this.data.orderId;
		if (this.data.margin) {
			wx.redirectTo({
				url: `/pages/account_management/margin_recharge_model/margin_recharge_model?Id=${id}`
			});
			// util.go(`/pages/account_management/margin_recharge_model/margin_recharge_model?Id=${this.data.Id}`);
		} else {
			util.go(`/pages/account_management/pay_method/pay_method?orderId=${id}`);
		}
		// const result = await util.getDataFromServersV2('consumer/order/transact-schedule', {
		// 	orderId: id
		// });
		// if (!result) return;
		// await this.onClickRecharge(id, result.data);
	},
	// 充值
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
			result.data.holdBalance = this.data.info.holdBalance;
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
			content: '若您对当前账户余额及变动明细有疑问，或需开具充值手续费发票，请拨打4001-18-4001咨询',
			showCancel: false,
			confirmText: '知道了'
		});
	},
	// 押金模式 的账单明细
	async marginModeBillDetails (number) {
		console.log(number);
		const result = await util.getDataFromServersV2('consumer/order/enusre-money-detail', {
			memberId: this.data.memberId,
			page: number ? (number === 1 ? 1 : ++this.data.page) : 1,
			pageSize: 10,
			orderId: this.data.orderId
		});
		// console.log(result.data);
		let list = result.data.detailData.list || [];
		list.map(item => {
			item.transactionMoney = item.transactionMoney.toString();
			if (item.transactionMoney.includes('-')) item.transactionMoney = parseInt(item.transactionMoney.substr(1));
		});
		if (this.data.page > 1) {
			this.setData({
				Wallet: result.data.amount,
				list: this.data.list.concat(list)
			});
		} else {
			this.setData({
				Wallet: result.data.amount,
				list: list
			});
			wx.stopPullDownRefresh();
		}
		if (this.data.list.length >= result.data.detailData.total && number === 2) {
			this.setData({
				nextpageFlag: true
			});
		}
	},
	// 获取订单信息
	async getStatus () {
		let params = {
			openId: app.globalData.openId
		};
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', params);
		// console.log(result.data);
		if (result.code === 0) {
			app.globalData.myEtcList = result.data;
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async onUnload () {
		const pages = getCurrentPages();
		const prevPage = pages[pages.length - 2]; // 上一个页面
		prevPage.setData({
			isReload: true // 重置状态
		});
		// util.getIsArrearage();
	}
});
