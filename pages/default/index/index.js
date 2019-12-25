/**
 * @author 狂奔的蜗牛
 * @desc 首页
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		loginInfo: {},// 登录信息
		orderInfo: undefined // 订单信息
	},
	onLoad () {
		this.login();
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
						this.setData({
							loginInfo: res.data
						});
						// 已经绑定了手机号
						if (res.data.needBindingPhone !== 1) {
							app.globalData.userInfo = res.data;
							// 查询最后一笔订单状态
							this.getStatus();
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
	// 获取手机号
	onGetPhoneNumber (e) {
		// 允许授权
		if (e.detail.errMsg === 'getPhoneNumber:ok') {
			let encryptedData = e.detail.encryptedData;
			let iv = e.detail.iv;
			util.showLoading({
				title: '绑定中...'
			});
			util.getDataFromServer('consumer/member/common/applet/bindingPhone', {
				certificate: this.data.loginInfo.certificate,
				encryptedData: encryptedData, // 微信加密数据
				iv: iv // 微信加密数据
			}, () => {
				util.hideLoading();
				util.showToastNoIcon('绑定手机号失败！');
			}, (res) => {
				// 绑定手机号成功
				if (res.code === 0) {
					app.globalData.uesrInfo = res.data; // 用户登录信息
					this.getStatus(); // 获取最后一笔订单状态
				} else {
					util.hideLoading();
					util.showToastNoIcon(res.message);
				}
			});
		}
	},
	// 获取最后有一笔订单信息
	getStatus () {
		util.getDataFromServer('consumer/order/home-info', {
		}, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				this.setData({
					orderInfo: res.data.orderInfo ? res.data.orderInfo : {}
				});
			} else {
				util.showToastNoIcon(res.message);
			}
			console.log(res);
		}, app.globalData.userInfo.accessToken);
	},
	// 免费办理
	freeProcessing () {
		util.go('/pages/default/receiving_address/receiving_address');
	},
	// 跳转到个人中心
	onClickForJumpPersonalCenterHandle (e) {
		let url = e.currentTarget.dataset.url;
		util.go(`/pages/personal_center/${url}/${url}`);
	},
	// 查看办理进度
	onClickViewProcessingProgressHandle () {
		app.globalData.orderInfo.orderId = this.data.orderInfo.id;
		util.go('/pages/default/processing_progress/processing_progress');
	},
	// 我的ETC
	onClickMyETCHandle () {
		util.go('/pages/personal_center/my_etc/my_etc');
	},
	// 继续办理
	onClickContinueHandle () {
		// 服务商套餐id，0表示还未选择套餐，其他表示已经选择套餐
		// 只提交了车牌 车牌颜色 收货地址 前往套餐选择
		if (this.data.orderInfo.shopProductId === 0) {
			app.globalData.orderInfo.orderId = this.data.orderInfo.id;
			util.go('/pages/default/payment_way/payment_way');
		} else if (this.data.orderInfo.isVehicle === 0) {
			// 是否上传行驶证， 0未上传，1已上传
			app.globalData.orderInfo.orderId = this.data.orderInfo.id;
			util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license');
		}
	}
});
