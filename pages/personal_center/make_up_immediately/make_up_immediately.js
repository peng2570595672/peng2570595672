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
	payment (e) {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		let model = e.currentTarget.dataset.model;
		let idList = [];
		let payTypeDetail = {};
		model.list.map(item => {
            const isPassDeduct = item.passDeductStatus === 2 || item.passDeductStatus === 10;// 是否通行手续费欠费
            const isDeduct = item.deductStatus === 2 || item.deductStatus === 10;// 是否通行费欠费
            payTypeDetail[item.id] = isPassDeduct && isDeduct ? 3 : isDeduct ? 1 : 2;
			idList.push(item.id);
		});
		util.showLoading();
		let params = {
			billIdList: idList,// 账单id集合，采用json数组格式[xx,xx]
            payTypeDetail: payTypeDetail,// {"账单id1"：1或者2或者3，"账单id2"：1或者2或者3} 1：通行费补缴  2：通行费手续费补缴  3：1+2补缴
			vehPlates: model.vehPlates,// 车牌号
			payAmount: model.total// 补缴金额
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
			this.data.vehicleList.map((item) => {
				this.getFailBill(item);
			});
		}, (res) => {
			console.log(res);
			this.data.vehicleList.map((item) => {
				this.getFailBill(item);
			});
		}, app.globalData.userInfo.accessToken);
	}
});
