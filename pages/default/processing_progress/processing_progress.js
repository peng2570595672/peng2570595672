/**
 * @author 狂奔的蜗牛
 * @desc 办理进度
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		dashedHeight: 0,
		accountVerification: 0, //  0 没有核验id   1：核验成功，2-正在核验
		info: undefined
	},
	onLoad (options) {
		if (options.type) {
			this.setData({
				type: options.type
			});
		}
		let that = this;
		this.getProcessingProgress();
	},
	// 去激活
	onClickCctivate () {
		if (this.data.info.logisticsId === 0) {
			this.onClickViewProcessingProgressHandle();
		} else {
			this.confirmReceipt();
		}
	},
	// 获取办理进度
	getProcessingProgress () {
		util.showLoading();
		util.getDataFromServer('consumer/order/transact-schedule', {
			orderId: app.globalData.orderInfo.orderId
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					info: res.data
				});
				if (this.data.info.orderVerificationId) {
					this.refreshCheck();
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 刷新1分钱核验
	refreshCheck () {
		util.showLoading();
		util.getDataFromServer('consumer/order/order-verification-status-refresh', {
			orderVerificationId: this.data.info.orderVerificationId
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					accountVerification: res.data.status
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 下一步
	next () {
		util.go('/pages/default/payment_way/payment_way');
	},
	// 上传行驶证
	onClickUploadDrivingLicenseHandle () {
		util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license?type=0');
	},
	// 在线客服
	goOnlineServer () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	},
	// 复制快递单号
	copyLogisticsNo (e) {
		let logisticsNo = e.currentTarget.dataset['no'];
		wx.setClipboardData({
			data: logisticsNo,
			success (res) {
				wx.getClipboardData({
					success (res) {
						console.log(res.data); // data 剪贴板的内容
					}
				});
			}
		});
	},
	// 确认收货
	confirmReceipt () {
		util.showLoading();
		util.getDataFromServer('consumer/order/affirm-take-obu', {
			logisticsId: this.data.info.logisticsId
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
	onUnload () {
		if (this.data.type === 'main_process') {
			wx.reLaunch({
				url: '/pages/default/index/index'
			});
		}
	}
});
