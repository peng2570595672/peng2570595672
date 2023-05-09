/**
 * @author 狂奔的蜗牛
 * @desc etc详情
 */
import {initProductName, thirdContractSigning} from '../../../utils/utils.js';
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		orderInfo: undefined, // 订单详情
		showDetailWrapper: false,
		showDetailMask: false,
		orderId: undefined
	},
	async onLoad (options) {
		util.resetData();// 重置数据
		app.globalData.isTruckHandling = false;
		app.globalData.isNeedReturnHome = false;
		if (options.orderId) {
			this.setData({
				orderId: options.orderId
			});
		} else {
			this.setData({
				orderId: app.globalData.orderInfo.orderId
			});
		}
	},
	async onShow () {
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		} else {
			// if (!app.globalData.bankCardInfo?.accountNo) await util.getV2BankId();
			await util.getMemberStatus();
			await this.getETCDetail();
		}
		if (this.data.showDetailMask) {
			this.hide();
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
				if (!result) return;
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
						await this.getETCDetail();
					}
				} else {
					util.showToastNoIcon(result.message);
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	// 加载订单详情
	async getETCDetail () {
		const result = await util.getDataFromServersV2('consumer/order/order-detail', {
			orderId: this.data.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			let orderInfo = result.data;
			orderInfo['selfStatus'] = orderInfo.isNewTrucks === 1 ? util.getTruckHandlingStatus(orderInfo) : util.getStatus(orderInfo);
			orderInfo['deductionMethod'] = initProductName(orderInfo);
			console.log(orderInfo,'===========订单数据==================');

			this.setData({
				orderInfo
			});
			this.getProductOrderInfo();
			// 查询是否欠款
			util.getIsArrearage();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 根据订单id获取套餐信息
	getProductOrderInfo () {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-product-by-order-id', {
			orderId: this.data.orderId
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					productInfo: res.data
				});
				if (res.data?.fenCheck === 1) {
					this.setData({
						tipsForDeduction: true
					});
				}
				if (res.data?.productProcess === 3) {
					this.getOrderInfo();
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 显示跳转车主服务弹窗
	onClickBank () {
		if (this.data.orderInfo.contractVersion === 'v3') {
			wx.uma.trackEvent('etc_detail_switch_bank_cards');
			util.alert({
				title: `您即将前往车主服务。`,
				content: `注意:请勿暂停车主服务，扣费失败您的ETC可能被拉入黑名单，影响高速通行`,
				showCancel: true,
				cancelText: '取消',
				confirmText: '继续前往',
				confirm: async () => {
					await this.onClickSwitchBank();
				},
				cancel: () => {
				}
			});
		}
	},
	// 关闭跳转车主服务弹窗
	close () {},
	hide () {
		this.setData({
			showDetailWrapper: false
		});
		setTimeout(() => {
			this.setData({
				showDetailMask: false
			});
		}, 400);
	},
	// 点击取消订单
	onClickCancelHandle () {
		wx.uma.trackEvent('etc_detail_for_cancel_order_to_alert');
		util.alert({
			content: '确定要取消办理吗？',
			showCancel: true,
			cancelText: '取消办理',
			confirmText: '手误了',
			cancel: async () => {
				await this.cancelOrder();
			}
		});
	},
	// 点击车辆信息
	onClickVehicle () {
		const orderInfo = this.data.orderInfo;
		if (orderInfo.isNewTrucks === 1 && orderInfo.status !== 1) {
			util.showToastNoIcon('货车办理系统升级中，暂时不可申办');
			return;
		}
		if (orderInfo.orderType === 51 && orderInfo.status !== 1) {
			util.showToastNoIcon('请返回原渠道办理');
			return;
		}
		app.globalData.isCheckCarChargeType = orderInfo.obuCardType === 1 && (orderInfo.orderType === 11 || orderInfo.orderType === 71 || orderInfo.promoterType === 41) && orderInfo.auditStatus === 0;
		app.globalData.orderInfo.orderId = orderInfo.id;
		app.globalData.processFlowVersion = orderInfo.flowVersion;
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
		wx.uma.trackEvent('etc_detail_for_order_audit');
		util.go(`/pages/default/${orderInfo.orderType === 31 ? 'transition_page' : 'order_audit'}/${orderInfo.orderType === 31 ? 'transition_page' : 'order_audit'}`);
	},
	// 去开户
	goBindingAccount (orderInfo) {
		wx.uma.trackEvent('etc_detail_for_binding_account');
		const path = `${orderInfo.flowVersion === 7 ? 'binding_account_bocom' : 'binding_account'}`;
		util.go(`/pages/truck_handling/${path}/${path}`);
	},
	// 去授权预充保证金
	goRechargeAuthorization () {
		wx.uma.trackEvent('etc_detail_for_recharge_instructions');
		util.go('/pages/truck_handling/recharge_instructions/recharge_instructions');
	},
	// 去预充
	goRecharge (orderInfo) {
		wx.uma.trackEvent('etc_detail_for_account_recharge');
		util.go(`/pages/account_management/account_recharge/account_recharge?money=${orderInfo.holdBalance}`);
	},
	// 去支付
	goPayment (orderInfo) {
		if (orderInfo.promoterType === 41 && orderInfo.vehPlates.length === 11) {	// 业务员空发
			util.go(`/pages/empty_hair/empty_package/empty_package?shopProductId=${orderInfo.shopProductId}`);
			return;
		}
		const path = orderInfo.isNewTrucks === 1 ? 'truck_handling' : 'default';
		wx.uma.trackEvent(orderInfo.isNewTrucks === 1 ? 'etc_detail_for_truck_package' : 'etc_detail_for_package');
		util.go(`/pages/${path}/package_the_rights_and_interests/package_the_rights_and_interests`);
	},
	// 修改资料
	onClickModifiedData (orderInfo, isChange) {
		if (this.data.orderInfo.isNewTrucks === 1) {
			// 货车办理
			wx.uma.trackEvent('etc_detail_for_truck_modified_data');
			util.go(`/pages/truck_handling/information_list/information_list?isModifiedData=${isChange}`);
			return;
		}
		if (util.getHandlingType(this.data.orderInfo)) {
			util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
			return;
		}
		wx.uma.trackEvent('etc_detail_for_modified_data');
		app.globalData.orderInfo.shopProductId = this.data.orderInfo.shopProductId;
		app.globalData.isModifiedData = true; // 修改资料
		util.go(`/pages/default/information_list/information_list?isModifiedData=true`);
	},
	// 取消订单
	async cancelOrder () {
		wx.uma.trackEvent('etc_detail_for_cancel_order');
		util.showLoading({
			title: '取消中...'
		});
		const result = await util.getDataFromServersV2('consumer/order/cancel-order', {
			orderId: this.data.orderId
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
	},
	// 查看办理进度
	onClickViewProcessingProgressHandle () {
		wx.uma.trackEvent('etc_detail_for_processing_progress');
		util.go(`/pages/default/processing_progress/processing_progress?orderId=${this.data.orderInfo.id}`);
	},
	// 切换银行卡
	async onClickSwitchBank () {
		wx.uma.trackEvent('etc_detail_switch_bank_cards_to_go');
		app.globalData.orderInfo.orderId = this.data.orderInfo.id;
		const result = await util.getDataFromServersV2('consumer/order/query-contract', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			// 签约成功 userState: "NORMAL"
			if (result.data.contractStatus !== 1) {
				if (result.data.version === 'v3') {
					// 3.0
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
						await this.weChatSign();
					}
				} else {
					// 2.0
					await this.weChatSign();
				}
			} else {
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
						await this.weChatSign();
					}
				}
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 恢复签约
	async onClickBackToSign (obj) {
		// if (obj.orderType === 31 && obj.protocolStatus === 0) {
		// 	const path = obj.isNewTrucks === 1 ? 'truck_handling' : 'default';
		// 	util.go(`/pages/${path}/package_the_rights_and_interests/package_the_rights_and_interests`);
		// 	return;
		// }
		if (obj.shopId === app.globalData.citicBankShopId && !obj.contractStatus) {
			util.go(`/pages/default/citic_bank_sign/citic_bank_sign`);
			return;
		}
		if (obj.orderType === 31 && obj.auditStatus === 0 && obj.flowVersion !== 1) {
			this.onClickHighSpeedSigning(obj);
			return;
		}
		if (obj.isNewTrucks === 1) {
			wx.uma.trackEvent('etc_detail_for_contract_management');
			util.go(`/pages/truck_handling/contract_management/contract_management`);
			return;
		}
		app.globalData.isSecondSigning = false;
		app.globalData.isSecondSigningInformationPerfect = obj.status === 1;
		if (obj.logisticsId !== 0 || obj.obuStatus === 5 || obj.obuStatus === 1) app.globalData.isSecondSigning = true;
		// 新流程
		if (obj.contractStatus === 2) {
			wx.uma.trackEvent('etc_detail_for_resume_signing');
			// 恢复签约
			await this.restoreSign(obj);
		} else {
			// 2.0 立即签约
			wx.uma.trackEvent('etc_detail_for_sign_contract');
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
	async weChatSign (isFirstVersion) {
		util.showLoading('加载中');
		let params = {
			orderId: this.data.orderId,// 订单id
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		if (isFirstVersion) {
			params['upgradeToTwo'] = true; // 1.0数据转2.0
			params['dataComplete'] = 1; // 资料已完善
		}
		if (this.data.orderInfo.isNewTrucks === 1 && this.data.orderInfo.status === 0) {
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
			app.globalData.belongToPlatform = this.data.orderInfo.platformId;
			app.globalData.contractStatus = this.data.orderInfo.contractStatus;
			app.globalData.orderStatus = this.data.orderInfo.selfStatus;
			app.globalData.orderInfo.shopProductId = this.data.orderInfo.shopProductId;
			app.globalData.signAContract === -1;
			util.weChatSigning(res);
		} else {
			util.showToastNoIcon(result.message);
		}
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
		wx.uma.trackEvent(orderInfo.isNewTrucks === 1 ? 'etc_detail_for_certificate_to_truck_package' : 'etc_detail_for_certificate_to_package');
		util.go(`/pages/${path}/information_list/information_list`);
	},
	// 在线客服
	goOnlineServer () {
		wx.uma.trackEvent('etc_detail_for_server');
		util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	// 去激活
	async onClickCctivate () {
		wx.uma.trackEvent('etc_detail_for_activation');
		if (!this.data.orderInfo?.logisticsId) {
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
			await this.confirmReceipt();
		}
	},
	// 确认收货
	async confirmReceipt () {
		const result = await util.getDataFromServersV2('consumer/order/affirm-take-obu', {
			logisticsId: this.data.orderInfo.logisticsId
		});
		if (!result) return;
		if (result.code === 0) {
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
			util.showToastNoIcon(result.message);
		}
	}
});
