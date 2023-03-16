import {path2json} from '../../../utils/utils';

/**
 * @author 老刘
 * @desc 第三方签约页
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		viewTc: {},	// 用于存放弹窗数据
		whetherToStay: false,	// 用于控制显示弹窗时，最底层页面禁止不动
		isFade: true,	// 控制"浮动按钮"的显示隐藏
		lastScrollTop: 0,	// 控制"浮动按钮"在向上滚动和禁止时不隐藏，向下滚动时隐藏
		show: true,
		duration: 0,
		status: 0,// 0-加载中  1-无需确认签字 2-需要签字
		position: 'center',
		customStyle: 'overflow:auto !important;z-index:-10 !important;',
		overlayStyle: 'overflow:auto !important;z-index:-10',
		orderId: '',
		orderInfo: {}
	},
	async onLoad () {
		util.customTabbar(this, 1);
	},
	async onShow () {
		let result = wx.getLaunchOptionsSync();
		const obj = path2json(decodeURIComponent(result?.query?.scene));
		// 查询是否欠款
		this.setData({
			orderId: obj?.orderId,
			show: true,
			duration: 0,
			position: 'center',
			customStyle: 'overflow:auto !important;z-index:-10 !important;',
			overlayStyle: 'overflow:auto !important;z-index:-10'
		});
		app.globalData.orderInfo.orderId = obj?.orderId;
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
	async getETCDetail () {
		const result = await util.getDataFromServersV2('consumer/order/order-detail', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				orderInfo: result.data
			});
			if (result.data.isShowRightsDesc === 1 && !result.data.userSign) {
				wx.reLaunch({
					url: `/pages/default/statement_of_interest/statement_of_interest?isNeedSign=${result.data.isNeedSign}&orderType=${result.data.orderType}`
				});
			} else {
				this.setData({
					status: 1
				});
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 监听页面滚动
	onPageScroll (e) {
		if (e.scrollTop > this.data.lastScrollTop) {
			this.setData({
				isFade: false
			});
		}
		// 页面停止滚动或页面向上滚动时 显示 "立即办理"按钮
		let that = this;
		return (function () {
			if (that.data.timeout) {
				clearTimeout(that.data.timeout);
			}
			that.data.timeout = setTimeout(() => {
				that.setData({
					isFade: true,
					lastScrollTop: e.scrollTop
				});
			}, 500);
		})();
	},
	async onClickHandle () {
		const obj = this.data.orderInfo;
		if (obj.contractStatus === 2) {
			app.globalData.orderInfo.orderId = obj.id;
			// 恢复签约
			await this.restoreSign(obj);
		} else {
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
	async weChatSign (obj) {
		util.showLoading('加载中');
		let params = {
			orderId: app.globalData.orderInfo.orderId,// 订单id
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			needSignContract: true // 是否需要签约 true-是，false-否
		};
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
			app.globalData.isSignUpImmediately = true;// 返回时需要查询主库
			app.globalData.belongToPlatform = obj.platformId;
			app.globalData.orderInfo.orderId = obj.id;
			app.globalData.contractStatus = obj.contractStatus;
			app.globalData.orderStatus = obj.selfStatus;
			app.globalData.orderInfo.shopProductId = obj.shopProductId;
			app.globalData.signAContract === -1;
			util.weChatSigning(res);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	onBeforeLeave () {
	}
});
