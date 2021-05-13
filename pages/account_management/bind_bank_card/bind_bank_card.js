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
	onShow () {
	},
	onClickSwitchBankCard (e) {
		if (!this.data.isSwitch) return;
		let index = e.currentTarget.dataset['index'];
		const pages = getCurrentPages();
		const prevPage = pages[pages.length - 2];// 上一个页面
		prevPage.setData({
			info: {
				aa: 1,
				bb: 2
			}
		});
		wx.navigateBack({
			delta: 1
		});
	},
	// 解绑
	onClickUnbind () {
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
			}
		});
	},
	onClickNewBinding () {
		util.go(`/pages/account_management/new_binding/new_binding`);
	}
});
