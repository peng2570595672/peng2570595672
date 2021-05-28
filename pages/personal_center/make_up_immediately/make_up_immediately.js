const util = require('../../../utils/util.js');
const app = getApp();
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
Page({
	data: {
		isRequest: false,// 是否请求
		details: undefined
	},
	onLoad (options) {
		if (options.details) {
			this.setData({
				details: JSON.parse(options.details)
			});
		}
	},
	// 补缴
	go (e) {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		let payTypeDetail = {};
		let total = 0;
		const details = this.data.details;
		const isPassDeduct = details.passDeductStatus === 2 || details.passDeductStatus === 10;// 是否通行手续费欠费
		const isDeduct = details.deductStatus === 2 || details.deductStatus === 10;// 是否通行费欠费
		payTypeDetail[details.id] = isPassDeduct && isDeduct ? 3 : isDeduct ? 1 : 2;
		if (details.deductStatus === 2 || details.deductStatus === 10) {
			total += details.totalMmout + (details.serviceMoney || 0) - (details.splitDeductedMoney || 0) - (details.deductServiceMoney || 0) - (details.refundMoney || 0) - (details.wxDiscountAmount || 0) - (details.discountMount || 0);
		}
		if (details.passDeductStatus === 2 || details.passDeductStatus === 10) {
			total += details.passServiceMoney || 0;
		}
		util.showLoading();
		let params = {
			billIdList: [this.data.details.id],// 账单id集合，采用json数组格式[xx,xx]
            payTypeDetail: payTypeDetail,// {"账单id1"：1或者2或者3，"账单id2"：1或者2或者3} 1：通行费补缴  2：通行费手续费补缴  3：1+2补缴
			vehPlates: details.vehPlate,// 车牌号
			payAmount: total// 补缴金额
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
	// 同步支付信息
	getBillQuery (id) {
		util.getDataFromServer('consumer/order/billQuery', {id: id}, () => {
			this.getFailBill(id);
		}, (res) => {
			console.log(res);
			this.getFailBill(id);
		}, app.globalData.userInfo.accessToken);
	}
});
