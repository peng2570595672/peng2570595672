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
					await this.citicBankProcess();
					if (this.data.orderInfo.obuCardType === 1) {
						await this.brandChargingModel();
					}
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
		// 车辆品牌收费车型校验
		async brandChargingModel () {
			console.log('车辆品牌收费车型校验');
			await util.getDataFromServersV2('consumer/etc/qtzl/checkCarChargeType', {
				orderId: app.globalData.orderInfo.orderId
			});
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
		},
		// 签约成功后的操作
		async citicBankProcess () {
			// // 跳转首页;
			// wx.switchTab({
			// 	url: '/pages/Home/Home'
			// });

			let flag = false;
			let flag1 = false;
			// 查看优惠券加购记录
			const result1 = await util.getDataFromServersV2('consumer/voucher/rights/add-buy-record', {
				platformId: app.globalData.platformId
			});
			if (result1.code === 0) {
				flag1 = result1.data.includes(item => item.packageId === app.globalData.cictBankObj.citicBankRightId);
			} else {
				util.showToastNoIcon(result1.message);
			}

			// 中信银行信用卡申请进度
			const result = await util.getDataFromServersV2('consumer/order/zx/transact-schedule', {
				orderId: app.globalData.orderInfo.orderId
			});
			if (!result) return;
			if (result.code === 0) {
				console.log('中信银行信用卡申请进度',result);
				flag = result.data.includes(item => item.applyStatus === '50' && item.newCustFlag === '1');
			} else {
				util.showToastNoIcon(result.message);
			}

			if (flag && !flag1 && !this.data.orderInfo.contractStatus) {	// 申请中信信用卡面签成功且是新用户，并且是第一次签约，并且在加购记录里是没有中信权益包加购的
			// if (!flag) {	// 申请中信信用卡面签成功且是新用户，并且是第一次签约，并且在加购记录里是没有中信权益包加购的
				util.alert({
					title: `新客优惠提醒`,
					content: `即日起，完成中信信用卡激活的用户，使用新卡支付，即可享受0.01元购买20元通行券限时优惠`,
					showCancel: true,
					confirmColor: '#576b95',
					cancelText: '暂不考虑',
					confirmText: '立即领取',
					confirm: async () => {
						util.go(`/pages/separate_interest_package/prefer_purchase/prefer_purchase?packageId=${app.globalData.cictBankObj.citicBankRightId}&cictBank=true`);
						const counpon = await util.getDataFromServersV2('consumer/voucher/rights/recharge/zx/sendWxCoupon', {
							orderId: app.globalData.orderInfo.orderId,
							openId: app.globalData.openId
						});
						if (!counpon) return;
						// console.log(counpon);
						if (counpon.code !== 0) {
							util.showToastNoIcon(counpon.message);
						}
					},
					cancel: () => {
						// 跳转首页;
						wx.switchTab({
							url: '/pages/Home/Home'
						});
					}
				});
			} else {
				// 跳转首页;
				wx.switchTab({
					url: '/pages/Home/Home'
				});
			}
		}
});
