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
		this.setData({
			orderId: options.orderId
		});
		this.getETCDetail();
	},
	// 加载订单详情
	getETCDetail () {
		util.showLoading();
		util.getDataFromServer('consumer/order/order-detail', {
			orderId: this.data.orderId
		}, () => {
			util.showToastNoIcon('获取车辆列表失败！');
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
	// 继续办理
	onClickContinueHandle () {
		// 服务商套餐id，0表示还未选择套餐，其他表示已经选择套餐
		// 只提交了车牌 车牌颜色 收货地址 或者未签约 前往套餐选择
		// "etcContractId": "", //签约id，0表示未签约，其他表示已签约
		if (this.data.orderInfo.shopProductId === 0 || this.data.orderInfo.etcContractId === 0) {
			app.globalData.orderInfo.orderId = this.data.orderInfo.id;
			util.go('/pages/default/payment_way/payment_way');
		} else if (this.data.orderInfo.isVehicle === 0) {
			// 是否上传行驶证， 0未上传，1已上传
			app.globalData.orderInfo.orderId = this.data.orderInfo.id;
			util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license');
		}
	}
});
