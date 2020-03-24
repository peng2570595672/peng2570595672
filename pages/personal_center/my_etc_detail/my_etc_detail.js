/**
 * @author 狂奔的蜗牛
 * @desc etc详情
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		orderInfo: undefined // 订单详情
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
		this.getETCDetail();
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
				orderInfo['selfStatus'] = util.getStatus(orderInfo);
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
		app.globalData.orderInfo.orderId = this.data.orderId;
		app.globalData.orderInfo.shopProductId = this.data.orderInfo.shopProductId;
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
		util.go('/pages/default/processing_progress/processing_progress');
	},
	//  恢复签约
	onClickBackToSign () {
		if (this.data.orderInfo.contractStatus === 2) {
			// 解约重签
			app.globalData.orderInfo.orderId = this.data.orderId;
			util.getDataFromServer('consumer/order/query-contract', {
				orderId: app.globalData.orderInfo.orderId
			}, () => {
				util.hideLoading();
			}, (res) => {
				util.hideLoading();
				if (res.code === 0) {
					app.globalData.signAContract = 1;
					// 签约成功 userState: "NORMAL"
					if (res.data.contractStatus === 2) {
						if (res.data.contractId) {
							// 3.0
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
							// 2.0
							this.weChatSign();
						}
					}
				} else {
					util.showToastNoIcon(res.message);
				}
			}, app.globalData.userInfo.accessToken);
		} else {
			// 立即签约
			app.globalData.signAContract = -1;
			this.weChatSign();
		}
	},
	// 微信签约
	weChatSign () {
		util.showLoading('加载中');
		let params = {
			orderId: this.data.orderId,// 订单id
			dataComplete: 1,// 订单资料是否已完善 1-是，0-否
			needSignContract: true // 是否需要签约 true-是，false-否
		};
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
				app.globalData.contractStatus =  this.data.orderInfo.contractStatus;
				app.globalData.orderStatus =  this.data.orderInfo.selfStatus;
				app.globalData.orderInfo.shopProductId =  this.data.orderInfo.shopProductId;
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
		// 服务商套餐id，0表示还未选择套餐，其他表示已经选择套餐
		// 只提交了车牌 车牌颜色 收货地址 或者未签约 前往套餐选择
		// "etcContractId": "", //签约id，0表示未签约，其他表示已签约
		if (this.data.orderInfo.shopProductId === 0 || this.data.orderInfo.etcContractId === 0) {
			app.globalData.orderInfo.orderId = this.data.orderInfo.id;
			util.go('/pages/default/payment_way/payment_way');
		} else if (this.data.orderInfo.shopProductId !== 0 && this.data.orderInfo.isVehicle === 0) {
			// 是否上传行驶证， 0未上传，1已上传
			app.globalData.orderInfo.orderId = this.data.orderInfo.id;
			app.globalData.orderInfo.shopProductId = this.data.orderInfo.shopProductId;
			if (wx.getStorageSync('driving_license_face')) {
				util.go('/pages/default/information_validation/information_validation');
			} else {
				util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license');
			}
		} else if (this.data.orderInfo.isVehicle === 1 && this.data.orderInfo.isOwner === 1) {
			// 已上传行驶证， 未上传车主身份证
			app.globalData.orderInfo.orderId = this.data.orderInfo.id;
			util.go('/pages/default/update_id_card/update_id_card?type=normal_process');
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
				appId: 'wxaca5642db7afd470',
				path: 'pages/online_distribution/online_distribution',
				envVersion: 'trial', // 目前联调为体验版
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
					appId: 'wxaca5642db7afd470',
					path: 'pages/online_distribution/online_distribution',
					envVersion: 'trial', // 目前联调为体验版
					fail () {
						util.showToastNoIcon('调起激活小程序失败, 请重试！');
					}
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
});
