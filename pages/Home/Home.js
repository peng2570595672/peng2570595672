/**
 * @author 狂奔的蜗牛
 * @desc 首页
 */
const util = require('../../utils/util.js');
// 数据统计
let mta = require('../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		canIUse: wx.canIUse('button.open-type.getUserInfo'),
		loginInfo: {},// 登录信息
		orderInfo: undefined, // 订单信息
		isContinentInsurance: false, // 是否是大地保险
		rotationChartList: [], // 轮播图
		recentlyTheBill: undefined // 最新账单
	},
	onLoad () {
		wx.removeStorageSync('information_validation');
		this.login();
		// 获取轮播图
		this.getRotationChartList();
	},
	onShow () {
		if (app.globalData.userInfo.accessToken) {
			if (app.globalData.salesmanScanCodeToHandleId) {
				this.bindOrder();
			} else {
				this.getStatus();
			}
		}
		// 登录页返回
		let loginInfoFinal = wx.getStorageSync('login_info_final');
		if (loginInfoFinal) {
			this.setData({
				loginInfo: JSON.parse(loginInfoFinal)
			});
			if (app.globalData.salesmanScanCodeToHandleId) {
				this.bindOrder();
			} else {
				this.getStatus();
			}
			wx.removeStorageSync('login_info_final');
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
							if (app.globalData.salesmanScanCodeToHandleId) {
								this.bindOrder();
							} else {
								if (app.globalData.isSignUpImmediately) {
									app.globalData.isSignUpImmediately = false;
									this.getStatus(true);
								} else {
									this.getStatus();
								}
							}
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
	// 业务员端订单码绑定订单
	bindOrder () {
		util.getDataFromServer('consumer/member/bind-order', {
			orderId: app.globalData.salesmanScanCodeToHandleId
		}, () => {
			util.hideLoading();
		}, (res) => {
			if (res.code === 0) {
				app.globalData.salesmanScanCodeToHandleId = undefined;// 处理返回首页再次请求
				this.getStatus(true);
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 获取轮播图
	getRotationChartList () {
		util.showLoading();
		util.getDataFromServer('consumer/system/common/get-activity-banner', {
			platformId: app.globalData.platformId
		}, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				if (res.data) {
					let list = res.data;
					this.setData({
						isContinentInsurance: app.globalData.isContinentInsurance
					});
					if (this.data.isContinentInsurance) {
						list = list.filter(item => item.remark !== 'micro_insurance'); // 大地保险屏蔽微保
					} else {
						list = list.filter(item => item.remark !== 'continent_insurance'); // 普通流程屏蔽大地保险
					}
					this.setData({
						rotationChartList: list
					});
				}
			} else {
				util.showToastNoIcon(res.message);
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
					res.data['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
					app.globalData.userInfo = res.data; // 用户登录信息
					app.globalData.openId = res.data.openId;
					app.globalData.memberId = res.data.memberId;
					app.globalData.mobilePhone = res.data.mobilePhone;
					let loginInfo = this.data.loginInfo;
					loginInfo['showMobilePhone'] = util.mobilePhoneReplace(res.data.mobilePhone);
					loginInfo.needBindingPhone = 0;
					this.setData({
						loginInfo
					});
					if (app.globalData.salesmanScanCodeToHandleId) {
						this.bindOrder();
					} else {
						this.getStatus();
					}
				} else {
					util.hideLoading();
					util.showToastNoIcon(res.message);
				}
			});
		}
	},
	onShareAppMessage () {
		return {
			path: '/pages/Home/Home'
		};
	},
	// 获取最后有一笔订单信息
	getStatus (isToMasterQuery) {
		util.showLoading();
		let params = {
			openId: app.globalData.openId
		};
		if (isToMasterQuery) {
			params['toMasterQuery'] = true;// 直接查询主库
		}
		util.getDataFromServer('consumer/order/my-etc-list', params, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				app.globalData.myEtcList = res.data;
				// 京东客服
				let vehicleList = [];
				let orderInfo = '';
				res.data.map((item,index) => {
					if (item.remark && item.remark.indexOf('迁移订单数据') !== -1) {
						item['selfStatus'] = util.getStatusFirstVersion(item);
					} else {
						item['selfStatus'] = util.getStatus(item);
					}
					vehicleList.push(item.vehPlates);
					wx.setStorageSync('cars', vehicleList.join('、'));
					if (item.contractStatus === 2) {
						// 解约优先展示
						orderInfo = item;
						return;
					}
					if (item.selfStatus === 2) {
						// 待签约优先展示
						orderInfo = item;
						return;
					}
					if (index === 0) {
						orderInfo = item;
					}
					if (item.selfStatus === 9) {
						// 查询最近一次账单
						this.getRecentlyTheBill(item);
					}
				});
				this.setData({
					orderInfo: orderInfo
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	goOrderDetails () {
		mta.Event.stat('013',{});
		let model = this.data.recentlyTheBill;
		util.go(`/pages/personal_center/order_details/order_details?id=${model.id}&channel=${model.channel}&month=${model.month}`);
	},
	getRecentlyTheBill (item) {
		util.showLoading();
		util.getDataFromServer('consumer/etc/get-last-bill', {
			channel: item.obuCardType
		}, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				if (res.data) {
					this.setData({
						recentlyTheBill: res.data
					});
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 免费办理
	freeProcessing () {
		// 统计点击事件
		app.globalData.orderInfo.orderId = '';
		mta.Event.stat('001',{});
		if (app.globalData.userInfo.accessToken) {
			util.go('/pages/default/receiving_address/receiving_address');
		}
	},
	// 底部跳转跳转
	go (e) {
		let url = e.currentTarget.dataset.url;
		if (url === 'online_customer_service' || url === 'violation_enquiry') {
			if (url === 'violation_enquiry') {
				// 统计点击进入违章查询
				mta.Event.stat('007',{});
			} else if (url === 'online_customer_service') {
				// 未登录
				if (!app.globalData.userInfo.accessToken) {
					wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
					util.go('/pages/login/login/login');
					return;
				}
				// 统计点击进入在线客服
				mta.Event.stat('009',{});
			}
			util.go(`/pages/web/web/web?type=${url}`);
		} else {
			// 未登录
			if (!app.globalData.userInfo.accessToken) {
				wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
				util.go('/pages/login/login/login');
				return;
			}
			if (url === 'index') {
				// 统计点击进入个人中心事件
				mta.Event.stat('010',{});
			} else if (url === 'my_order') {
				// 统计点击进入我的ETC账单
				mta.Event.stat('012',{});
			}
			// 订阅:高速扣费通知、ETC欠费提醒、黑名单状态提醒
			let urls = `/pages/personal_center/${url}/${url}`;
			let tmplIds = ['oz7msNJRXzk7VmASJsJtb2JG0rKEWjX3Ff1PIaAPa78','lY047e1wk-OFdeGuIx2ThV-MOJ4aUOx2HhSxUd1YXi0', 'my5wGmuottanrIAKrEhe2LERPKx4U05oU4aK9Fyucv0'];
			util.subscribe(tmplIds,urls);
			// util.go(`/pages/personal_center/${url}/${url}`);
		}
	},
	// 恢复签约
	onClickBackToSign (e) {
		let obj = this.data.orderInfo;
		app.globalData.contractStatus = obj.contractStatus;
		if (obj.contractStatus === 2) {
			app.globalData.orderInfo.orderId = obj.id;
			// 恢复签约
			this.restoreSign(obj);
		} else {
			// 2.0 立即签约
			app.globalData.signAContract = -1;
			this.weChatSign(obj);
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
					if (res.data.contractId) {
						// 3.0
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
	// 点击轮播图
	onClickSwiper (e) {
		let item = e.currentTarget.dataset['item'];
		if (item.pageUrl === 'continent_insurance') {
			return;
		}
		if (item.pageType === 1) {
			// 页面类型：1-H5，2-小程序
			if (item.remark === 'micro_insurance') {
				mta.Event.stat('banner_activity_weibao',{});
			}
			util.go(`/pages/web/web/web?url=${encodeURIComponent(item.pageUrl)}&type=banner`);
		} else {
			mta.Event.stat('banner_activity_free_processing',{});
			util.go(item.pageUrl);
		}
	},
	// 查看办理进度
	onClickViewProcessingProgressHandle () {
		// 统计点击事件
		mta.Event.stat('003',{});
		app.globalData.orderInfo.orderId = this.data.orderInfo.id;
		util.go(`/pages/default/processing_progress/processing_progress?orderId=${this.data.orderInfo.id}`);
	},
	// 去激活
	onClickCctivate () {
		if (this.data.orderInfo.orderType === 11) {
			if (this.data.orderInfo.logisticsId === 0) {
				this.onClickViewProcessingProgressHandle();
			} else {
				mta.Event.stat('005',{});
				this.confirmReceipt();
			}
		} else {
			mta.Event.stat('005',{});
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
	},
	// 确认收货
	confirmReceipt () {
		util.showLoading();
		util.getDataFromServer('consumer/order/affirm-take-obu', {
			logisticsId: this.data.orderInfo.logisticsId
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
	// 我的ETC
	onClickMyETCHandle () {
		// 未登录
		if (!app.globalData.userInfo.accessToken) {
			wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
			util.go('/pages/login/login/login');
			return;
		}
		// 订阅:高速扣费通知、ETC欠费提醒、黑名单状态提醒
		let urls = '/pages/personal_center/my_etc/my_etc';
		let tmplIds = ['oz7msNJRXzk7VmASJsJtb2JG0rKEWjX3Ff1PIaAPa78','lY047e1wk-OFdeGuIx2ThV-MOJ4aUOx2HhSxUd1YXi0', 'my5wGmuottanrIAKrEhe2LERPKx4U05oU4aK9Fyucv0'];
		util.subscribe(tmplIds,urls);
		// util.go('/pages/personal_center/my_etc/my_etc');
	},
	// 修改资料
	onClickModifiedData () {
		mta.Event.stat('004',{});
		if (util.getHandlingType(this.data.orderInfo)) {
			util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
			return;
		}
		app.globalData.orderInfo.orderId = this.data.orderInfo.id;
		app.globalData.orderInfo.shopProductId = this.data.orderInfo.shopProductId;
		app.globalData.isModifiedData = true; // 修改资料
		if (this.data.orderInfo.remark && this.data.orderInfo.remark.indexOf('迁移订单数据') !== -1) {
			// 1.0数据
			app.globalData.firstVersionData = true;
			wx.removeStorageSync('driving_license_face');
			wx.removeStorageSync('driving_license_back');
			wx.removeStorageSync('car_head_45');
		} else {
			app.globalData.firstVersionData = false;
		}
		util.go('/pages/default/information_validation/information_validation');
	},
	// 继续办理
	onClickContinueHandle () {
		// 统计点击事件
		mta.Event.stat('002',{});
		if (util.getHandlingType(this.data.orderInfo)) {
			util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
			return;
		}
		app.globalData.orderInfo.orderId = this.data.orderInfo.id;
		app.globalData.isModifiedData = false; // 非修改资料
		if (this.data.orderInfo.remark && this.data.orderInfo.remark.indexOf('迁移订单数据') !== -1) {
			// 1.0数据
			app.globalData.firstVersionData = true;
			util.go('/pages/default/payment_way/payment_way');
		} else {
			app.globalData.firstVersionData = false;
			// 服务商套餐id，0表示还未选择套餐，其他表示已经选择套餐
			// 只提交了车牌 车牌颜色 收货地址 或者未签约 前往套餐选择
			// "etcContractId": "", //签约id，0表示未签约，其他表示已签约
			if (this.data.orderInfo.shopProductId === 0 || this.data.orderInfo.etcContractId === 0) {
				util.go('/pages/default/payment_way/payment_way');
			} else if (this.data.orderInfo.isVehicle === 0) {
				// 是否上传行驶证， 0未上传，1已上传
				app.globalData.orderInfo.shopProductId = this.data.orderInfo.shopProductId;
				if (wx.getStorageSync('corresponding_package_id') !== app.globalData.orderInfo.orderId) {
					// 行驶证缓存关联订单
					wx.setStorageSync('corresponding_package_id', app.globalData.orderInfo.orderId);
					wx.removeStorageSync('driving_license_face');
					wx.removeStorageSync('driving_license_back');
					wx.removeStorageSync('car_head_45');
				}
				if (wx.getStorageSync('driving_license_face')) {
					util.go('/pages/default/information_validation/information_validation');
				} else {
					util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license');
				}
			} else if (this.data.orderInfo.isVehicle === 1 && this.data.orderInfo.isOwner === 1) {
				// 已上传行驶证， 未上传车主身份证
				util.go('/pages/default/update_id_card/update_id_card?type=normal_process');
			}
		}
	}
});
