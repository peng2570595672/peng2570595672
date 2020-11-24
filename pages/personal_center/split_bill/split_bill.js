const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isRequest: false,// 是否请求
		details: undefined,// 详情
		splitList: []
	},
	onLoad (options) {
		if (app.globalData.splitDetails) {
			this.setData({
				details: app.globalData.splitDetails
			});
			this.getSplitBill();
		}
	},
	// 获取拆分列表
	getSplitBill () {
		util.showLoading();
		let params = {
			detailId: this.data.details.id
		};
		util.getDataFromServer('consumer/etc/get-split-bills', params, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				this.setData({
					splitList: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 补缴
	payment () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		util.showLoading();
		let data = this.data.details;
		let params = {
			billIdList: [data.id],// 账单id集合，采用json数组格式[xx,xx]
			vehPlates: data.vehPlate,// 车牌号
			payAmount: data.etcMoney + data.serviceMoney - data.splitDeductedMoney - data.deductServiceMoney// 补缴金额
		};
		util.getDataFromServer('consumer/order/bill-pay', params, () => {
			util.showToastNoIcon('获取支付参数失败！');
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				let extraData = res.data.extraData;
				let id = res.data.id;
				wx.requestPayment({
					nonceStr: extraData.nonceStr,
					package: extraData.package,
					paySign: extraData.paySign,
					signType: extraData.signType,
					timeStamp: extraData.timeStamp,
					success: (res) => {
						this.setData({isRequest: false});
						if (res.errMsg === 'requestPayment:ok') {
							this.getBillQuery(id);
						} else {
							util.showToastNoIcon('支付失败！');
						}
					},
					fail: (res) => {
						this.setData({isRequest: false});
						if (res.errMsg !== 'requestPayment:fail cancel') {
							util.showToastNoIcon('支付失败！');
						}
					}
				});
			} else {
				this.setData({isRequest: false});
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 查询账单详情
	getBillDetail () {
		util.showLoading();
		let params = {
			channel: this.data.details.channel,
			id: this.data.details.id,
			month: this.data.details.month
		};
		util.getDataFromServer('consumer/etc/get-bill-by-id', params, () => {
			util.showToastNoIcon('获取账单详情失败！');
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				app.globalData.splitDetails = res.data;
				this.setData({details: res.data});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 同步支付信息
	getBillQuery (id) {
		util.getDataFromServer('consumer/order/billQuery', {id: id}, () => {
			this.getSplitBill();
			this.getBillDetail();
		}, (res) => {
			console.log(res);
			this.getSplitBill();
			this.getBillDetail();
		}, app.globalData.userInfo.accessToken);
	}
});
