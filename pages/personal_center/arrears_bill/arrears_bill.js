const util = require('../../../utils/util.js');
const app = getApp();
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
Page({
	data: {
		isRequest: false,// 是否请求
		orderList: [],
		vehicleList: [],
		failBillList: []
	},
	onShow () {
		if (app.globalData.myEtcList.length !== 0) {
			let obuStatusList;
			obuStatusList = app.globalData.myEtcList.filter(item => item.etcContractId !== 0); // 测试数据处理
			this.setData({
				failBillList: [],
				orderList: obuStatusList
			});
			if (this.data.orderList.length === 1) {
				this.getFailBill();
			} else {
				this.data.orderList.map((item) => {
					this.data.vehicleList.push(item.vehPlates);
					this.setData({
						vehicleList: this.data.vehicleList
					});
					this.getFailBill(item.vehPlates);
				});
			}
		} else {
			this.getMyETCList();
		}
	},
	// 加载ETC列表
	getMyETCList () {
		util.showLoading();
		let params = {
			openId: app.globalData.openId
		};
		util.getDataFromServer('consumer/order/my-etc-list', params, () => {
			util.showToastNoIcon('获取车辆列表失败！');
		}, (res) => {
			if (res.code === 0) {
				// 过滤未激活订单
				let obuStatusList;
				app.globalData.ownerServiceArrearsList = res.data.filter(item => item.paySkipParams !== undefined); // 筛选车主服务欠费
				// obuStatusList = res.data.filter(item => item.obuStatus === 1); // 正式数据
				obuStatusList = res.data.filter(item => item.etcContractId !== 0); // 测试数据处理
				if (obuStatusList.length > 0) {
					// 需要过滤未激活的套餐
					this.setData({
						orderList: obuStatusList
					});
					if (obuStatusList.length === 1) {
						this.getFailBill();
					} else {
						obuStatusList.map((item) => {
							this.data.vehicleList.push(item.vehPlates);
							this.setData({
								vehicleList: this.data.vehicleList
							});
							this.getFailBill(item.vehPlates);
						});
					}
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
		let params = {};
		if (vehPlates) {
			let channel;
			channel = this.data.orderList.filter(item => item.vehPlates === vehPlates);
			params = {
				vehPlate: vehPlates,
				channel: channel[0].obuCardType
			};
		} else {
			params = {
				channel: this.data.orderList[0].obuCardType
			};
		}
		util.getDataFromServer('consumer/etc/get-fail-bill', params, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				let total = 0;
				res.data.map(item => {
					total += item.etcMoney;
					if (item.serviceMoney) {
						total += item.serviceMoney;
					}
				});
				let order = {};
				order.vehPlates = vehPlates;
				order.total = total;
				order.list = res.data;
				this.data.failBillList.push(order);
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
		util.go(`/pages/personal_center/order_details/order_details?id=${model.id}&channel=${model.channel}&month=${model.month}`);
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
			if (res.code === 0) {
				let extraData = res.data.extraData;
				wx.requestPayment({
					nonceStr: extraData.nonceStr,
					package: extraData.package,
					paySign: extraData.paySign,
					signType: extraData.signType,
					timeStamp: extraData.timeStamp,
					success: (res) => {
						this.setData({isRequest: false});
						if (res.errMsg === 'requestPayment:ok') {
							this.data.vehicleList.map((item) => {
								this.getFailBill(item);
							});
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
	}
});
