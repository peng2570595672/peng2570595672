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
		exceptionMessage: undefined, // 异常信息
		num: 0, // 次数
		isContinentInsurance: false, // 是否是大地保险
		heaicheProvinceList: ['辽宁', '湖南', '江苏', '甘肃', '广西', '内蒙古', '陕西', '山西', '四川', '云南', '安徽', '宁夏', '青海', '河南', '上海', '浙江', '黑龙江', '山东', '福建', '河北'], // 和爱车活动加载省份
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
						this.setData({
							exceptionMessage: res.message
						});
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
						list = list.filter(item => item.remark !== 'micro_insurance' && item.remark !== 'heaiche');// 大地保险屏蔽微保&和爱车
					} else {
						list = list.filter(item => item.remark !== 'continent_insurance'); // 普通流程屏蔽大地保险
					}
					this.setData({
						rotationChartList: list
					});
					// 屏蔽和爱车,不需要再次定位
					// if (!this.data.isContinentInsurance) {
					// 	this.init(list);
					// }
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		});
	},
	// 定位
	getLocationInfo (bannerList) {
		util.showLoading();
		let that = this;
		wx.getLocation({
			type: 'wgs84',
			success: (res) => {
				util.getAddressInfo(res.latitude, res.longitude, (res) => {
					let info = res.result.ad_info;
					console.log(res);
					that.isShowHACBanner(bannerList, res.result.address);
					wx.setStorageSync('location-info',JSON.stringify(res));
					// 根据地区显示和爱车banner
				}, () => {
					// 不显示和爱车banner
				});
			},
			fail: (res) => {
				util.hideLoading();
				console.log(res);
				if (res.errMsg === 'getLocation:fail auth deny' || res.errMsg === 'getLocation:fail authorize no response') {
					util.alert({
						content: '由于您拒绝了定位授权，导致无法获取扣款方式，请允许定位授权！',
						showCancel: true,
						confirmText: '允许授权',
						confirm: () => {
							wx.openSetting();
						}
					});
				} else if (res.errMsg === 'getLocation:fail:ERROR_NOCELL&WIFI_LOCATIONSWITCHOFF' || res.errMsg === 'getLocation:fail system permission denied') {
					util.showToastNoIcon('请开启手机或微信定位功能！');
				}
			}
		});
	},
	// 获取定位数据
	init (bannerList) {
		// 是否缓存了定位信息
		let locationInfo = wx.getStorageSync('location-info');
		if (locationInfo) {
			let res = JSON.parse(locationInfo);
			this.isShowHACBanner(bannerList, res.result.address);
			// 根据地区显示和爱车banner
			return;
		}
		// 定位
		this.getLocationInfo(bannerList);
	},
	// 是否显示和爱车banner
	isShowHACBanner (bannerList, address) {
		let isShowProvince = false;
		this.data.heaicheProvinceList.forEach(item => {
			if (address.includes(item)) {
				isShowProvince = true;
			}
		});
		if (!isShowProvince) {
			bannerList = bannerList.filter(item => item.remark !== 'heaiche');// 大地保险屏蔽微保&和爱车
			this.setData({
				rotationChartList: bannerList
			});
		}
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
	// 获取和爱车活动加密手机号
	encryptionMobilePhone (pageUrl) {
		if (this.data.exceptionMessage) {
			util.showToastNoIcon(this.data.exceptionMessage);
			return;
		}
		if (!app.globalData.mobilePhone) {
			util.go('/pages/login/login/login');
			return;
		}
		util.showLoading();
		util.getDataFromServer('consumer/system/common/HACAESEncode', {
			mobilePhone: app.globalData.mobilePhone,
			aesKey: 'hHMogstx1gcJQLcu'
		}, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				// let url = `${pageUrl}&mobile=${encodeURIComponent(res.data.data)}`;
				app.globalData.activityUrl = encodeURIComponent(res.data.data);
				util.go(`/pages/web/web/web?type=heaiche`);
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
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
				app.globalData.ownerServiceArrearsList = res.data.filter(item => item.paySkipParams !== undefined); // 筛选车主服务欠费
				res.data.map((item,index) => {
					if (item.remark && item.remark.indexOf('迁移订单数据') !== -1) {
						item['selfStatus'] = util.getStatusFirstVersion(item);
					} else {
						item['selfStatus'] = util.getStatus(item);
					}
					vehicleList.push(item.vehPlates);
					wx.setStorageSync('cars', vehicleList.join('、'));
					// if (item.selfStatus === 6 && this.data.num === 0) {
					// 	this.setData({
					// 		num: 1
					// 	});
					// 	util.alert({
					// 		content: '因近期部分省份及城市发生特大洪涝灾害，到货时间可能延后数日。',
					// 		showCancel: false,
					// 		confirmText: '我知道了',
					// 		confirm: () => {
					// 		},
					// 		cancel: () => {
					// 		}
					// 	});
					// }
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
	// 签约高速弹窗
	signingExpress () {
		this.selectComponent('#notSigningPrompt').show();
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
	// 去设备详情 审核失败:不可办理
	goEtcDetails () {
		util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${this.data.orderInfo.id}`);
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
				// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
				wx.navigateToMiniProgram({
					appId: 'wx06a561655ab8f5b2',
					path: 'pages/base/redirect/index?routeKey=PC01_REDIRECT&autoRoute=CHECKILLEGAL&outsource=souyisou&wtagid=116.115.10',
					envVersion: 'release', // 目前联调为体验版
					fail () {
						util.showToastNoIcon('调起小程序失败, 请重试！');
					}
				});
			} else if (url === 'online_customer_service') {
				if (this.data.exceptionMessage) {
					util.showToastNoIcon(this.data.exceptionMessage);
					return;
				}
				// 未登录
				if (!app.globalData.userInfo.accessToken) {
					wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
					util.go('/pages/login/login/login');
					return;
				}
				// 统计点击进入在线客服
				mta.Event.stat('009',{});
				util.go(`/pages/web/web/web?type=${url}`);
			}
		} else {
			if (this.data.exceptionMessage) {
				util.showToastNoIcon(this.data.exceptionMessage);
				return;
			}
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
			let urls = `/pages/personal_center/${url}/${url}?isMain=true`;
			let tmplIds = ['oz7msNJRXzk7VmASJsJtb2JG0rKEWjX3Ff1PIaAPa78','lY047e1wk-OFdeGuIx2ThV-MOJ4aUOx2HhSxUd1YXi0', 'my5wGmuottanrIAKrEhe2LERPKx4U05oU4aK9Fyucv0'];
			util.subscribe(tmplIds,urls);
			// util.go(`/pages/personal_center/${url}/${url}`);
		}
	},
	// 恢复签约
	onClickBackToSign (e) {
		app.globalData.isSecondSigning = false;
		app.globalData.isSecondSigningInformationPerfect = false;
		let obj = this.data.orderInfo;
		app.globalData.contractStatus = obj.contractStatus;
		if (obj.status === 1) {
			app.globalData.isSecondSigningInformationPerfect = true;
		}
		if (obj.logisticsId !== 0 || obj.obuStatus === 5 || obj.obuStatus === 1) {
			app.globalData.isSecondSigning = true;
		}
		if (obj.contractStatus === 2) {
			app.globalData.orderInfo.orderId = obj.id;
			// 恢复签约
			this.restoreSign(obj);
		} else {
			// 2.0 立即签约
			app.globalData.signAContract = -1;
			if (obj.orderType === 31) {
				app.globalData.isSalesmanOrder = true;
			} else {
				app.globalData.isSalesmanOrder = false;
			}
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
					if (res.data.version === 'v3') {
						// 3.0
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
	goMakeInvoice () {
		mta.Event.stat('index_counterfoi',{});
		wx.navigateToMiniProgram({
			appId: 'wx9040bb0d3f910004',
			path: 'pages/index/index',
			envVersion: 'release', // 目前联调为体验版
			fail () {
				util.showToastNoIcon('调起票根小程序失败, 请重试！');
			}
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
				let memberId = app.globalData.memberId || '';
				item.pageUrl = `${item.pageUrl}&outerUserId=${memberId}`;
				mta.Event.stat('banner_activity_weibao',{});
			}
			if (item.remark === 'heaiche') {
				this.encryptionMobilePhone(item.pageUrl);
				return;
			}
			util.go(`/pages/web/web/web?url=${encodeURIComponent(item.pageUrl)}&type=banner`);
		} else {
			if (item.remark === 'micro_insurance') {
				mta.Event.stat('banner_activity_weibao_insurance',{});
				wx.navigateToMiniProgram({
					appId: 'wx06a561655ab8f5b2',
					path: item.pageUrl,
					envVersion: 'release', // 目前联调为体验版
					fail () {
						util.showToastNoIcon('调起微保小程序失败, 请重试！');
					}
				});
			} else {
				app.globalData.orderInfo.orderId = '';
				mta.Event.stat('banner_activity_free_processing',{});
				util.go(item.pageUrl);
			}
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
		if (this.data.exceptionMessage) {
			util.showToastNoIcon(this.data.exceptionMessage);
			return;
		}
		// 未登录
		if (!app.globalData.userInfo.accessToken) {
			wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
			util.go('/pages/login/login/login');
			return;
		}
		mta.Event.stat('index_my_etc',{});
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
				// if (this.data.orderInfo.pledgeStatus === 0) {
				// 	// pledgeStatus 状态，-1 无需支付 0-待支付，1-已支付，2-退款中，3-退款成功，4-退款失败
				// 	// 待支付保证金
				// 	util.go(`/pages/default/margin_payment/margin_payment?marginPaymentMoney=${this.data.orderInfo.pledgeMoney}`);
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
			} else if (this.data.orderInfo.isVehicle === 1 && this.data.orderInfo.isOwner === 1) {
				// 已上传行驶证， 未上传车主身份证
				util.go('/pages/default/update_id_card/update_id_card?type=normal_process');
			}
		}
	}
});
