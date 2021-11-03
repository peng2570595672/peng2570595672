/**
 * @author 老刘
 * @desc 账户管理
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		prechargeList: [],
		prechargeInfo: {},
		cardInfo: undefined
	},
	async onLoad (options) {
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		} else {
			if (options.needLoadEtc) {
				await this.getStatus();
			} else {
				const etcList = app.globalData.myEtcList.filter(item => item.flowVersion === 4 && item.auditStatus === 2); // 是否有预充流程 & 已审核通过订单
				this.setData({etcList});
				etcList.map(async item => {
					await this.getQueryWallet(item);
				});
			}
			// 查询是否欠款
			await util.getIsArrearage();
		}
	},
	async onShow () {
		// await util.getV2BankId();
		// app.globalData.bankCardInfo.accountNo = app.globalData.bankCardInfo.accountNo.substr(0, 4) + ' *** *** ' + app.globalData.bankCardInfo.accountNo.substr(-4);
		// this.setData({
		// 	cardInfo: app.globalData.bankCardInfo
		// });
		const pages = getCurrentPages();
		const currPage = pages[pages.length - 1];
		if (currPage.__data__.isReload) {
			this.setData({
				prechargeList: []
			});
			this.data.etcList.map(async item => {
				await this.getQueryWallet(item);
			});
		}
	},
	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: (res) => {
				util.getDataFromServer('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				}, () => {
					util.hideLoading();
					util.showToastNoIcon('登录失败！');
				}, async (res) => {
					if (res.code === 0) {
						res.data['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
						this.setData({
							loginInfo: res.data
						});
						// 已经绑定了手机号
						if (res.data.needBindingPhone !== 1) {
							app.globalData.userInfo = res.data;
							app.globalData.openId = res.data.openId;
							app.globalData.memberId = res.data.memberId;
							app.globalData.mobilePhone = res.data.mobilePhone;
							await this.getStatus();
							// 查询是否欠款
							await util.getIsArrearage();
						} else {
							util.hideLoading();
						}
					} else {
						util.hideLoading();
						util.showToastNoIcon(res.message);
					}
				});
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	onClickAccountDetails () {
		wx.uma.trackEvent('account_management_for_index_to_account_details');
		util.go(`/pages/account_management/account_details/account_details`);
	},
	// 绑定卡
	onClickBindBankCard () {
		wx.uma.trackEvent('account_management_for_index_to_bind_bank_card');
		util.go(`/pages/account_management/bind_bank_card/bind_bank_card`);
	},
	// 充值
	onClickPay () {
		util.go(`/pages/account_management/account_recharge/account_recharge`);
	},
	// 圈存
	onClickOBU () {
		util.go(`/pages/obu/add/add`);
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
			this.setData({etcList});
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
	}
});
