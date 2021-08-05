const util = require('../../../utils/util.js');
const app = getApp();
// 数据统计
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
			obuStatusList = app.globalData.myEtcList.filter(item => item.obuStatus === 1 || item.obuStatus === 2 || item.obuStatus === 5); // 测试数据处理
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
				obuStatusList = res.data.filter(item => item.obuCardType !== 0); // 测试数据处理
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
		util.showLoading();
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
				let order = {};
				res.data.map(item => {
					order.vehPlates = item.vehPlate;
					if (item.deductStatus === 2 || item.deductStatus === 10) {
						total += item.totalMmout + (item.serviceMoney || 0) - (item.splitDeductedMoney || 0) - (item.deductServiceMoney || 0) - (item.refundMoney || 0) - (item.wxDiscountAmount || 0) - (item.discountMount || 0);
					}
					if (item.passDeductStatus === 2 || item.passDeductStatus === 10) {
						total += item.passServiceMoney || 0;
					}
				});
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
	async goDetails (e) {
		app.globalData.billingDetails = undefined;
		let model = e.currentTarget.dataset.model;
		let index = e.currentTarget.dataset.index;
		app.globalData.billingDetails = model;
		// 统计点击事件
		if (parseInt(index) === 2) {
			// 通行手续费
			util.go(`/pages/personal_center/passing_charges_details/passing_charges_details?id=${model.id}&channel=${model.channel}&month=${model.month}`);
			return;
		}
		if (parseInt(model.splitState) === 1) {
			const result = await util.getDataFromServersV2('consumer/etc/get-split-bills-count', {
				detailId: model.id
			});
			if (!result) return;
			if (result.code) {
				util.showToastNoIcon(result.message);
				return;
			}
			util.alert({
				title: `提醒`,
				content: `因账单金额过高导致扣款失败，为避免影响您的通行，系统已自动拆分为${result.data.ct}条扣款记录`,
				showCancel: true,
				cancelText: '跳过',
				confirmText: '去查看',
				confirm: () => {
					app.globalData.splitDetails = model;
					util.go('/pages/personal_center/split_bill/split_bill');
				},
				cancel: () => {
					util.go(`/pages/personal_center/order_details/order_details?id=${model.id}&channel=${model.channel}&month=${model.month}`);
				}
			});
			return;
		}
		util.go(`/pages/personal_center/order_details/order_details?id=${model.id}&channel=${model.channel}&month=${model.month}`);
	},
	// 补缴
	payment (e) {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		wx.uma.trackEvent('arrears_bill_for_payment');
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
							app.globalData.isArrearageData.isPayment = true;
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
