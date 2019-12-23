/**
 * @author 狂奔的蜗牛
 * @desc 首页
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		loginInfo: {},// 登录信息
		orderInfo: {} // 订单信息
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
				if (res.data.orderInfo) {
					console.log(res.data.orderInfo);
				}
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
	}
});
