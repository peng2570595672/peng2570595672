/**
 * @author 狂奔的蜗牛
 * @desc etc详情
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		orderInfo: undefined, // 订单详情
		showDetailWrapper: false,
		showDetailMask: false,
		orderId: undefined
	},
	onLoad (options) {
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
			this.setData({
				orderInfo
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 显示跳转车主服务弹窗
	onClickBank () {
		if (this.data.orderInfo.contractVersion === 'v3') {
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
	// 支付付费金额
	goPaymentAmount () {
		app.globalData.orderInfo = this.data.orderInfo;
		app.globalData.orderInfo.orderId = this.data.orderId;
		const pledgeMoney = this.data.orderInfo.pledgeMoney;
		const rightsPackagePayMoney = this.data.orderInfo.rightsPackagePayMoney;
		if (this.data.orderInfo.isNewTrucks === 1) {
			// 需要支付保证金
			util.go(`/pages/truck_handling/equipment_cost/equipment_cost?equipmentCost=${this.data.orderInfo.pledgeMoney}`);
			return;
		}
		util.go(`/pages/default/package_the_rights_and_interests/package_the_rights_and_interests`);
	},
	// 修改资料
	onClickModifiedData () {
		if (this.data.orderInfo.isNewTrucks === 1) {
			// 货车办理
			app.globalData.orderInfo.orderId = this.data.orderInfo.id;
			util.go('/pages/truck_handling/information_list/information_list?isModifiedData=true');
			return;
		}
		if (util.getHandlingType(this.data.orderInfo)) {
			util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
			return;
		}
		app.globalData.orderInfo.orderId = this.data.orderId;
		app.globalData.orderInfo.shopProductId = this.data.orderInfo.shopProductId;
		app.globalData.isModifiedData = true; // 修改资料
		util.go(`/pages/default/information_list/information_list?isModifiedData=true`);
	},
	// 取消订单
	async cancelOrder () {
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
		app.globalData.orderInfo.orderId = this.data.orderInfo.id;
		util.go(`/pages/default/processing_progress/processing_progress?orderId=${this.data.orderInfo.id}`);
	},
	// 切换银行卡
	async onClickSwitchBank () {
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
						await this.weChatSign(obj);
					}
				}
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	//  恢复签约
	async onClickBackToSign () {
		app.globalData.isSecondSigning = false;
		app.globalData.isSecondSigningInformationPerfect = this.data.orderInfo.status === 1;
		if (this.data.orderInfo.logisticsId !== 0 || this.data.orderInfo.obuStatus === 5 || this.data.orderInfo.obuStatus === 1) {
			app.globalData.isSecondSigning = true;
		}
		if (this.data.orderInfo.selfStatus === 10) {
			this.selectComponent('#notSigningPrompt').show();
		} else {
			if (this.data.orderInfo.contractStatus === 2) {
				// 解约重签
				app.globalData.orderInfo.orderId = this.data.orderId;
				app.globalData.signAContract = 1;
				await this.onClickSwitchBank();
			} else {
				// 立即签约
				let isFirstVersion = false;
				if (this.data.orderInfo.remark && this.data.orderInfo.remark.indexOf('迁移订单数据') !== -1) {
					// 1.0数据 立即签约 需标记资料已完善
					isFirstVersion = true;
				}
				app.globalData.isSalesmanOrder = this.data.orderInfo.orderType === 31;
				app.globalData.signAContract = -1;
				await this.weChatSign(isFirstVersion);
			}
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
			app.globalData.orderInfo.orderId = this.data.orderInfo.id;
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
	async onClickContinueHandle () {
		if (this.data.orderInfo.isNewTrucks === 1) {
			// 货车办理
			app.globalData.orderInfo.orderId = this.data.orderInfo.id;
			if (this.data.orderInfo.selfStatus === 1) {
				util.go('/pages/truck_handling/payment_way/payment_way');
			} else {
				util.go('/pages/truck_handling/information_list/information_list');
			}
			return;
		}
		if (util.getHandlingType(this.data.orderInfo)) {
			util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
			return;
		}
		app.globalData.isModifiedData = false; // 非修改资料
		app.globalData.orderInfo.orderId = this.data.orderInfo.id;
		if (this.data.orderInfo.shopProductId === 0) {
			const result = await util.initLocationInfo(this.data.orderInfo);
			if (!result) return;
			if (result.code) {
				util.showToastNoIcon(result.message);
				return;
			}
			if (!app.globalData.newPackagePageData.listOfPackages?.length) return;// 没有套餐
			if (app.globalData.newPackagePageData.type) {
				// 只有分对分套餐 || 只有总对总套餐
				util.go(`/pages/default/package_the_rights_and_interests/package_the_rights_and_interests?type=${app.globalData.newPackagePageData.type}`);
			} else {
				util.go(`/pages/default/choose_the_way_to_handle/choose_the_way_to_handle`);
			}
		} else if (this.data.orderInfo.pledgeStatus === 0) {
			// pledgeStatus 状态，-1 无需支付 0-待支付，1-已支付，2-退款中，3-退款成功，4-退款失败
			util.go(`/pages/default/package_the_rights_and_interests/package_the_rights_and_interests`);
		} else {
			util.go(`/pages/default/information_list/information_list`);
		}
	},
	// 在线客服
	goOnlineServer () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	// 去激活
	async onClickCctivate () {
		if (this.data.orderInfo.shopId && this.data.orderInfo.shopId === '624263265781809152') {
			// 津易行
			this.selectComponent('#notJinYiXingPrompt').show();
		} else {
			if (this.data.orderInfo.orderType === 11) {
				if (this.data.orderInfo.logisticsId === 0) {
					this.onClickViewProcessingProgressHandle();
				} else {
					await this.confirmReceipt();
				}
			} else {
				// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
				wx.navigateToMiniProgram({
					appId: 'wxdda17150b8e50bc4',
					path: 'pages/index/index',
					envVersion: 'release', // 目前联调为体验版
					fail () {
						util.showToastNoIcon('调起激活小程序失败, 请重试！');
					}
				});
			}
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
