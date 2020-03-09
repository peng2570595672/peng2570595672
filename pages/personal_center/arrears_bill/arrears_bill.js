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
	onLoad () {
		this.getMyETCList();
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
				obuStatusList = res.data.filter(item => item.etcChannelCode === '1'); // 测试数据处理
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
			channel: channel[0].etcChannelCode
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
					util.go('/pages/personal_center/my_order/my_order');
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
		console.log(model);
		let vehPlateMsg = this.data.orderList.find(item => {
			return item.vehPlates === model.vehPlates;
		});
		let idList = [];
		model.list.map(item => {
			idList.push(item.id);
		});
		console.log(idList);
		console.log(vehPlateMsg);
		util.showLoading();
		let params = {
			billIdList: idList,// 账单id集合，采用json数组格式[xx,xx]
			payChannelId: vehPlateMsg.payChannelId,// 支付渠道id   payChannelId
			vehPlates: model.vehPlates,// 车牌号
			payAmount: model.total / 100,// 补缴金额
			etcCardType: vehPlateMsg.obuCardType// 卡类型   obuCardType
		};
		util.getDataFromServer('consumer/order/bill-pay', params, () => {
			util.showToastNoIcon('获取支付参数失败！');
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				wx.requestPayment({
					nonceStr: res.data.nonceStr,
					package: res.data.package,
					paySign: res.data.paySign,
					signType: res.data.signType,
					timeStamp: `${res.data.timeStamp}`,
					success: (res) => {
						if (res.errMsg === 'requestPayment:ok') {
							this.getMyETCList();
							// 差查询详情接口
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
