const util = require('../../../utils/util.js');
const app = getApp();
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
Page({
	data: {
		orderList: [],
		vehicleList: [],
		failBillList: []
	},
	onShow () {
		if (app.globalData.myEtcList.length !== 0) {
			this.setData({
				failBillList: [],
				orderList: app.globalData.myEtcList
			});
			app.globalData.myEtcList.map((item) => {
				this.data.vehicleList.push(item.vehPlates);
				this.setData({
					vehicleList: this.data.vehicleList
				});
				this.getFailBill(item.vehPlates);
			});
		} else {
			this.getMyETCList();
		}
	},
	// 加载ETC列表
	getMyETCList () {
		util.showLoading();
		util.getDataFromServer('consumer/order/my-etc-list', {}, () => {
			util.showToastNoIcon('获取车辆列表失败！');
		}, (res) => {
			if (res.code === 0) {
				// 过滤未激活订单
				let obuStatusList;
				// obuStatusList = res.data.filter(item => item.obuStatus === 1); // 正式数据
				obuStatusList = res.data.filter(item => item.etcContractId !== 0); // 测试数据处理
				if (obuStatusList.length > 0) {
					// 需要过滤未激活的套餐
					this.setData({
						orderList: obuStatusList
					});
					obuStatusList.map((item) => {
						this.data.vehicleList.push(item.vehPlates);
						this.setData({
							vehicleList: this.data.vehicleList
						});
						this.getFailBill(item.vehPlates);
					});
				} else {
					// 没有激活车辆
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 失败账单列表
	getFailBill (vehPlates) {
		let channel;
		channel = this.data.orderList.filter(item => item.vehPlates === vehPlates);
		let params = {
			vehPlate: vehPlates,
			channel: channel[0].obuCardType
		};
		util.getDataFromServer('consumer/etc/get-fail-bill', params, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				let total = 0;
				res.data.map(item => {
					total += item.etcMoney;
				});
				console.log(total);
				let order = {};
				order.vehPlates = vehPlates;
				order.total = total;
				order.list = res.data;
				this.data.failBillList.push(order);
				console.log(this.data.failBillList);
				this.setData({
					failBillList: this.data.failBillList
				});
				if (this.data.failBillList.length === 0) {
					wx.navigateBack({
						delta: 1
					});
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 账单详情
	goDetails (e) {
		let model = e.currentTarget.dataset.model;
		console.log(model);
		util.go(`/pages/personal_center/order_details/order_details?id=${model.id}&channel=${model.channel}&month=${model.month}`);
	},
	// 补缴
	payment (e) {
		let model = e.currentTarget.dataset.model;
		let idList = [];
		model.list.map(item => {
			idList.push(item.id);
		});
		util.showLoading();
		let params = {
			billIdList: idList,// 账单id集合，采用json数组格式[xx,xx]
			vehPlates: model.vehPlates,// 车牌号
			payAmount: model.total// 补缴金额
		};
		util.getDataFromServer('consumer/order/bill-pay', params, () => {
			util.showToastNoIcon('获取支付参数失败！');
		}, (res) => {
			util.hideLoading();
			let extraData = res.data.extraData;
			if (res.code === 0) {
				wx.requestPayment({
					nonceStr: extraData.nonceStr,
					package: extraData.package,
					paySign: extraData.paySign,
					signType: extraData.signType,
					timeStamp: extraData.timeStamp,
					success: (res) => {
						console.log(res);
						if (res.errMsg === 'requestPayment:ok') {
							this.data.vehicleList.map((item) => {
								this.getFailBill(item);
							});
						} else {
							util.showToastNoIcon('支付失败！');
						}
					},
					fail: (res) => {
						if (res.errMsg !== 'requestPayment:fail cancel') {
							util.showToastNoIcon('支付失败！');
						}
					}
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	}
});
