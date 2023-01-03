const util = require('../../../utils/util.js');
const app = getApp();
// 数据统计
Page({
	data: {
		isRequest: false,// 是否请求
		enterSource: 0,// 是否是好车主
		orderList: [],
		vehicleList: [],
		failBillList: []
	},
	onShow () {
		wx.hideHomeButton();
		let pages = getCurrentPages();
		let currentPage = pages[pages.length - 1];
		console.log(currentPage.options);
		if (currentPage.options && currentPage.options.type) {
			// 好车主
			this.setData({
				enterSource: +currentPage.options.type
			});
		}
		if (JSON.stringify(app.globalData.myEtcList) === '{}') {
			// 直接打开该页面
			this.login();
			return;
		}
		if (app.globalData.myEtcList.length !== 0) {
			let obuStatusList;
			obuStatusList = app.globalData.myEtcList.filter(item => item.obuStatus === 1 || item.obuStatus === 2 || item.obuStatus === 5);
			if (this.data.enterSource) {
				obuStatusList = app.globalData.myEtcList.filter(item => item.platformId === '568113867222155288' || item.platformId === '500338116821778436');
			}
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
	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: (res) => {
				util.getDataFromServer('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				}, () => {
					util.hideLoading();
					util.showToastNoIcon('登录失败！');
				}, (res) => {
					if (res.code === 0) {
						res.data['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
						this.setData({
							loginInfo: res.data
						});
						// 已经绑定了手机号
						if (res.data.needBindingPhone !== 1) {
							app.globalData.userInfo = res.data;
							app.globalData.openId = res.data.openId;
							app.globalData.memberId = res.data.memberId;
							app.globalData.mobilePhone = res.data.mobilePhone;
							this.getMyETCList();
						} else {
							wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
							util.go('/pages/login/login/login');
							util.hideLoading();
						}
					} else {
						util.hideLoading();
						util.showToastNoIcon(res.message);
					}
				});
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
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
				app.globalData.myEtcList = res.data;
				// 过滤未激活订单
				let obuStatusList;
				app.globalData.ownerServiceArrearsList = res.data.filter(item => item.paySkipParams !== undefined); // 筛选车主服务欠费
				obuStatusList = res.data.filter(item => item.obuStatus === 1 || item.obuStatus === 2 || item.obuStatus === 5); // 正式数据
				if (this.data.enterSource) {
					obuStatusList = app.globalData.myEtcList.filter(item => item.platformId === '568113867222155288' || item.platformId === '500338116821778436');
				}
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
				vehPlate: this.data.enterSource ? (this.data.orderList[0].vehPlates || '') : '',
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
					const obj = app.globalData.myEtcList.find(item => item.vehPlates);
					item.flowVersion = obj.flowVersion;
					order.vehPlates = item.vehPlate;
					if (item.deductStatus === 2 || item.deductStatus === 10) {
						total += item.totalMmout + (item.serviceMoney || 0) + (item.poundage || 0) - (item.splitDeductedMoney || 0) - (item.deductServiceMoney || 0) - (item.refundMoney || 0) - (item.wxDiscountAmount || 0) - (item.discountMount || 0);
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
				// let flag = this.data.failBillList.filter(item => (item.list.length > 0));
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
		if (this.data.enterSource) return;
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
			if (this.data.enterSource) {
				wx.redirectTo({
					url: '/pages/personal_center/bill_payment_success/bill_payment_success'
				});
				return;
			}
			this.data.vehicleList.map((item) => {
				this.getFailBill(item);
			});
		}, app.globalData.userInfo.accessToken);
	}
});
