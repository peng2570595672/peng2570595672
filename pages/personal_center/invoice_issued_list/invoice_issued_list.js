const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		currentList: []
	},
	onShow () {
		this.getList();
	},
	getList () {
		util.showLoading();
		util.getDataFromServer('consumer/order/after-sale-record/orderInvoiceList', {
			memberId: app.globalData.memberId
		}, () => {
			util.showToastNoIcon('保存失败！');
		}, (res) => {
			if (res.code === 0) {
				let list = res.data;
				this.setData({
					currentList: list
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	onClickHandle (e) {
		let index = e.currentTarget.dataset.index;
		let origin = 1; // 0 去开票， 1已开票
		let info = this.data.currentList[index];
		let orderId = info.orderId;
		// 开票状态0-待申请 1申请成功、2-申请失败
		if(info.invoiceStatus !== 1){
			origin = 0;
			info = {};
			info.orderId = orderId;
		}
		let infoStr = JSON.stringify(info);
		util.go(`/pages/personal_center/invoice_issued_detail/invoice_issued_detail?origin=${origin}&infoStr=${infoStr}`);
	}
});
