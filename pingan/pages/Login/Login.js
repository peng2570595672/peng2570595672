/**
 * @author 狂奔的蜗牛
 * @desc 首页
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		canIUse: wx.canIUse('button.open-type.getUserInfo'),
		loginInfo: {},// 登录信息
		selfStatus: undefined, // 订单状态
		orderInfo: undefined // 订单信息
	},
	onLoad () {
		wx.removeStorageSync('information_validation');
	},
	onShow () {
		// 登录页返回
		let loginInfoFinal = wx.getStorageSync('login_info_final');
		if (loginInfoFinal) {
			this.setData({
				loginInfo: JSON.parse(loginInfoFinal)
			});
			wx.removeStorageSync('login_info_final');
		}
		if (app.globalData.userInfo.accessToken) {
			this.getStatus();
		} else {
			this.login();
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
							// 查询最后一笔订单状态
							this.getStatus();
						} else {
							wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
							util.go('/pages/login/login/login');
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
	// 获取最后有一笔订单信息
	getStatus () {
		util.showLoading();
		let params = {
			openId: app.globalData.openId
		};
		util.getDataFromServer('consumer/order/my-etc-list', params, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				app.globalData.myEtcList = res.data;
				let selfStatus = 1;
				let orderInfo = '';
				res.data.map((item,index) => {
					if (item.status === 1 && item.contractStatus !== 1 && item.contractStatus !== 2) {
						// 待签约
						selfStatus = 1;
						orderInfo = item;
						return;
					}
					if (item.auditStatus === 2 && (item.obuStatus === 0 || item.obuStatus === 5)) {
						// 待激活
						selfStatus = 2;
						orderInfo = item;
						return;
					}
					if (index === 0) {
						// 其他类型订单
						selfStatus = 3;
						orderInfo = item;
					}
				});
				if (res.data.length === 0) {
					// 其他类型订单
					selfStatus = 3;
				}
				this.setData({
					selfStatus: selfStatus,
					orderInfo: orderInfo
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 去签约
	goSign () {
		util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${this.data.orderInfo.id}`);
	},
	// 去首页
	goHome () {
		wx.reLaunch({
			url: '/pages/Home/Home'
		});
	},
	// 去激活
	onClickCctivate () {
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
});
