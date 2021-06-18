/**
 * @author 老刘
 * @desc 账户管理
 */
const util = require('../../../utils/util.js');
Page({
	data: {
		bankList: [],
		isSwitch: false, // 是否是选择卡
		available: false, // 按钮是否可点击
		isRequest: false// 是否请求中
	},
	onLoad (options) {
		if (options.isSwitch) {
			this.setData({
				isSwitch: true
			});
			wx.setNavigationBarTitle({
				title: '选择银行卡'
			});
		}
	},
	async onShow () {
		await this.getBankAccounts();
	},
	// 获取一类户号信息
	async getBankAccounts () {
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/getBankAccounts');
		if (!result) return;
		if (result.code === 0) {
			if (!result.data) result.data = [];
			result.data.map(item => {
				item.accountNo = item.accountNo.substr(0, 4) + ' *** *** ' + item.accountNo.substr(-4);
			});
			this.setData({
				bankList: result.data
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	onClickSwitchBankCard (e) {
		if (!this.data.isSwitch) return;
		let index = e.currentTarget.dataset['index'];
		const pages = getCurrentPages();
		const prevPage = pages[pages.length - 2];// 上一个页面
		prevPage.setData({
			index
		});
		wx.navigateBack({
			delta: 1
		});
	},
	// 解绑
	onClickUnbind (e) {
		wx.uma.trackEvent('account_management_for_card_list_to_unbind_alert');
		let index = e.currentTarget.dataset['index'];
		if (this.data.bankList.length === 1) {
			util.showToastNoIcon('当绑定卡只有1张时不可解绑');
			return;
		}
		util.alert({
			title: ``,
			content: `确定解除当前银行卡的绑定吗？`,
			showCancel: true,
			cancelText: '取消',
			confirmText: '确认',
			confirmColor: '#576B95',
			cancelColor: '#000000',
			confirm: async () => {
				await this.unbindingAccount(this.data.bankList[index]);
			}
		});
	},
	// 获取二类户号信息
	async unbindingAccount (item) {
		wx.uma.trackEvent('account_management_for_card_list_to_unbind');
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/unbindingAccount', {
			bankAccountId: item.bankAccountId
		});
		if (!result) return;
		if (result.code === 0) {
			await this.getBankAccounts();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	onClickNewBinding () {
		wx.uma.trackEvent('account_management_for_card_list_to_new_binding');
		util.go(`/pages/account_management/new_binding/new_binding`);
	}
});
