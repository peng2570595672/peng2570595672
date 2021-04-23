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
	onLoad () {
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
		const type = e.currentTarget.dataset.type;
		util.go(`/pages/passenger_car_handling/package_the_rights_and_interests/package_the_rights_and_interests?type=${type}`);
	}
});
