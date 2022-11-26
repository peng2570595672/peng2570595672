/**
 * @author 老刘
 * @desc 账户管理
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		prechargeList: [],
		etcList: [], // 预充流程且审核通过订单
		bocomEtcList: [], // 交行二类户流程且审核通过订单
		prechargeInfo: {},
		bocomInfo: {}, // 交行二类户信息
		bocomInfoList: [], // 交行二类户信息
		cardInfo: undefined,
		ETCMargin: []
	},
	async onLoad (options) {
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		} else {
			const etcList = app.globalData.myEtcList.filter(item => item.flowVersion === 4 && item.auditStatus === 2); // 是否有预充流程 & 已审核通过订单
			const bocomEtcList = app.globalData.myEtcList.filter(item => item.flowVersion === 7 && item.auditStatus === 2); // 是否有交行二类户 & 已审核通过订单
			const ETCMargin1 = app.globalData.myEtcList.filter(item => item.pledgeType === 4 && (item.pledgeStatus === 1 || item.pledgeStatus === 2));	// 是否押金模式
			console.log(ETCMargin1);
			this.setData({
				etcList,
				bocomEtcList,
				ETCMargin: ETCMargin1
			});
			bocomEtcList.map(async item => {
				await this.getBocomOrderBankConfigInfo(item);
			});
			etcList.map(async item => {
				await this.getQueryWallet(item);
			});
		}
	},
	async onShow () {
		// await util.getV2BankId();
		// app.globalData.bankCardInfo.accountNo = app.globalData.bankCardInfo.accountNo.substr(0, 4) + ' *** *** ' + app.globalData.bankCardInfo.accountNo.substr(-4);
		// this.setData({
		// 	cardInfo: app.globalData.bankCardInfo
		// });
		const ETCMargin1 = app.globalData.myEtcList.filter(item => item.pledgeType === 4 && (item.pledgeStatus === 1 || item.pledgeStatus === 2));	// 是否押金模式且已支付
		await util.getMemberStatus();
		const pages = getCurrentPages();
		const currPage = pages[pages.length - 1];
		if (currPage.__data__.isReload) {
			this.setData({
				prechargeList: [],
				bocomInfoList: [],
				ETCMargin: ETCMargin1
			});
			this.data.etcList.map(async item => {
				await this.getQueryWallet(item);
			});
			this.data.bocomEtcList.map(async item => {
				await this.getBocomOrderBankConfigInfo(item);
			});
		}
		console.log(this.data.ETCMargin);
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
			let list = this.data.bocomInfoList;
			result.data.vehPlates = orderInfo.vehPlates;
			result.data.accountNo = info.accountNo;
			list.push(result.data);
			this.setData({
				bocomInfoList: list
			});
		}
	},
	onClickAccountDetails (e) {
		const type = +e.currentTarget.dataset.type;
		const index = +e.currentTarget.dataset.index;
		app.globalData.orderInfo.orderId = this.data.bocomEtcList[index].id;
		wx.uma.trackEvent('account_management_for_index_to_account_details');
		if (type === 2) {
			// 交行
			app.globalData.accountChannelInfo = {
				type: 2,
				orderId: this.data.bocomEtcList[index].id,
				money: this.data.bocomInfoList[index]?.total_amount || 0,
				vehPlates: this.data.bocomInfoList[index]?.vehPlates || ''
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
		app.globalData.orderInfo.orderId = this.data.bocomEtcList[index].id;
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
		app.globalData.orderInfo.orderId = this.data.bocomEtcList[index].id;
		util.go(`/pages/account_management/account_recharge/account_recharge?type=${type}`);
	},
	// 圈存
	onClickOBU (e) {
		const type = +e.currentTarget.dataset.type;
		const index = +e.currentTarget.dataset.index;
		app.globalData.orderInfo.orderId = this.data.bocomEtcList[index].id;
		if (type === 2) {
			app.globalData.accountChannelInfo = {
				type: 2,
				orderId: this.data.bocomEtcList[index].id,
				money: this.data.bocomInfoList[index]?.total_amount || 0,
				vehPlates: this.data.bocomInfoList[index]?.vehPlates || ''
			};
		}
		util.go(`/pages/obu/add/add?type=${type}`);
	},
	// 获取订单信息
	async getStatus () {
		let params = {
			openId: app.globalData.openId
		};
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', params);
		if (result.code === 0) {
			app.globalData.myEtcList = result.data;
			const etcList = app.globalData.myEtcList.filter(item => item.flowVersion === 4 && item.auditStatus === 2); // 是否有预充流程 & 已审核通过订单
			const bocomEtcList = app.globalData.myEtcList.filter(item => item.flowVersion === 7 && item.auditStatus === 2); // 是否有交行二类户 & 已审核通过订单
			this.setData({
				etcList,
				bocomEtcList
			});
			bocomEtcList.map(async item => {
				await this.getBocomOrderBankConfigInfo(item);
			});
			etcList.map(async item => {
				await this.getQueryWallet(item);
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 预充模式-账户信息查询
	async getQueryWallet (item) {
		const result = await util.getDataFromServersV2('consumer/order/third/queryWallet', {
			orderId: item.id,
			pageSize: 1
		});
		util.hideLoading();
		console.log('货车数据：',result);
		if (!result) return;
		if (result.code === 0) {
			result.data.vehPlates = item.vehPlates;
			result.data.orderId = item.id;
			this.data.prechargeList = this.data.prechargeList.concat(result.data);
			this.setData({
				prechargeList: this.data.prechargeList
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 获取办理进度
	async getProcessingProgress (e) {
		const id = e.currentTarget.dataset.id;
		util.go(`/pages/account_management/pay_method/pay_method?orderId=${id}`);
		// const result = await util.getDataFromServersV2('consumer/order/transact-schedule', {
		// 	orderId: id
		// });
		// if (!result) return;
		// await this.onClickRecharge(id, result.data);
	},
	async onClickRecharge (id, info) {
		util.showLoading('正在获取充值账户信息....');
		const result = await util.getDataFromServersV2('consumer/order/third/queryProcessInfo', {
			orderId: id
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
			result.data.holdBalance = info.holdBalance;
			this.setData({
				prechargeInfo: result.data || {}
			});
			this.selectComponent('#rechargePrompt').show();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	goAccountDetails (e) {
		const id = e.currentTarget.dataset.id;
		util.go(`/pages/account_management/precharge_account_details/precharge_account_details?orderId=${id}`);
	},
	// @cyl
	// 押金模式的 账户明细页面
	async goAccountDetailsMargin (e) {
		const memberId = e.currentTarget.dataset.memberid;
		const Id = e.currentTarget.dataset.id;
		util.go(`/pages/account_management/precharge_account_details/precharge_account_details?memberId=${memberId}&margin=true&Id=${Id}`);
	},
	// 押金模式的 充值页面
	btnRecharge (e) {
		const Id = e.currentTarget.dataset.id;
		util.go(`/pages/account_management/margin_recharge_model/margin_recharge_model?Id=${Id}`);
	}
});
