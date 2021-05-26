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
	async onShow () {
		app.globalData.isTruckHandling = false;
		app.globalData.isNeedReturnHome = false;
		if (app.globalData.userInfo.accessToken) {
			Promise.all([await util.getV2BankId(), await this.getMyETCList()]);
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
			success: async (res) => {
				const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				});
				if (result.code === 0) {
					result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
					this.setData({
						loginInfo: result.data
					});
					// 已经绑定了手机号
					if (result.data.needBindingPhone !== 1) {
						app.globalData.userInfo = result.data;
						app.globalData.openId = result.data.openId;
						app.globalData.memberId = result.data.memberId;
						app.globalData.mobilePhone = result.data.mobilePhone;
						Promise.all([await util.getV2BankId(), await this.getMyETCList()]);
					} else {
						wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
						util.go('/pages/login/login/login');
						util.hideLoading();
					}
				} else {
					util.hideLoading();
					util.showToastNoIcon(result.message);
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	// 加载ETC列表
	async getMyETCList () {
		util.showLoading();
		let params = {
			openId: app.globalData.openId
		};
		if (app.globalData.isSignUpImmediately) {
			app.globalData.isSignUpImmediately = false;
			params['toMasterQuery'] = true;// 直接查询主库
		}
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', params);
		if (!result) return;
		if (result.code === 0) {
			app.globalData.myEtcList = result.data;
			let vehicleList = [];
			result.data.map((item) => {
				vehicleList.push(item.vehPlates);
				item['selfStatus'] = item.isNewTrucks === 1 ? util.getTruckHandlingStatus(item) : util.getStatus(item);
				wx.setStorageSync('cars', vehicleList.join('、'));
			});
			const truckList = result.data.filter(item => item.isNewTrucks === 1);
			let passengerCarList = result.data.filter(item => item.isNewTrucks === 0);
			if ((!truckList.length && passengerCarList.length) || (truckList.length && !passengerCarList.length)) {
				passengerCarList = result.data;
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
			util.showToastNoIcon(result.message);
		}
	},
	onClickChoiceType (e) {
		let activeIndex = parseInt(e.currentTarget.dataset.index);
		wx.uma.trackEvent(activeIndex === 1 ? 'my_etc_for_tab_to_passenger_car' : 'my_etc_for_tab_to_truck');
		this.setData({
			activeIndex,
			carList: activeIndex === 1 ? this.data.passengerCarList : this.data.truckList
		});
	},
	// 点击车辆信息
	onClickVehicle (e) {
		let index = e.currentTarget.dataset.index;
		let orderInfo = this.data.carList[parseInt(index)];
		app.globalData.orderInfo.orderId = orderInfo.id;
		const fun = {
			1: () => this.onClickBackToSign(orderInfo),// 恢复签约
			2: () => this.onClickContinueHandle(orderInfo),// 继续办理
			3: () => this.goPayment(orderInfo), // 去支付
			4: () => this.onClickContinueHandle(orderInfo), // 继续办理
			5: () => this.onClickBackToSign(orderInfo), // 签约微信支付 - 去签约
			6: () => this.onClickViewProcessingProgressHandle(orderInfo), // 订单排队审核中 - 查看进度
			7: () => this.onClickModifiedData(orderInfo), // 修改资料 - 上传证件页
			8: () => this.goEtcDetails(orderInfo), // 高速核验不通过 - 查看进度
			9: () => this.onClickHighSpeedSigning(orderInfo), // 去签约
			10: () => this.onClickViewProcessingProgressHandle(orderInfo), // 查看进度
			11: () => this.onClickCctivate(orderInfo), // 去激活
			13: () => this.goBindingAccount(orderInfo), // 去开户
			14: () => this.goRechargeAuthorization(orderInfo), // 去授权预充保证金
			15: () => this.goRecharge(orderInfo) // 保证金预充失败 - 去预充
		};
		fun[orderInfo.selfStatus].call();
	},
	// 去高速签约
	onClickHighSpeedSigning () {
		wx.uma.trackEvent('my_etc_for_order_audit');
		util.go(`/pages/default/order_audit/order_audit`);
	},
	// 去开户
	goBindingAccount () {
		wx.uma.trackEvent('my_etc_for_binding_account');
		util.go('/pages/truck_handling/binding_account/binding_account');
	},
	// 去预充
	goRecharge (orderInfo) {
		wx.uma.trackEvent('my_etc_for_account_recharge');
		util.go(`/pages/account_management/account_recharge/account_recharge?money=${orderInfo.holdBalance}`);
	},
	// 去授权预充保证金
	goRechargeAuthorization () {
		wx.uma.trackEvent('my_etc_for_recharge_instructions');
		util.go('/pages/truck_handling/recharge_instructions/recharge_instructions');
	},
	// 去设备详情 审核失败:不可办理
	goEtcDetails (orderInfo) {
		wx.uma.trackEvent('my_etc_for_my_etc_detail');
		util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${orderInfo.id}`);
	},
	// 去激活
	async onClickCctivate (obj) {
		wx.uma.trackEvent('my_etc_for_activation');
		if (!obj.logisticsId) {
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
			await this.confirmReceipt(obj);
		}
	},
	// 确认收货
	async confirmReceipt (obj) {
		const result = await util.getDataFromServersV2('consumer/order/affirm-take-obu', {
			logisticsId: obj.logisticsId
		});
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
		wx.navigateToMiniProgram({
			appId: 'wxdda17150b8e50bc4',
			path: 'pages/index/index',
			envVersion: 'release', // 目前联调为体验版
			fail () {
				util.showToastNoIcon('调起激活小程序失败, 请重试！');
			}
		});
	},
	// 去支付
	goPayment (orderInfo) {
		const path = orderInfo.isNewTrucks === 1 ? 'truck_handling' : 'default';
		wx.uma.trackEvent(orderInfo.isNewTrucks === 1 ? 'my_etc_for_truck_package' : 'my_etc_for_package');
		util.go(`/pages/${path}/package_the_rights_and_interests/package_the_rights_and_interests`);
	},
	//	查看详情
	onClickGoETCDetailHandle (e) {
		// 统计点击事件
		mta.Event.stat('016',{});
		wx.uma.trackEvent('my_etc_for_card_my_etc_detail');
		let index = e.currentTarget.dataset.index;
		util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${this.data.carList[parseInt(index)].id}`);
	},
	// 查看进度
	onClickViewProcessingProgressHandle (obj) {
		wx.uma.trackEvent('my_etc_for_processing_progress');
		util.go(`/pages/default/processing_progress/processing_progress?orderId=${obj.id}`);
	},
	// 继续办理
	async onClickContinueHandle (orderInfo) {
		// 统计点击事件
		mta.Event.stat('002',{});
		app.globalData.isModifiedData = false; // 非修改资料
		app.globalData.firstVersionData = false;
		const path = orderInfo.isNewTrucks === 1 ? 'truck_handling' : 'default';
		if (orderInfo.selfStatus === 2) {
			const result = await util.initLocationInfo(orderInfo, orderInfo.isNewTrucks === 1);
			if (!result) return;
			if (result.code) {
				util.showToastNoIcon(result.message);
				return;
			}
			wx.uma.trackEvent(orderInfo.isNewTrucks === 1 ? 'my_etc_for_continue_to_truck_package' : 'my_etc_for_continue_to_package');
			if (app.globalData.newPackagePageData.type || orderInfo.isNewTrucks === 1) {
				// 只有分对分套餐 || 只有总对总套餐
				util.go(`/pages/${path}/package_the_rights_and_interests/package_the_rights_and_interests?type=${app.globalData.newPackagePageData.type}`);
			} else {
				util.go(`/pages/${path}/choose_the_way_to_handle/choose_the_way_to_handle`);
			}
			return;
		}
		if (orderInfo.isNewTrucks === 0 && util.getHandlingType(orderInfo)) {
			util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
			return;
		}
		wx.uma.trackEvent(orderInfo.isNewTrucks === 1 ? 'my_etc_for_certificate_to_truck_package' : 'my_etc_for_certificate_to_package');
		util.go(`/pages/${path}/information_list/information_list`);
	},
	// 新增
	onClickAddNewHandle () {
		// 统计点击事件
		mta.Event.stat('015',{});
		wx.uma.trackEvent('my_etc_for_new_deal_with');
		app.globalData.orderInfo.orderId = '';
		util.go('/pages/default/receiving_address/receiving_address');
	},
	// 恢复签约
	async onClickBackToSign (obj) {
		if (obj.isNewTrucks === 1) {
			wx.uma.trackEvent('my_etc_for_contract_management');
			util.go(`/pages/truck_handling/contract_management/contract_management`);
			return;
		}
		app.globalData.isSecondSigning = false;
		app.globalData.isSecondSigningInformationPerfect = obj.status === 1;
		if (obj.logisticsId !== 0 || obj.obuStatus === 5 || obj.obuStatus === 1) app.globalData.isSecondSigning = true;
		// 新流程
		if (obj.contractStatus === 2) {
			app.globalData.orderInfo.orderId = obj.id;
			wx.uma.trackEvent('my_etc_for_resume_signing');
			// 恢复签约
			await this.restoreSign(obj);
		} else {
			// 2.0 立即签约
			wx.uma.trackEvent('my_etc_for_sign_contract');
			app.globalData.isSalesmanOrder = obj.orderType === 31;
			app.globalData.signAContract = -1;
			await this.weChatSign(obj);
		}
	},
	// 恢复签约
	async restoreSign (obj) {
		const result = await util.getDataFromServersV2('consumer/order/query-contract', {
			orderId: obj.id
		});
		if (!result) return;
		if (result.code === 0) {
			app.globalData.signAContract = 1;
			// 签约成功 userState: "NORMAL"
			if (result.data.contractStatus !== 1) {
				if (result.data.version === 'v3') {
					if (result.data.contractId) {
						wx.navigateToMiniProgram({
							appId: 'wxbcad394b3d99dac9',
							path: 'pages/etc/index',
							extraData: {
								contract_id: result.data.contractId
							},
							success () {
							},
							fail (e) {
								// 未成功跳转到签约小程序
								util.showToastNoIcon('调起微信签约小程序失败, 请重试！');
							}
						});
					} else {
						await this.weChatSign(obj);
					}
				} else {
					await this.weChatSign(obj);
				}
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 微信签约
	async weChatSign (obj) {
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
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({
			available: true,
			isRequest: false
		});
		if (!result) return;
		if (result.code === 0) {
			util.hideLoading();
			let res = result.data.contract;
			// 签约车主服务 2.0
			app.globalData.isSignUpImmediately = true;// 返回时需要查询主库
			app.globalData.belongToPlatform = obj.platformId;
			app.globalData.orderInfo.orderId = obj.id;
			app.globalData.contractStatus = obj.contractStatus;
			app.globalData.orderStatus = obj.selfStatus;
			app.globalData.orderInfo.shopProductId = obj.shopProductId;
			app.globalData.signAContract === -1;
			util.weChatSigning(res);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 修改资料
	onClickModifiedData (orderInfo) {
		if (orderInfo.isNewTrucks === 1) {
			// 货车办理
			wx.uma.trackEvent('my_etc_for_truck_modified_data');
			util.go('/pages/truck_handling/information_list/information_list?isModifiedData=true');
			return;
		}
		if (util.getHandlingType(orderInfo)) {
			util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
			return;
		}
		wx.uma.trackEvent('my_etc_for_modified_data');
		app.globalData.orderInfo.shopProductId = orderInfo.shopProductId;
		app.globalData.isModifiedData = true; // 修改资料
		app.globalData.firstVersionData = !!(orderInfo.remark && orderInfo.remark.indexOf('迁移订单数据') !== -1);
		util.go('/pages/default/information_list/information_list?isModifiedData=true');
	}
});
