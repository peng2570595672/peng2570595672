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
				this.setData({
					failBillList: this.data.failBillList.concat(res.data)
				});
				// 数组去重
				var hash = [];
				this.data.failBillList = this.data.failBillList.reduce(function (item1, item2) {
					hash[item2['id']] ? '' : hash[item2['id']] = true && item1.push(item2);
					return item1;
				}, []);
				this.setData({
					failBillList: this.data.failBillList
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 账单详情
	goDetails (e) {
		let model = e.currentTarget.dataset.model;
		util.go('/pages/personal_center/order_details/order_details?details=' + JSON.stringify(model));
	},
	// 去补缴
	go () {
		util.go('/pages/personal_center/payment_confirmation/payment_confirmation');
	}
});
