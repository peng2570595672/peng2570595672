/**
 * @author 狂奔的蜗牛
 * @desc 我的ETC
 */
import {initProductName, thirdContractSigning} from '../../../utils/utils.js';
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		notAllCar: false,
		carList: undefined,
		activeIndex: 1,
		passengerCarList: [],// 客车
		truckList: []// 货车
	},
	async onShow () {
		util.resetData();// 重置数据
		app.globalData.isTruckHandling = false;
		app.globalData.isNeedReturnHome = false;
		if (app.globalData.userInfo.accessToken) {
			// if (!app.globalData.bankCardInfo?.accountNo) await util.getV2BankId();
			await util.getMemberStatus();
			await this.getMyETCList();
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
						// if (!app.globalData.bankCardInfo?.accountNo) await util.getV2BankId();
						await util.getMemberStatus();
						await this.getMyETCList();
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
				item['deductionMethod'] = initProductName(item);
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
				carList: this.data.activeIndex === 1 ? passengerCarList : truckList, // 初始化变量
				truckList: truckList,
				passengerCarList: passengerCarList
			});
			// 查询是否欠款
			await util.getIsArrearage();
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
		if (orderInfo.isNewTrucks === 1 && orderInfo.status !== 1) {
			util.showToastNoIcon('货车办理系统升级中，暂时不可申办');
			return;
		}
		if (orderInfo.orderType === 51 && orderInfo.status !== 1) {
			util.showToastNoIcon('请返回原渠道办理');
			return;
		}
		app.globalData.isCheckCarChargeType = orderInfo.obuCardType === 1 && (orderInfo.orderType === 11 || orderInfo.orderType === 71 || orderInfo.promoterType === 41) && orderInfo.auditStatus === 0;
		app.globalData.processFlowVersion = orderInfo.flowVersion;
		app.globalData.orderInfo.orderId = orderInfo.id;
		app.globalData.truckLicensePlate = orderInfo.vehPlates;
		if (orderInfo.orderType === 31 && orderInfo.status === 0) {
			util.alert({
				title: '提示',
				content: '当前订单无法修改，请联系业务员或在线客服处理！',
				confirmText: '我知道了',
				confirm: () => {
				}
			});
			return;
		}
		if ((orderInfo.orderType === 31 && orderInfo.pledgeStatus === 0) || (orderInfo.orderType === 51 && orderInfo.contractStatus !== 1)) {
			// 业务员端办理 & 待支付
			if (orderInfo.isShowRightsDesc === 1 && ((orderInfo.isNeedSign === 1 && (!orderInfo.userSign || !orderInfo.verifyCode)) || orderInfo.isNeedSign === 0)) {
				// 需要查看权益
				util.go(`/pages/default/statement_of_interest/statement_of_interest?isNeedSign=${orderInfo.isNeedSign}&orderType=${orderInfo.orderType}`);
				return;
			}
		}
		const fun = {
			1: () => this.onClickBackToSign(orderInfo),// 恢复签约
			2: () => this.onClickContinueHandle(orderInfo),// 继续办理
			3: () => this.goPayment(orderInfo), // 去支付
			4: () => this.onClickContinueHandle(orderInfo), // 继续办理
			5: () => this.onClickBackToSign(orderInfo), // 签约微信支付 - 去签约
			6: () => this.onClickViewProcessingProgressHandle(orderInfo), // 订单排队审核中 - 查看进度
			7: () => this.onClickModifiedData(orderInfo, true), // 修改资料 - 上传证件页
			8: () => this.onClickViewProcessingProgressHandle(orderInfo), // 不可办理
			9: () => this.onClickHighSpeedSigning(orderInfo), // 去签约
			10: () => this.onClickViewProcessingProgressHandle(orderInfo), // 查看进度
			11: () => this.onClickCctivate(orderInfo), // 去激活
			13: () => this.goBindingAccount(orderInfo), // 去开户
			14: () => this.goRechargeAuthorization(orderInfo), // 去授权预充保证金
			15: () => this.goRecharge(orderInfo), // 保证金预充失败 - 去预充
			16: () => this.goBindingWithholding(orderInfo), // 选装-未已绑定车辆代扣
			17: () => this.onClickViewProcessingProgressHandle(orderInfo), // 去预充(预充流程)-查看进度
			19: () => this.onClickModifiedData(orderInfo, false),
			20: () => this.onClickVerification(orderInfo),
			21: () => this.onClickSignBank(orderInfo),
			22: () => this.onClickSignTongTongQuan(orderInfo),// 签约通通券代扣
			23: () => this.goPayment(orderInfo)
		};
		fun[orderInfo.selfStatus].call();
	},
	// 通通券签约
	async onClickSignTongTongQuan () {
		let params = {
			orderId: app.globalData.orderInfo.orderId // 订单id
		};
		const result = await util.getDataFromServersV2('consumer/order/thirdContract', params);
		if (!result) return;
		if (result.code === 0) {
			thirdContractSigning(result.data);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 交行-去签约
	onClickSignBank (orderInfo) {
		util.go(`/pages/truck_handling/signed/signed`);
	},
	// 交行-去腾讯云核验
	onClickVerification () {
		util.go(`/pages/truck_handling/face_of_check_tips/face_of_check_tips`);
	},
	// 选装-去绑定代扣
	goBindingWithholding () {
		util.go(`/pages/default/bind_withhold/bind_withhold?associatedVeh=1`);
	},
	// 去高速签约
	onClickHighSpeedSigning (orderInfo) {
		// if (orderInfo.protocolStatus === 0) {
		// 	this.goPayment(orderInfo);
		// 	return;
		// }
		wx.uma.trackEvent('my_etc_for_order_audit');
		util.go(`/pages/default/${orderInfo.orderType === 31 ? 'transition_page' : 'order_audit'}/${orderInfo.orderType === 31 ? 'transition_page' : 'order_audit'}`);
	},
	// 去开户
	goBindingAccount (orderInfo) {
		wx.uma.trackEvent('my_etc_for_binding_account');
		const path = `${orderInfo.flowVersion === 7 ? 'binding_account_bocom' : 'binding_account'}`;
		util.go(`/pages/truck_handling/${path}/${path}`);
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
			this.handleActivate(obj);
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
		this.handleActivate(obj);
	},
	handleActivate (obj) {
		wx.setStorageSync('baseInfo', {
			orderId: obj.id,
			mobilePhone: app.globalData.userInfo.mobilePhone,
			channel: obj.obuCardType,
			qtLimit: '',// 青通卡激活所需,暂未写
			serverId: obj.shopId,
			carNoStr: obj.vehPlates,
			obuStatus: obj.obuStatus
		});
		// ETC卡信息 1-贵州黔通卡 2-内蒙古蒙通卡 3-山东鲁通卡 4-青海青通卡 5-天津速通卡 6-陕西三秦通卡 7-广东粤通卡 8-辽宁辽通卡 9-齐鲁高速鲁通卡 10-湘通卡
		if (obj.obuCardType === 10) {
			util.go(`/pages/obu_activate/neimeng_choice/neimeng_choice?obuCardType=${obj.obuCardType}`);
			return;
		}
		if (obj.obuCardType === 2) {
			if (!this.data.choiceEquipment) {
				this.setData({
					choiceEquipment: this.selectComponent('#choiceEquipment')
				});
			}
			this.data.choiceEquipment.switchDisplay(true);
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
		if (orderInfo.promoterType === 41 && orderInfo.vehPlates.length === 11) {	// 业务员空发
			util.go(`/pages/empty_hair/empty_package/empty_package?shopProductId=${orderInfo.shopProductId}`);
			return;
		}
		const path = orderInfo.isNewTrucks === 1 ? 'truck_handling' : 'default';
		wx.uma.trackEvent(orderInfo.isNewTrucks === 1 ? 'my_etc_for_truck_package' : 'my_etc_for_package');
		util.go(`/pages/${path}/package_the_rights_and_interests/package_the_rights_and_interests`);
	},
	//	查看详情
	onClickGoETCDetailHandle (e) {
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
		app.globalData.isModifiedData = false; // 非修改资料
		app.globalData.firstVersionData = false;
		const path = orderInfo.isNewTrucks === 1 ? 'truck_handling' : 'default';
		if (orderInfo.orderType === 31 && orderInfo.isSignTtCoupon === 1) {
			// 通通券套餐流程
			if (orderInfo.ttContractStatus === 1 && orderInfo.ttDeductStatus !== 1) {
				// 已签约通通券 & 未扣款
				util.go('/pages/default/payment_fail/payment_fail');
				return;
			}
			util.go(`/pages/default/package_the_rights_and_interests/package_the_rights_and_interests?contractStatus=${orderInfo.contractStatus}&ttContractStatus=${orderInfo.ttContractStatus}`);
			return;
		}
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
		if (orderInfo.promoterType === 41 && orderInfo.vehPlates.length === 11) {	// 业务员空发
			util.go(`/pages/empty_hair/write_base_information/write_base_information`);
			return;
		}
		if (orderInfo.orderType === 71 && orderInfo.vehPlates && !orderInfo.isOwner && orderInfo?.pledgeStatus !== 1) {	// 电商空发订单
			util.go(`/pages/${path}/package_the_rights_and_interests/package_the_rights_and_interests?emptyHairOrder=true`);
			return;
		}
		wx.uma.trackEvent(orderInfo.isNewTrucks === 1 ? 'my_etc_for_certificate_to_truck_package' : 'my_etc_for_certificate_to_package');
		util.go(`/pages/${path}/information_list/information_list`);
	},
	// 新增
	onClickAddNewHandle () {
		app.globalData.orderInfo.orderId = '';
		wx.uma.trackEvent(this.data.activeIndex === 1 ? 'my_etc_for_new_deal_with' : 'my_etc_for_truck_new_deal_with');
		const url = this.data.activeIndex === 1 ? '/pages/default/receiving_address/receiving_address' : '/pages/truck_handling/truck_receiving_address/truck_receiving_address';
		util.go(url);
	},
	// 恢复签约
	async onClickBackToSign (obj) {
		// if (obj.orderType === 31 && obj.protocolStatus === 0) {
		// 	const path = obj.isNewTrucks === 1 ? 'truck_handling' : 'default';
		// 	util.go(`/pages/${path}/package_the_rights_and_interests/package_the_rights_and_interests`);
		// 	return;
		// }
		if ((obj.shopProductId === app.globalData.cictBankObj.citicBankshopProductId || obj.shopProductId === app.globalData.cictBankObj.citicBankShopshopProductId) && !obj.contractStatus) {
			util.go(`/pages/default/citic_bank_sign/citic_bank_sign`);
			return;
		}
		if (obj.orderType === 31 && obj.auditStatus === 0 && obj.flowVersion !== 1) {
			this.onClickHighSpeedSigning(obj);
			return;
		}
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
	async onClickModifiedData (orderInfo, isChange) {
		if (orderInfo.isNewTrucks === 1) {
			if (orderInfo.flowVersion === 4) {
				// 预充流程取消办理
				await this.cancelOrder(orderInfo);
				return;
			}
			// 货车办理
			wx.uma.trackEvent('my_etc_for_truck_modified_data');
			util.go(`/pages/truck_handling/information_list/information_list?isModifiedData=${isChange}`);
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
	},
	// 取消订单
	async cancelOrder (orderInfo) {
		util.showLoading({
			title: '取消中...'
		});
		const result = await util.getDataFromServersV2('consumer/order/cancel-order', {
			orderId: orderInfo.id
		});
		if (!result) return;
		if (result.code === 0) {
			let removeList = ['passenger-car-id-card-back', 'passenger-car-id-card-face', 'passenger-car-driving-license-face', 'passenger-car-driving-license-back', 'passenger-car-headstock'];
			removeList.map(item => wx.removeStorageSync(item));
			wx.redirectTo({
				url: '/pages/personal_center/cancel_order_succeed/cancel_order_succeed'
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	}
});
