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
		let origin = 0; // 0 去开票， 1已开票
		let info = this.data.currentList[index];
		let infoStr = JSON.stringify(info);
		// 开票状态0未申请 1申请成功、-1申请失败、2开票成功、3开票失败，4开票成功签章失败
		let invoiceStatus = info.invoiceStatus;
		if (invoiceStatus === 1 || invoiceStatus === 2 || invoiceStatus === 4) {
			origin = 1;
		}
		util.go(`/pages/personal_center/invoice_issued_detail/invoice_issued_detail?origin=${origin}&infoStr=${infoStr}`);
	}
});
