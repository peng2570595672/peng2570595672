/**
 * @author 老刘
 * @desc 选择办理方式
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		listOfPackages: []// 套餐列表
	},
	async onLoad () {
		// 查询是否欠款
		await util.getIsArrearage();
	},
	onShow () {
		this.setData({
			listOfPackages: app.globalData.newPackagePageData
		});
	},
	onClickOnlineService () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	onClickPaymentWay (e) {
		wx.uma.trackEvent('choose_the_way_to_handle');
		const type = +e.currentTarget.dataset.type;
		util.go(`/pages/default/package_the_rights_and_interests/package_the_rights_and_interests?type=${type}`);
		if (type === 1) {
			util.go(`/pages/default/package_the_rights_and_interests/package_the_rights_and_interests?type=${type}`);
		} else {
			util.go(`/pages/default/select_contract_bank/select_contract_bank?type=${type}`);
		}
	}
});
