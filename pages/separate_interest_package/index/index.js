const util = require('../../../utils/util.js');
Page({
	data: {
		list: []
	},
	async onLoad () {
		await this.getPackageList();
	},
	onShow () {
	},
	onClickPay (e) {
		const item = this.data.list[+e.target.dataset.index];
		util.go(`/pages/separate_interest_package/prefer_purchase/prefer_purchase?packageId=${item.packageId}`);
	},
	// 获取权益包列表
	async getPackageList () {
		const result = await util.getDataFromServersV2('consumer/voucher/rights/get-independent-rights-package-list');
		if (!result) return;
		if (result.code === 0) {
			result.data.map(item => {
				let couponType = [];
				item.couponList.map(it => {
					couponType.push(it.couponType);
				});
				item.couponType = couponType.length > 1 ? 3 : parseInt(couponType[0]) === 1 ? 1 : 2;
			});
			this.setData({
				list: result.data
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	}
});
