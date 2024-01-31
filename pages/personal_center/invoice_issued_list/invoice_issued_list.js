const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		currentList: []
	},
	async onLoad () {
		// 查询是否欠款
		await util.getIsArrearage();
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
				// 通过shopProductId 隐藏部分开票的订单
				// let index = list.findIndex(item => {
				// 	return item.shopProductId === '1193862669248634880' || item.shopProductId === '1193860496800489472';
				// });
				// index !== -1 ? list.splice(index,1) : '';
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
	checkIsCanApply (info) {
		util.showLoading();
		util.getDataFromServer('consumer/order/after-sale-record/isCanApply', {
			shopProductId: info.shopProductId
		}, () => {
			util.showToastNoIcon('获取权益列表失败！');
		}, (res) => {
			if (res.code === 0) {
				let origin = 1; // 0 去开票， 1已开票
				// 开票状态0-待申请 1申请成功、2-申请失败
				let orderId = info.orderId;
				if (info.invoiceStatus !== 1) {
					origin = 0;
					info = {};
					info.orderId = orderId;
				}
				let infoStr = JSON.stringify(info);
				util.go(`/pages/personal_center/invoice_issued_detail/invoice_issued_detail?origin=${origin}&infoStr=${infoStr}`);
			} else if (res.code === 1) {
				util.alert({
					title: '发票客服',
					content: '当前订单暂不支持在线开具电子发票，请拨打客服热线4008008787',
					showCancel: true,
					cancelText: '取消',
					confirmText: '拨打热线',
					cancelColor: '#000000',
					confirmColor: '#576B95',
					confirm: () => {
						wx.makePhoneCall({
							phoneNumber: '4008008787'
						});
					}
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
		let info = this.data.currentList[index];
		this.checkIsCanApply(info);
	}
});
