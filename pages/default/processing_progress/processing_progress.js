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
		info: undefined,
		isContinentInsurance: false, // 是否是大地保险
		showDetailWrapper: false,
		showDetailMask: false
	},
	onLoad (options) {
		this.setData({
			isContinentInsurance: app.globalData.isContinentInsurance
		});
		if (!this.data.isContinentInsurance) {
			let time = new Date().toLocaleDateString();
			let that = this;
			// 首先获取是否执行过
			wx.getStorage({
				key: 'today',
				success: function (res) {
					// 成功的话 说明之前执行过，再判断时间是否是当天
					if (res.data && res.data !== time) {
						that.showDetail();
					}
				},
				fail: function (res) {
					// 没有执行过的话 先存一下当前的执行时间
					that.showDetail();
					wx.setStorageSync('today', new Date().toLocaleDateString());
				}
			});
		}
		if (options.type) {
			this.setData({
				type: options.type
			});
		}
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		} else {
			this.getProcessingProgress();
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
							this.getProcessingProgress();
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
	// 去微保
	goMicroInsurance () {
		util.go(`/pages/web/web/web?type=weiBao`);
	},
	// 显示详情
	showDetail (e) {
		this.setData({
			showDetailWrapper: true,
			showDetailMask: true
		});
	},
	// 关闭详情
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
	// 确认收货去激活
	onClickCctivate () {
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
	goHome () {
		wx.reLaunch({
			url: '/pages/default/index/index'
		});
	},
	onUnload () {
		if (this.data.type === 'main_process') {
			wx.reLaunch({
				url: '/pages/default/index/index'
			});
		}
	}
});
