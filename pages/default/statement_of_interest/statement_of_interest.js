/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		orderInfo: {},
		orderType: 0,
		isNeedSign: 0 // 是否需要签字
	},
	async onLoad (options) {
		this.setData({
			isNeedSign: +options.isNeedSign,
			orderType: +options.orderType
		});
		this.getETCDetail();
	},
	async handleConfirm () {
		if (this.data.isNeedSign === 1) {
			util.go(`/pages/default/sms_confirmation/sms_confirmation`);
		} else {
			const obj = this.data.orderInfo;
			if (this.data.orderType === 51) {
				if (obj.contractStatus === 2) {
					app.globalData.orderInfo.orderId = obj.id;
					// 恢复签约
					await this.restoreSign(obj);
				} else {
					app.globalData.signAContract = -1;
					await this.weChatSign(obj);
				}
				return;
			}
			util.go(`/pages/default/package_the_rights_and_interests/package_the_rights_and_interests`);
		}
	},
	// 加载订单详情
	async getETCDetail () {
		const result = await util.getDataFromServersV2('consumer/order/order-detail', {
			orderId: app.globalData.orderInfo.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			let orderInfo = result.data;
			orderInfo['selfStatus'] = util.getStatus(orderInfo);
			this.setData({
				orderInfo
			});
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
	onUnload () {
	}
});
