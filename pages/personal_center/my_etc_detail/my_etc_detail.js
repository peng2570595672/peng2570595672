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
	onShow () {
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		} else {
			this.getETCDetail();
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
							this.getETCDetail();
						} else {
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
	// 加载订单详情
	getETCDetail () {
		util.showLoading();
		util.getDataFromServer('consumer/order/order-detail', {
			orderId: this.data.orderId
		}, () => {
			util.showToastNoIcon('获取设备详情失败！');
		}, (res) => {
			if (res.code === 0) {
				let orderInfo = res.data;
				if (orderInfo.remark && orderInfo.remark.indexOf('迁移订单数据') !== -1) {
					orderInfo['selfStatus'] = util.getStatusFirstVersion(orderInfo);
				} else {
					orderInfo['selfStatus'] = util.getStatus(orderInfo);
				}
				this.setData({
					orderInfo
				});
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
			util.alert({
				title: `您即将前往车主服务。`,
				content: `注意:请勿暂停车主服务，扣费失败您的ETC可能被拉入黑名单，影响高速通行`,
				showCancel: true,
				cancelText: '取消',
				confirmText: '继续前往',
				confirm: () => {
					this.onClickSwitchBank();
				},
				cancel: () => {
				}
			});
		}
		// this.setData({
		// 	showDetailWrapper: true,
		// 	showDetailMask: true
		// });
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
			cancel: () => {
				this.cancelOrder();
			}
		});
	},
	// 修改资料
	onClickModifiedData () {
		if (util.getHandlingType(this.data.orderInfo)) {
			util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
			return;
		}
		app.globalData.orderInfo.orderId = this.data.orderId;
		app.globalData.orderInfo.shopProductId = this.data.orderInfo.shopProductId;
		app.globalData.isModifiedData = true; // 修改资料
		if (this.data.orderInfo.remark && this.data.orderInfo.remark.indexOf('迁移订单数据') !== -1) {
			// 1.0数据
			wx.removeStorageSync('driving_license_face');
			wx.removeStorageSync('driving_license_back');
			wx.removeStorageSync('car_head_45');
			app.globalData.firstVersionData = true;
		} else {
			app.globalData.firstVersionData = false;
		}
		util.go('/pages/default/information_validation/information_validation');
	},
	// 取消订单
	cancelOrder () {
		util.showLoading({
			title: '取消中...'
		});
		util.getDataFromServer('consumer/order/cancel-order', {
			orderId: this.data.orderId
		}, () => {
			util.showToastNoIcon('取消订单失败！');
		}, (res) => {
			if (res.code === 0) {
				wx.redirectTo({
					url: '/pages/personal_center/cancel_order_succeed/cancel_order_succeed'
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 查看办理进度
	onClickViewProcessingProgressHandle () {
		app.globalData.orderInfo.orderId = this.data.orderInfo.id;
		util.go(`/pages/default/processing_progress/processing_progress?orderId=${this.data.orderInfo.id}`);
	},
	// 切换银行卡
	onClickSwitchBank () {
		app.globalData.orderInfo.orderId = this.data.orderInfo.id;
		util.getDataFromServer('consumer/order/query-contract', {
			orderId: app.globalData.orderInfo.orderId
		}, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				// 签约成功 userState: "NORMAL"
				if (res.data.contractStatus !== 1) {
					if (res.data.version === 'v3') {
						// 3.0
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
							util.alert({
								title: ``,
								content: `签约信息异常，请联系在线客服处理！`,
								showCancel: true,
								cancelText: '取消',
								confirmText: '联系客服',
								confirm: () => {
									this.goOnlineServer();
								},
								cancel: () => {
								}
							});
						}
					} else {
						// 2.0
						this.weChatSign();
					}
				} else {
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
							util.alert({
								title: ``,
								content: `签约信息异常，请联系在线客服处理！`,
								showCancel: true,
								cancelText: '取消',
								confirmText: '联系客服',
								confirm: () => {
									this.goOnlineServer();
								},
								cancel: () => {
								}
							});
						}
					}
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	//  恢复签约
	onClickBackToSign () {
		if (this.data.orderInfo.contractStatus === 2) {
			// 解约重签
			app.globalData.orderInfo.orderId = this.data.orderId;
			app.globalData.signAContract = 1;
			this.onClickSwitchBank();
		} else {
			// 立即签约
			let isFirstVersion = false;
			if (this.data.orderInfo.remark && this.data.orderInfo.remark.indexOf('迁移订单数据') !== -1) {
				// 1.0数据 立即签约 需标记资料已完善
				isFirstVersion = true;
			}
			if (this.data.orderInfo.orderType === 31) {
				app.globalData.isSalesmanOrder = true;
			} else {
				app.globalData.isSalesmanOrder = false;
			}
			app.globalData.signAContract = -1;
			this.weChatSign(isFirstVersion);
		}
	},
	// 微信签约
	weChatSign (isFirstVersion) {
		util.showLoading('加载中');
		let params = {
			orderId: this.data.orderId,// 订单id
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		if (isFirstVersion) {
			params['upgradeToTwo'] = true; // 1.0数据转2.0
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
				app.globalData.belongToPlatform = this.data.orderInfo.platformId;
				app.globalData.orderInfo.orderId = this.data.orderInfo.id;
				app.globalData.contractStatus = this.data.orderInfo.contractStatus;
				app.globalData.orderStatus = this.data.orderInfo.selfStatus;
				app.globalData.orderInfo.shopProductId = this.data.orderInfo.shopProductId;
				if (result.version === 'v2') {
					wx.navigateToMiniProgram({
						appId: 'wxbcad394b3d99dac9',
						path: 'pages/route/index',
						extraData: result.extraData,
						fail () {
							util.showToastNoIcon('调起车主服务签约失败, 请重试！');
						}
					});
				} else { // 签约车主服务 3.0
					wx.navigateToMiniProgram({
						appId: 'wxbcad394b3d99dac9',
						path: 'pages/etc/index',
						extraData: {
							preopen_id: result.extraData.peropen_id
						},
						fail () {
							util.showToastNoIcon('调起车主服务签约失败, 请重试！');
						}
					});
				}
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
	// 继续办理
	onClickContinueHandle () {
		if (util.getHandlingType(this.data.orderInfo)) {
			util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
			return;
		}
		app.globalData.isModifiedData = false; // 非修改资料
		app.globalData.orderInfo.orderId = this.data.orderInfo.id;
		if (this.data.orderInfo.remark && this.data.orderInfo.remark.indexOf('迁移订单数据') !== -1) {
			// 1.0数据
			app.globalData.firstVersionData = true;
			util.go('/pages/default/payment_way/payment_way');
		} else {
			app.globalData.firstVersionData = false;
			// 服务商套餐id，0表示还未选择套餐，其他表示已经选择套餐
			// 只提交了车牌 车牌颜色 收货地址 或者未签约 前往套餐选择
			// "etcContractId": "", //签约id，0表示未签约，其他表示已签约
			if (this.data.orderInfo.shopProductId === 0 || this.data.orderInfo.etcContractId === 0) {
				util.go('/pages/default/payment_way/payment_way');
			} else if (this.data.orderInfo.isVehicle === 0) {
				// 是否上传行驶证， 0未上传，1已上传
				app.globalData.orderInfo.shopProductId = this.data.orderInfo.shopProductId;
				if (wx.getStorageSync('corresponding_package_id') !== app.globalData.orderInfo.orderId) {
					// 行驶证缓存关联订单
					wx.setStorageSync('corresponding_package_id', app.globalData.orderInfo.orderId);
					wx.removeStorageSync('driving_license_face');
					wx.removeStorageSync('driving_license_back');
					wx.removeStorageSync('car_head_45');
				}
				if (wx.getStorageSync('driving_license_face')) {
					util.go('/pages/default/information_validation/information_validation');
				} else {
					util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license');
				}
			} else if (this.data.orderInfo.isVehicle === 1 && this.data.orderInfo.isOwner === 1) {
				// 已上传行驶证， 未上传车主身份证
				util.go('/pages/default/update_id_card/update_id_card?type=normal_process');
			}
		}
	},
	// 在线客服
	goOnlineServer () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	// 去激活
	onClickCctivate () {
		if (this.data.orderInfo.orderType === 11) {
			if (this.data.orderInfo.logisticsId === 0) {
				this.onClickViewProcessingProgressHandle();
			} else {
				this.confirmReceipt();
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
	},
	// 确认收货
	confirmReceipt () {
		util.showLoading();
		util.getDataFromServer('consumer/order/affirm-take-obu', {
			logisticsId: this.data.orderInfo.logisticsId
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
	}
});
