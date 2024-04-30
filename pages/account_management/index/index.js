/**
 * @author 老刘
 * @desc 账户管理
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		accountList: [],// accountType 1-权益账户  2-货车预充值 3-交行 4-工行 5-保证金
		etcList: [], // 预充流程且审核通过订单
		bocomEtcList: [] // 交行二类户流程且审核通过订单
	},
	async onLoad (options) {
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		} else {
			const etcList = app.globalData.myEtcList.filter(item => item.flowVersion === 4 && item.auditStatus === 2); // 是否有预充流程 & 已审核通过订单
			const bocomEtcList = app.globalData.myEtcList.filter(item => item.flowVersion === 7 && item.auditStatus === 2); // 是否有交行二类户 & 已审核通过订单
			this.setData({
				etcList,
				bocomEtcList
			});
			let requestList = [await this.getRightAccount(), await this.getCurrentEquity()];
			await Promise.all(requestList);
			if (this.data.etcList.length) {
				this.data.etcList.map(async (item, index) => {
					this.getQueryWallet(item, this.data.bocomEtcList);
				});
			} else if (this.data.bocomEtcList.length) {
				this.data.bocomEtcList.map(async (item, index) => {
					await this.getBocomOrderBankConfigInfo(item);
				});
			} else {
				this.getAccountList();
			}
		}
	},
	async onShow () {
		await util.getMemberStatus();
		const pages = getCurrentPages();
		const currPage = pages[pages.length - 1];
		if (currPage.__data__.isReload) {
			this.setData({
				accountList: []
			});
			await this.getRightAccount();
			await this.getCurrentEquity();
			if (this.data.etcList.length) {
				this.data.etcList.map(async (item, index) => {
					this.getQueryWallet(item, this.data.bocomEtcList);
				});
			} else if (this.data.bocomEtcList.length) {
				this.data.bocomEtcList.map(async (item, index) => {
					await this.getBocomOrderBankConfigInfo(item);
				});
			} else {
				this.getAccountList();
			}
		}
	},
	getAccountList () {
		let list = app.globalData.myEtcList.filter(item => item.obuStatus === 1 || item.obuStatus === 5);
		list = this.sortDataArray(list);
		let vehList = [];
		list.map(item => {
			vehList.push(item.vehPlates);
		});
		this.data.accountList = this.sortVehList(this.data.accountList, vehList);
		this.setData({
			accountList: this.data.accountList
		});
	},
	// sortList 排序列表  referToList 参照排序列表
	// 使用   array.sort（callback ） 来进行排序， 而排序的方法中 使用  参照数组中的  index 来进行大小比较
	sortVehList (sortList, referToList) {
		sortList.sort((a,b) => {
			return referToList.indexOf(a.vehPlates) - referToList.indexOf(b.vehPlates);
		});
		return sortList;
	},
	sortDataArray (dataArray) {
		return dataArray.sort(function (a, b) {
			// 首次激活时间
			if (b.dateLineActivation && a.dateLineActivation) {
				return Date.parse(b.dateLineActivation.replace(/-/g, '/')) - Date.parse(a.dateLineActivation.replace(/-/g, '/'));
			}
		});
	},
	async getBocomOrderBankConfigInfo (orderInfo) {
		// 获取订单银行配置信息
		const result = await util.getDataFromServersV2('/consumer/member/bcm/queryBalance', {
			orderId: orderInfo.id,
			cardType: '01'
		});
		if (result.code) {
			util.showToastNoIcon(result.message);
		} else {
			let info;
			if (app.globalData.memberStatusInfo?.accountList.length) {
				info = app.globalData.memberStatusInfo.accountList.find(accountItem => accountItem.orderId === orderInfo.id);
			}
			result.data.vehPlates = orderInfo.vehPlates;
			result.data.accountNo = info.accountNo;
			result.data.orderId = orderInfo.id;
			result.data.accountType = 3;
			this.data.accountList.push(result.data);
			this.setData({
				accountList: this.data.accountList
			});
			this.getAccountList();
		}
	},
	async getRightAccount () {
		const result = await util.getDataFromServersV2('/consumer/member/right/account', {
			page: 1,
			pageSize: 1
		});
		if (result.code) {
			util.showToastNoIcon(result.message);
		} else {
			result.data.map(item => {
				item.accountType = 1;
			});
			this.data.accountList = [...this.data.accountList, ...result.data];
			this.setData({
				accountList: this.data.accountList
			});
		}
	},
	onClickAccountDetails (e) {
		const type = +e.currentTarget.dataset.type;
		const index = +e.currentTarget.dataset.index;
		app.globalData.orderInfo.orderId = this.data.accountList[index].orderId;
		wx.uma.trackEvent('account_management_for_index_to_account_details');
		if (type === 2) {
			// 交行
			app.globalData.accountChannelInfo = {
				type: 2,
				orderId: this.data.accountList[index].orderId,
				money: this.data.accountList[index]?.total_amount || 0,
				vehPlates: this.data.accountList[index]?.vehPlates || ''
			};
			util.go(`/pages/account_management/bocom_account_details/bocom_account_details`);
			return;
		}
		util.go(`/pages/account_management/account_details/account_details`);
	},
	// 绑定卡
	onClickBindBankCard (e) {
		const type = +e.currentTarget.dataset.type;
		const index = +e.currentTarget.dataset.index;
		app.globalData.orderInfo.orderId = this.data.accountList[index].orderId;
		wx.uma.trackEvent('account_management_for_index_to_bind_bank_card');
		if (type === 2) {
			util.alert({
				title: ``,
				content: `确定要变更银行卡吗?`,
				showCancel: true,
				confirmColor: '#576B95',
				cancelColor: '#000000',
				cancelText: '点错了',
				confirmText: '确认',
				confirm: () => {
					util.go(`/pages/account_management/new_binding/new_binding?type=2`);
				},
				cancel: () => {}
			});
			return;
		}
		util.go(`/pages/account_management/bind_bank_card/bind_bank_card`);
	},
	onClickPay (e) {
		const type = +e.currentTarget.dataset.type;
		const index = +e.currentTarget.dataset.index;
		app.globalData.orderInfo.orderId = this.data.accountList[index].orderId;
		util.go(`/pages/account_management/account_recharge/account_recharge?type=${type}`);
	},
	// 圈存
	onClickOBU (e) {
		const type = +e.currentTarget.dataset.type;
		const index = +e.currentTarget.dataset.index;
		app.globalData.orderInfo.orderId = this.data.accountList[index].orderId;
		if (type === 2) {
			app.globalData.accountChannelInfo = {
				type: 2,
				orderId: this.data.accountList[index].orderId,
				money: this.data.accountList[index]?.total_amount || 0,
				vehPlates: this.data.accountList[index]?.vehPlates || ''
			};
		}
		util.go(`/pages/obu/add/add?type=${type}`);
	},
	// 预充模式-账户信息查询
	async getQueryWallet (item, bocomEtcList) {
		const result = await util.getDataFromServersV2('consumer/order/third/queryWallet', {
			orderId: item.id,
			pageSize: 1
		});
		util.hideLoading();
		if (!result) return;
		if (result.code === 0) {
			result.data.vehPlates = item.vehPlates;
			result.data.orderId = item.id;
			result.data.accountType = 2;
			this.data.accountList = this.data.accountList.concat(result.data);
			this.setData({
				accountList: this.data.accountList
			});
			if (bocomEtcList.length) {
				bocomEtcList.map(async (item, index) => {
					await this.getBocomOrderBankConfigInfo(item);
				});
			} else {
				this.getAccountList();
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 通行权益金查询
	async getCurrentEquity () {
		let params = {
			page: this.data.page,
			pageSize: 10
		};
		const result = await util.getDataFromServersV2('/consumer/member/depositAccount/pageList', params);
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		if (result.data.length) {
			result.data.map(item => {
				item.accountType = 5;
			});
			this.data.accountList = [...this.data.accountList, ...result.data];
			this.setData({
				accountList: this.data.accountList
			});
		}
	},
	// 获取办理进度
	async getProcessingProgress (e) {
		const id = e.currentTarget.dataset.id;
		util.go(`/pages/account_management/pay_method/pay_method?orderId=${id}`);
	},
	goAccountDetails (e) {
		const id = e.currentTarget.dataset.id;
		util.go(`/pages/account_management/precharge_account_details/precharge_account_details?Id=${id}`);
	},
	// @cyl
	// 押金模式的 账户明细页面
	async goAccountDetailsMargin (e) {
		const index = e.currentTarget.dataset.index;
		util.go(`/pages/account_management/deposit_account_details/deposit_account_details?id=${this.data.accountList[index].id}`);
	},
	// 押金模式的 充值页面
	btnRecharge (e) {
		const Id = e.currentTarget.dataset.id;
		util.go(`/pages/account_management/margin_recharge_model/margin_recharge_model?Id=${Id}`);
	},
	// 通行权益金 账户明细页面
	goCurrentEquity (e) {
		const id = e.currentTarget.dataset.id;
		util.go(`/pages/account_management/current_equity/current_equity?id=${id}`);
	}
});
