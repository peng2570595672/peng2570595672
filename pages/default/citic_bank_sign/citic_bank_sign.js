const util = require('../../../utils/util.js');
const app = getApp();
Page({
		data: {
			orderInfo: {}
		},
		async onLoad (options) {
			app.globalData.signAContract = 3;
			await this.getETCDetail();
		},
		/**
		* 生命周期函数--监听页面显示
		*/
		onShow () {
			if (app.globalData.signAContract === -1) {
				this.queryContract();
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
				this.setData({
					orderInfo
				});
			} else {
				util.showToastNoIcon(result.message);
			}
		},
		// 查询车主服务签约
		async queryContract () {
			const result = await util.getDataFromServersV2('consumer/order/query-contract', {
				orderId: app.globalData.orderInfo.orderId
			});
			if (!result) return;
			if (result.code === 0) {
				app.globalData.signAContract = 3;
				if (result.data.contractStatus === 1) {
					// 签约成功
					console.log('签约成功');
				}
				this.setData({
					contractStatus: result.data.contractStatus
				});
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
						// 3.0
						if (result.data.contractId) {
							wx.navigateToMiniProgram({
								appId: 'wxbcad394b3d99dac9',
								path: 'pages/etc/index',
								extraData: {
									contract_id: result.data.contractId
								},
								success () {},
								fail () {
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
			app.globalData.orderInfo.orderId = obj.id;
			let params = {
				orderId: obj.id, // 订单id
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
				let res = result.data.contract;
				// 签约车主服务 2.0
				app.globalData.isSignUpImmediately = true; // 返回时需要查询主库
				app.globalData.belongToPlatform = obj.platformId;
				app.globalData.orderInfo.orderId = obj.id;
				app.globalData.orderStatus = obj.selfStatus;
				app.globalData.orderInfo.shopProductId = obj.shopProductId;
				app.globalData.signAContract === -1;
				util.weChatSigning(res);
			} else {
				util.showToastNoIcon(result.message);
			}
		},
		async handleSign () {
			const obj = this.data.orderInfo;
			if (obj.contractStatus === 2) {
				await this.restoreSign(obj);
			} else {
				// 2.0 立即签约
				app.globalData.signAContract = -1;
				await this.weChatSign(obj);
			}
		}
});
