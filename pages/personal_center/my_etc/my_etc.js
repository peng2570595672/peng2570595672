/**
 * @author 狂奔的蜗牛
 * @desc 我的ETC
 */
const util = require('../../../utils/util.js');
const app = getApp();
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
Page({
	data: {
		notAllCar: false,
		carList: undefined,
		activeIndex: 1,
		passengerCarList: [],// 客车
		truckList: []// 货车
	},
	onShow () {
		if (app.globalData.userInfo.accessToken) {
			this.getMyETCList();
		} else {
			// 公众号进入需要登录
			this.login();
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
		if (app.globalData.isSignUpImmediately) {
			app.globalData.isSignUpImmediately = false;
			params['toMasterQuery'] = true;// 直接查询主库
		}
		util.getDataFromServer('consumer/order/my-etc-list', params, () => {
			util.showToastNoIcon('获取车辆列表失败！');
		}, (res) => {
			if (res.code === 0) {
				app.globalData.myEtcList = res.data;
				let vehicleList = [];
				res.data.map((item) => {
					vehicleList.push(item.vehPlates);
					if (item.remark && item.remark.indexOf('迁移订单数据') !== -1) {
						item['selfStatus'] = util.getStatusFirstVersion(item);
					} else {
						item['selfStatus'] = item.isNewTrucks === 1 ? util.getTruckHandlingStatus(item) : util.getStatus(item);
					}
					wx.setStorageSync('cars', vehicleList.join('、'));
				});
				const truckList = res.data.filter(item => item.isNewTrucks === 1);
				let passengerCarList = res.data.filter(item => item.isNewTrucks === 0);
				if ((!truckList.length && passengerCarList.length) || (truckList.length && !passengerCarList.length)) {
					passengerCarList = res.data;
					this.setData({
						notAllCar: true
					});
				}
				this.setData({
					activeIndex: 1, // 初始化变量
					carList: passengerCarList, // 初始化变量
					truckList: truckList,
					passengerCarList: passengerCarList
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	onClickChoiceType (e) {
		let activeIndex = parseInt(e.currentTarget.dataset.index);
		this.setData({
			activeIndex,
			carList: activeIndex === 1 ? this.data.passengerCarList : this.data.truckList
		});
	},
	// 去激活
	onClickCctivate (e) {
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		if (obj.shopId && obj.shopId === '624263265781809152') {
			// 津易行
			this.selectComponent('#notJinYiXingPrompt').show();
		} else {
			this.confirmReceipt(obj);
		}
	},
	// 确认收货
	confirmReceipt (obj) {
		util.showLoading();
		util.getDataFromServer('consumer/order/affirm-take-obu', {
			logisticsId: obj.logisticsId
		}, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
				wx.navigateToMiniProgram({
					appId: 'wxdda17150b8e50bc4',
					path: 'pages/index/index',
					envVersion: 'release', // 目前联调为体验版
					fail () {
						util.showToastNoIcon('调起激活小程序失败, 请重试！');
					}
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 支付付费金额
	goPaymentAmount (e) {
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		app.globalData.orderInfo = obj;
		app.globalData.orderInfo.orderId = obj.id;
		if (obj.isNewTrucks === 1) {
			// 需要支付保证金
			util.go(`/pages/truck_handling/equipment_cost/equipment_cost?equipmentCost=${obj.pledgeMoney}`);
			return;
		}
		util.go(`/pages/default/payment_amount/payment_amount?marginPaymentMoney=${obj.pledgeMoney}&rightsPackagePayMoney=${obj.rightsPackagePayMoney}`);
	},
	//	查看详情
	onClickGoETCDetailHandle (e) {
		// 统计点击事件
		mta.Event.stat('016',{});
		let index = e.currentTarget.dataset.index;
		util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${this.data.carList[parseInt(index)].id}`);
	},
	// 查看进度
	onClickViewProcessingProgressHandle (e) {
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		app.globalData.orderInfo.orderId = obj.id;
		util.go(`/pages/default/processing_progress/processing_progress?orderId=${obj.id}`);
	},
	// 继续办理
	onClickContinueHandle: async function (e) {
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		if (obj.isNewTrucks === 1) {
			// 货车办理
			app.globalData.orderInfo.orderId = obj.id;
			if (obj.selfStatus === 1) {
				util.go('/pages/truck_handling/payment_way/payment_way');
			} else {
				util.go('/pages/truck_handling/information_list/information_list');
			}
			return;
		}
		if (util.getHandlingType(obj)) {
			util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
			return;
		}
		app.globalData.orderInfo.orderId = obj.id;
		app.globalData.isModifiedData = false; // 非修改资料
		if (obj.remark && obj.remark.indexOf('迁移订单数据') !== -1) {
			// 1.0数据
			app.globalData.firstVersionData = true;
			app.globalData.packagePageData = undefined;
			util.go('/pages/default/payment_way/payment_way');
		} else {
			app.globalData.firstVersionData = false;
			if (obj.shopProductId === 0) {
				const result = await util.initLocationInfo(obj);
				if (!result) return;
				if (result.code) {
					util.showToastNoIcon(result.message);
					return;
				}
				if (!app.globalData.newPackagePageData.listOfPackages?.length) return;// 没有套餐
				if (app.globalData.newPackagePageData.type) {
					// 只有分对分套餐 || 只有总对总套餐
					util.go(`/pages/passenger_car_handling/package_the_rights_and_interests/package_the_rights_and_interests?type=${app.globalData.newPackagePageData.type}`);
				} else {
					util.go(`/pages/passenger_car_handling/choose_the_way_to_handle/choose_the_way_to_handle?type=${app.globalData.newPackagePageData.type}`);
				}
			} else if (obj.pledgeStatus === 0) {
				// pledgeStatus 状态，-1 无需支付 0-待支付，1-已支付，2-退款中，3-退款成功，4-退款失败
				util.go(`/pages/passenger_car_handling/package_the_rights_and_interests/package_the_rights_and_interests?type=${app.globalData.newPackagePageData.type}`);
			} else {
				util.go(`/pages/passenger_car_handling/information_list/information_list`);
			}
		}
	},
	// 新增
	onClickAddNewHandle () {
		// 统计点击事件
		mta.Event.stat('015',{});
		app.globalData.orderInfo.orderId = '';
		util.go('/pages/passenger_car_handling/receiving_address/receiving_address');
	},
	// 恢复签约
	onClickBackToSign (e) {
		app.globalData.isSecondSigning = false;
		app.globalData.isSecondSigningInformationPerfect = false;
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		if (obj.status === 1) {
			app.globalData.isSecondSigningInformationPerfect = true;
		}
		if (obj.logisticsId !== 0 || obj.obuStatus === 5 || obj.obuStatus === 1) {
			app.globalData.isSecondSigning = true;
		}
		// 新流程
		if (obj.selfStatus === 10) {
			this.selectComponent('#notSigningPrompt').show();
		} else {
			if (obj.contractStatus === 2) {
				app.globalData.orderInfo.orderId = obj.id;
				// 恢复签约
				this.restoreSign(obj);
			} else {
				// 2.0 立即签约
				if (obj.orderType === 31) {
					app.globalData.isSalesmanOrder = true;
				} else {
					app.globalData.isSalesmanOrder = false;
				}
				app.globalData.signAContract = -1;
				this.weChatSign(obj);
			}
		}
	},
	// 恢复签约
	restoreSign (obj) {
		util.getDataFromServer('consumer/order/query-contract', {
			orderId: obj.id
		}, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				app.globalData.signAContract = 1;
				// 签约成功 userState: "NORMAL"
				if (res.data.contractStatus !== 1) {
					if (res.data.version === 'v3') {
						if (res.data.contractId) {
							wx.navigateToMiniProgram({
								appId: 'wxbcad394b3d99dac9',
								path: 'pages/etc/index',
								extraData: {
									contract_id: res.data.contractId
								},
								success () {
								},
								fail (e) {
									// 未成功跳转到签约小程序
									util.showToastNoIcon('调起微信签约小程序失败, 请重试！');
								}
							});
						} else {
							this.weChatSign(obj);
						}
					} else {
						this.weChatSign(obj);
					}
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 微信签约
	weChatSign (obj) {
		util.showLoading('加载中');
		let params = {
			orderId: obj.id,// 订单id
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		if (obj.remark && obj.remark.indexOf('迁移订单数据') !== -1) {
			// 1.0数据 立即签约 需标记资料已完善
			params['upgradeToTwo'] = true; // 1.0数据转2.0
			params['dataComplete'] = 1; // 资料已完善
		}
		if (obj.isNewTrucks === 1 && obj.status === 0) {
			params['dataComplete'] = 1; // 资料已完善
		}
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
			util.hideLoading();
		}, (res) => {
			if (res.code === 0) {
				util.hideLoading();
				let result = res.data.contract;
				// 签约车主服务 2.0
				app.globalData.isSignUpImmediately = true;// 返回时需要查询主库
				app.globalData.belongToPlatform = obj.platformId;
				app.globalData.orderInfo.orderId = obj.id;
				app.globalData.contractStatus = obj.contractStatus;
				app.globalData.orderStatus = obj.selfStatus;
				app.globalData.orderInfo.shopProductId = obj.shopProductId;
				app.globalData.signAContract === -1;
				util.weChatSigning(result);
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			this.setData({
				available: true,
				isRequest: false
			});
		});
	},
	// 修改资料
	onClickModifiedData (e) {
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		if (obj.isNewTrucks === 1) {
			// 货车办理
			app.globalData.orderInfo.orderId = obj.id;
			util.go('/pages/truck_handling/information_list/information_list?isModifiedData=true');
			return;
		}
		if (obj.auditStatus === 9) {
			// 审核失败--不可办理
			util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${obj.id}`);
		} else {
			if (util.getHandlingType(obj)) {
				util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
				return;
			}
			app.globalData.orderInfo.orderId = obj.id;
			app.globalData.orderInfo.shopProductId = obj.shopProductId;
			app.globalData.isModifiedData = true; // 修改资料
			if (obj.remark && obj.remark.indexOf('迁移订单数据') !== -1) {
				// 1.0数据
				wx.removeStorageSync('driving_license_face');
				wx.removeStorageSync('driving_license_back');
				wx.removeStorageSync('car_head_45');
				app.globalData.firstVersionData = true;
			} else {
				app.globalData.firstVersionData = false;
			}
			util.go('/pages/default/information_validation/information_validation');
		}
	}
});
