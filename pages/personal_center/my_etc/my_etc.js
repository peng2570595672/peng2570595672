/**
 * @author 狂奔的蜗牛
 * @desc 我的ETC
 */
const util = require('../../../utils/util.js');
const app = getApp();
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
Page({
	data: {
		carList: undefined
	},
	onShow () {
		if (app.globalData.userInfo.accessToken) {
			this.getMyETCList();
		} else {
			// 公众号进入需要登录
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
							this.getMyETCList();
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
	// 加载ETC列表
	getMyETCList () {
		util.showLoading();
		let params = {
			openId: app.globalData.openId
		};
		if (app.globalData.isSignUpImmediately) {
			app.globalData.isSignUpImmediately = false;
			params['toMasterQuery'] = true;// 直接查询主库
		}
		util.getDataFromServer('consumer/order/my-etc-list', params, () => {
			util.showToastNoIcon('获取车辆列表失败！');
		}, (res) => {
			if (res.code === 0) {
				app.globalData.myEtcList = res.data;
				let vehicleList = [];
				res.data.map((item) => {
					vehicleList.push(item.vehPlates);
					if (item.remark && item.remark.indexOf('迁移订单数据') !== -1) {
						item['selfStatus'] = util.getStatusFirstVersion(item);
					} else {
						item['selfStatus'] = util.getStatus(item);
					}
					wx.setStorageSync('cars', vehicleList.join('、'));
				});
				this.setData({
					carList: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 去激活
	onClickCctivate (e) {
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		if (obj.shopId && obj.shopId === '624263265781809152') {
			// 津易行
			this.selectComponent('#notJinYiXingPrompt').show();
		} else {
			this.confirmReceipt(obj);
		}
	},
	// 确认收货
	confirmReceipt (obj) {
		util.showLoading();
		util.getDataFromServer('consumer/order/affirm-take-obu', {
			logisticsId: obj.logisticsId
		}, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
				wx.navigateToMiniProgram({
					appId: 'wxdda17150b8e50bc4',
					path: 'pages/index/index',
					envVersion: 'release', // 目前联调为体验版
					fail () {
						util.showToastNoIcon('调起激活小程序失败, 请重试！');
					}
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	//	查看详情
	onClickGoETCDetailHandle (e) {
		// 统计点击事件
		mta.Event.stat('016',{});
		let index = e.currentTarget.dataset.index;
		util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${this.data.carList[parseInt(index)].id}`);
	},
	// 查看进度
	onClickViewProcessingProgressHandle (e) {
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		app.globalData.orderInfo.orderId = obj.id;
		util.go(`/pages/default/processing_progress/processing_progress?orderId=${obj.id}`);
	},
	// 继续办理
	onClickContinueHandle (e) {
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		if (util.getHandlingType(obj)) {
			util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
			return;
		}
		app.globalData.orderInfo.orderId = obj.id;
		app.globalData.isModifiedData = false; // 非修改资料
		if (obj.remark && obj.remark.indexOf('迁移订单数据') !== -1) {
			// 1.0数据
			app.globalData.firstVersionData = true;
			util.go('/pages/default/payment_way/payment_way');
		} else {
			app.globalData.firstVersionData = false;
			// 服务商套餐id，0表示还未选择套餐，其他表示已经选择套餐
			// 只提交了车牌 车牌颜色 收货地址 或者未签约 前往套餐选择
			// "etcContractId": "", //签约id，0表示未签约，其他表示已签约
			if (obj.shopProductId === 0 || obj.etcContractId === 0) {
				util.go('/pages/default/payment_way/payment_way');
			} else if (obj.isVehicle === 0) {
				// 是否上传行驶证， 0未上传，1已上传
				app.globalData.orderInfo.shopProductId = obj.shopProductId;
				if (wx.getStorageSync('corresponding_package_id') !== app.globalData.orderInfo.orderId) {
					// 行驶证缓存关联订单
					wx.setStorageSync('corresponding_package_id', app.globalData.orderInfo.orderId);
					wx.removeStorageSync('driving_license_face');
					wx.removeStorageSync('driving_license_back');
					wx.removeStorageSync('car_head_45');
				}
				// if (obj.pledgeStatus === 0) {
				// 	// pledgeStatus 状态，-1 无需支付 0-待支付，1-已支付，2-退款中，3-退款成功，4-退款失败
				// 	// 待支付保证金
				// 	util.go(`/pages/default/margin_payment/margin_payment?marginPaymentMoney=${obj.pledgeMoney}`);
				// } else {
				// 	if (wx.getStorageSync('driving_license_face')) {
				// 		util.go('/pages/default/information_validation/information_validation');
				// 	} else {
				// 		util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license');
				// 	}
				// }
				if (wx.getStorageSync('driving_license_face')) {
					util.go('/pages/default/information_validation/information_validation');
				} else {
					util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license');
				}
			} else if (obj.isVehicle === 1 && obj.isOwner === 1) {
				// 已上传行驶证， 未上传车主身份证
				util.go('/pages/default/update_id_card/update_id_card?type=normal_process');
			}
		}
	},
	// 新增
	onClickAddNewHandle () {
		// 统计点击事件
		mta.Event.stat('015',{});
		app.globalData.orderInfo.orderId = '';
		util.go('/pages/default/receiving_address/receiving_address');
	},
	// 恢复签约
	onClickBackToSign (e) {
		app.globalData.isSecondSigning = false;
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		// 新流程
		if (obj.selfStatus === 10) {
			this.selectComponent('#notSigningPrompt').show();
		} else {
			if (obj.contractStatus === 2) {
				app.globalData.orderInfo.orderId = obj.id;
				// 恢复签约
				this.restoreSign(obj);
			} else {
				// 2.0 立即签约
				if (obj.status === 1) {
					app.globalData.isSecondSigning = true;
				}
				if (obj.orderType === 31) {
					app.globalData.isSalesmanOrder = true;
				} else {
					app.globalData.isSalesmanOrder = false;
				}
				app.globalData.signAContract = -1;
				this.weChatSign(obj);
			}
		}
	},
	// 恢复签约
	restoreSign (obj) {
		util.getDataFromServer('consumer/order/query-contract', {
			orderId: obj.id
		}, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				app.globalData.signAContract = 1;
				// 签约成功 userState: "NORMAL"
				if (res.data.contractStatus !== 1) {
					if (res.data.version === 'v3') {
						if (res.data.contractId) {
							wx.navigateToMiniProgram({
								appId: 'wxbcad394b3d99dac9',
								path: 'pages/etc/index',
								extraData: {
									contract_id: res.data.contractId
								},
								success () {
								},
								fail (e) {
									// 未成功跳转到签约小程序
									util.showToastNoIcon('调起微信签约小程序失败, 请重试！');
								}
							});
						} else {
							this.weChatSign(obj);
						}
					} else {
						this.weChatSign(obj);
					}
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 微信签约
	weChatSign (obj) {
		util.showLoading('加载中');
		let params = {
			orderId: obj.id,// 订单id
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		if (obj.remark && obj.remark.indexOf('迁移订单数据') !== -1) {
			// 1.0数据 立即签约 需标记资料已完善
			params['upgradeToTwo'] = true; // 1.0数据转2.0
			params['dataComplete'] = 1; // 资料已完善
		}
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
			util.hideLoading();
		}, (res) => {
			if (res.code === 0) {
				util.hideLoading();
				let result = res.data.contract;
				// 签约车主服务 2.0
				app.globalData.isSignUpImmediately = true;// 返回时需要查询主库
				app.globalData.belongToPlatform = obj.platformId;
				app.globalData.orderInfo.orderId = obj.id;
				app.globalData.contractStatus = obj.contractStatus;
				app.globalData.orderStatus = obj.selfStatus;
				app.globalData.orderInfo.shopProductId = obj.shopProductId;
				if (result.version === 'v2') {
					wx.navigateToMiniProgram({
						appId: 'wxbcad394b3d99dac9',
						path: 'pages/route/index',
						extraData: result.extraData,
						fail () {
							util.showToastNoIcon('调起车主服务签约失败, 请重试！');
						}
					});
				} else { // 签约车主服务 3.0
					wx.navigateToMiniProgram({
						appId: 'wxbcad394b3d99dac9',
						path: 'pages/etc/index',
						extraData: {
							preopen_id: result.extraData.peropen_id
						},
						fail () {
							util.showToastNoIcon('调起车主服务签约失败, 请重试！');
						}
					});
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			this.setData({
				available: true,
				isRequest: false
			});
		});
	},
	// 修改资料
	onClickModifiedData (e) {
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		if (obj.auditStatus === 9) {
			// 审核失败--不可办理
			util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${obj.id}`);
		} else {
			if (util.getHandlingType(obj)) {
				util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
				return;
			}
			app.globalData.orderInfo.orderId = obj.id;
			app.globalData.orderInfo.shopProductId = obj.shopProductId;
			app.globalData.isModifiedData = true; // 修改资料
			if (obj.remark && obj.remark.indexOf('迁移订单数据') !== -1) {
				// 1.0数据
				wx.removeStorageSync('driving_license_face');
				wx.removeStorageSync('driving_license_back');
				wx.removeStorageSync('car_head_45');
				app.globalData.firstVersionData = true;
			} else {
				app.globalData.firstVersionData = false;
			}
			util.go('/pages/default/information_validation/information_validation');
		}
	}
});
