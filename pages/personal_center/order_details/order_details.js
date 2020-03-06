const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		orderList: '',
		details: ''
	},
	onLoad (options) {
		this.setData({
			details: JSON.parse(options.details)
		});
		// 差查询详情接口
		this.getMyETCList();
	},
	// 去账单说明
	goOrderInstructions () {
		util.go('/pages/personal_center/order_instructions/order_instructions?details=' + JSON.stringify(this.data.details));
	},
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
	// 去补缴
	go () {
		let vehPlateMsg = this.data.orderList.find(item => {
			return item.vehPlates === this.data.details.vehPlate;
		});
		console.log(vehPlateMsg);
		util.showLoading();
		let params = {
			billIdList: [this.data.details.id],// 账单id集合，采用json数组格式[xx,xx]
			payChannelId: vehPlateMsg.payChannelId,// 支付渠道id   payChannelId
			vehPlates: this.data.details.vehPlate,// 车牌号
			payAmount: this.data.details.etcMoney / 100,// 补缴金额
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
		// 此页面目前已经弃用
		// util.go('/pages/personal_center/payment_confirmation/payment_confirmation');
	}
});
