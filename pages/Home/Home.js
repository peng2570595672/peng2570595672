/**
 * @author 狂奔的蜗牛
 * @desc 首页
 */
const util = require('../../utils/util.js');
const app = getApp();
Page({
	data: {
		isContinentInsurance: app.globalData.isContinentInsurance,// 是否是大地
		btnSwitch: false,
		entranceList: [
			{title: '通行发票', ico: 'invoice', url: 'invoice', isShow: true, statisticsEvent: 'index_invoice'},
			{title: '违章查询', ico: 'violation-enquiry', url: 'violation_enquiry', isShow: !app.globalData.isContinentInsurance, statisticsEvent: 'index_violation_enquiry'},
			{title: 'ETC账单', ico: 'my-order', url: 'my_order', isShow: app.globalData.isContinentInsurance, statisticsEvent: 'index_my_order'},
			// {title: '在线客服', ico: 'server', url: 'online_customer_service', isShow: true, statisticsEvent: 'index_server'},
			{title: '优惠加油', ico: 'icontaocan-jiayou', url: 'preferential_refueling', isShow: true, statisticsEvent: 'index_oil'},
			{title: '个人中心', ico: 'personal-center', url: 'index', isShow: true, statisticsEvent: 'index_personal_center'}
		],
		bannerList: [
			{img: 'https://file.cyzl.com/g001/M07/42/6E/oYYBAGCrTgOANI-7AABwMlaUjXo345.png', url: 'micro_insurance_car_insurance', isShow: !app.globalData.isContinentInsurance, statisticsEvent: 'index_micro_insurance_car_insurance'},
			{img: 'https://file.cyzl.com/g001/M07/50/2F/oYYBAGDRSJaAIRy_AABmOVUonLQ097.png', url: 'xiaoepinpin', isShow: !app.globalData.isContinentInsurance, statisticsEvent: 'index_for_xiaoepinpin'},
			{img: 'https://file.cyzl.com/g001/M07/56/6F/oYYBAGDvmOmAKFdjAABX7h3eswc492.png', url: 'micro_insurance_hcz', isShow: !app.globalData.isContinentInsurance, statisticsEvent: 'index_micro_insurance_hcz'},
			{img: 'https://file.cyzl.com/g001/M07/42/6E/oYYBAGCrThuACNFGAABtf6A3V68049.png', url: '', isShow: app.globalData.isContinentInsurance, statisticsEvent: 'index_dadi'}
		],
		activeIndex: 1,
		loginInfo: {},// 登录信息
		exceptionMessage: undefined, // 异常信息
		isNormalProcess: !app.globalData.isContinentInsurance, // 是否是正常流程进入
		// isNormalProcess: true, // 是否是正常流程进入
		recentlyTheBillList: [], // 最新客车账单集合
		recentlyTheTruckBillList: [], // 最新货车账单集合
		recentlyTheBill: undefined, // 最新客车账单
		recentlyTheTruckBill: undefined, // 最新货车账单
		recentlyTheBillInfo: undefined, // 最新货车|客车账单
		billStatusWidth: 0, // 账单宽度
		isAllActivation: false,// 是否客车全是激活订单
		isAllActivationTruck: false,// 是否货车全是激活订单
		isTruckArrearage: false,// 是否货车欠费
		isArrearage: false,// 是否客车欠费
		isTermination: false,// 是否货车解约
		isTerminationTruck: false,// 是否货车解约
		truckList: [],
		truckActivationOrderList: [],
		passengerCarList: [],
		paymentOrder: [],// 已补缴关联车牌订单
		truckOrderInfo: undefined, // 货车订单
		passengerCarOrderInfo: undefined, // 客车订单
		orderInfo: undefined, // 客车|货车订单
		requestBillNum: 0, // 客车账单请求次数
		requestBillTruckNum: 0, // 客车账单请求次数
		needRequestBillNum: 0, // 需要请求的次数
		requestBillEnd: false, // 账单请求结束
		isClickNotice: false, // 是否点击过广告位
		isShowNotice: false, // 是否显示广告位
		isActivityDate: false, // 是否活动期间
		isActivityForBannerDate: false, // 是否是banner上线时间
		dialogContent: {} // 弹窗内容
	},
	async onLoad () {
		app.globalData.isTruckHandling = false;
		app.globalData.isNeedReturnHome = false;
		this.login();
	},
	async onShow () {
		this.setData({
			isActivityForBannerDate: util.isDuringDate('2021/06/23', '2021/07/16'),
			isActivityDate: util.isDuringDate('2021/6/25 11:00', '2021/6/28 15:00')
		});
		if (app.globalData.userInfo.accessToken) {
			if (app.globalData.salesmanScanCodeToHandleId) {
				await this.bindOrder();
			} else {
				if (!app.globalData.bankCardInfo?.accountNo) await util.getV2BankId();
				await this.getStatus();
			}
		}
		// 登录页返回
		let loginInfoFinal = wx.getStorageSync('login_info_final');
		if (loginInfoFinal) {
			this.setData({
				loginInfo: JSON.parse(loginInfoFinal)
			});
			if (app.globalData.salesmanScanCodeToHandleId) {
				await this.bindOrder();
			} else {
				if (!app.globalData.bankCardInfo?.accountNo) {
					await util.getV2BankId();
				}
				await this.getStatus();
				await this.getIsShowNotice();
			}
			wx.removeStorageSync('login_info_final');
		}
	},
	async getIsShowNotice () {
		const result = await util.queryProtocolRecord(2);
		this.setData({
			isClickNotice: result
		});
	},
	// 各入口跳转跳转
	onClickEntrance (e) {
		// 未登录
		if (!app.globalData.userInfo?.accessToken) {
			wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
			util.go('/pages/login/login/login');
			return;
		}
		let url = e.currentTarget.dataset.url;
		let statistics = e.currentTarget.dataset.statistics;
		wx.uma.trackEvent(statistics);
		if (url === 'violation_enquiry') {
			// 统计点击进入违章查询
			this.onClickViolationEnquiry();
			return;
		}
		if (url === 'preferential_refueling') {
			// 优化加油
			util.go(`/pages/ejiayou/index/index`);
			return;
		}
		if (url === 'online_customer_service') {
			// 统计点击进入在线客服
			util.go(`/pages/web/web/web?type=${url}`);
			return;
		}
		if (url === 'invoice') {
			// 统计点击进入在线客服
			this.goMakeInvoice();
			return;
		}
		if (this.data.exceptionMessage) {
			util.showToastNoIcon(this.data.exceptionMessage);
			return;
		}
		if (url === 'index') {
			// 统计点击进入个人中心事件
		} else if (url === 'my_order') {
			// 统计点击进入我的ETC账单
		}
		// 订阅:高速扣费通知、ETC欠费提醒、黑名单状态提醒
		let urls = `/pages/personal_center/${url}/${url}?isMain=true`;
		let tmplIds = ['oz7msNJRXzk7VmASJsJtb2JG0rKEWjX3Ff1PIaAPa78','lY047e1wk-OFdeGuIx2ThV-MOJ4aUOx2HhSxUd1YXi0', 'my5wGmuottanrIAKrEhe2LERPKx4U05oU4aK9Fyucv0'];
		util.subscribe(tmplIds,urls);
	},
	// 顶部tab切换
	async onClickCheckVehicleType (e) {
		let activeIndex = parseInt(e.currentTarget.dataset.index);
		if (activeIndex === this.data.activeIndex) return;
		wx.uma.trackEvent(activeIndex === 1 ? 'index_for_tab_to_passenger_car' : 'index_for_tab_to_truck');
		this.setData({
			activeIndex,
			orderInfo: activeIndex === 1 ? (this.data.passengerCarOrderInfo || false) : (this.data.truckOrderInfo || false),
			recentlyTheBillInfo: activeIndex === 1 ? (this.data.recentlyTheBill || false) : (this.data.recentlyTheTruckBill || false)
		});
		if (this.data.orderInfo.selfStatus === 17) {
			await this.getQueryProcessInfo(this.data.orderInfo.id);
		}
		const that = this;
		wx.createSelectorQuery().selectAll('.bill').boundingClientRect(function (rect) {
			that.setData({
				billStatusWidth: rect[0]?.width
			});
		}).exec();
		const animation = wx.createAnimation({
			duration: 300
		});
		animation.opacity(0).scale(0).step();// 修改透明度,放大
		this.setData({
			animationImage: util.wxAnimation(200, activeIndex === 1 ? 0 : 488, 'translateX'),
			animationTrucksImage: util.wxAnimation(200, activeIndex === 1 ? 0 : -488, 'translateX'),
			animationTitle: util.wxAnimation(200, activeIndex === 1 ? 0 : -958, 'translateX'),
			animationSubTitle1: util.wxAnimation(300, activeIndex === 1 ? 0 : -958, 'translateX'),
			animationSubTitle2: util.wxAnimation(400, activeIndex === 1 ? 0 : -958, 'translateX'),
			animationVehicleInfo: util.wxAnimation(activeIndex === 1 ? 0 : 200, activeIndex === 1 ? 0 : 150, 'translateY', activeIndex === 1 ? 1 : 0),
			animationVehicleInfoForTrucks: util.wxAnimation(activeIndex === 1 ? 0 : 200, activeIndex === 1 ? 0 : -150, 'translateY',activeIndex === 1 ? 0 : 1),
			animationTransaction: animation.export()
		});
		setTimeout(() => {
			this.setData({
				btnSwitch: activeIndex === 2
			});
			animation.opacity(1).scale(1).step();// 修改透明度,放大
			this.setData({
				animationTransaction: animation.export()
			});
		}, 300);
	},
	// 违章查询
	onClickViolationEnquiry () {
		// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
		wx.navigateToMiniProgram({
			appId: 'wx06a561655ab8f5b2',
			path: 'pages/base/redirect/index?routeKey=PC01_REDIRECT&autoRoute=CHECKILLEGAL&outsource=souyisou&wtagid=116.115.10',
			envVersion: 'release',
			fail () {
				util.showToastNoIcon('调起小程序失败, 请重试！');
			}
		});
	},
	// 通行发票
	goMakeInvoice () {
		wx.navigateToMiniProgram({
			appId: 'wx9040bb0d3f910004',
			path: 'pages/index/index',
			envVersion: 'release', // 目前联调为体验版
			fail () {
				util.showToastNoIcon('调起票根小程序失败, 请重试！');
			}
		});
	},
	// 微保好车主
	openWeiBao (pageUrl) {
		wx.navigateToMiniProgram({
			appId: 'wx06a561655ab8f5b2',// 正式
			// appId: app.globalData.test ? 'wx7f3f0032b6e6f0cc' : 'wx06a561655ab8f5b2',
			path: pageUrl,
			envVersion: 'release',
			fail () {
				util.showToastNoIcon('调起微保小程序失败, 请重试！');
			}
		});
	},
	// 点击轮播图
	onClickSwiper (e) {
		// 未登录
		if (!app.globalData.userInfo.accessToken) {
			wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
			util.go('/pages/login/login/login');
			return;
		}
		let item = e.currentTarget.dataset.item;
		wx.uma.trackEvent(item.statisticsEvent);
		if (item?.url === 'micro_insurance_car_insurance') {
			// 订阅:车险服务状态提醒
			this.subscribe();
			return;
		}
		if (item?.url === 'micro_insurance_hcz') {
			const pageUrl = 'pages/base/redirect/index?routeKey=WEDRIVE_HIGH_JOIN&wtagid=104.210.4';
			this.openWeiBao(pageUrl);
			return;
		}
		if (item?.url === 'xiaoepinpin') {
			const pageUrl = 'pages/base/redirect/index?routeKey=WEDRIVE_HIGH_JOIN&wtagid=104.210.4';
			this.openXiaoEPinPin(pageUrl);
		}
	},
	openXiaoEPinPin () {
		wx.navigateToMiniProgram({
			appId: 'wxf6f29613766abce4',
			path: 'pages/sub-packages/ug/pages/landing-pages/index?themeid=1076&channelid=1&skuid=4843521&&configid=60a78267536306017756bdd0&relatedSpuId=291058&adid=0617sjht_etc_xcx_5810_R',
			success () {
			},
			fail () {
				// 未成功跳转到签约小程序
				util.showToastNoIcon('调起小鹅拼拼小程序失败, 请重试！');
			}
		});
	},
	// 点击广告位
	async onClickNotice () {
		if (!this.data.isClickNotice) await util.addProtocolRecord(2);
		wx.uma.trackEvent('index_for_purchase_coupons');
		util.go('/pages/separate_interest_package/index/index');
	},
	/**
	 *  订阅消息封装
	 */
	subscribe () {
		// 判断版本，兼容处理
		let result = util.compareVersion(app.globalData.SDKVersion, '2.8.2');
		let orderId = '';
		if (result >= 0) {
			util.showLoading();
			wx.requestSubscribeMessage({
				tmplIds: ['rWHTLYmUdcuYw-wKU0QUyGv8dhgIl8z-Pa3HDdzuwbw'],
				success: (res) => {
					console.log(res);
					util.hideLoading();
					if (res.errMsg === 'requestSubscribeMessage:ok') {
						let keys = Object.keys(res);
						// 是否存在部分未允许的订阅消息
						let isReject = false;
						for (let key of keys) {
							if (res[key] === 'reject') {
								isReject = true;
								break;
							}
						}
						// 有未允许的订阅消息
						if (isReject) {
							util.alert({
								content: '检查到当前订阅消息未授权接收，请授权',
								showCancel: true,
								confirmText: '授权',
								confirm: () => {
									wx.openSetting({
										success: () => {
											util.getInsuranceOffer(orderId, '116.115.40');
										},
										fail: () => {
											showToastNoIcon('打开设置界面失败，请重试！');
											util.getInsuranceOffer(orderId,'116.115.40');
										}
									});
								},
								cancel: () => { // 点击取消按钮
									util.getInsuranceOffer(orderId,'116.115.40');
								}
							});
						} else {
							util.getInsuranceOffer(orderId,'116.115.40');
						}
					}
				},
				fail: (res) => {
					console.log(res);
					util.hideLoading();
					// 不是点击的取消按钮
					if (res.errMsg === 'requestSubscribeMessage:fail cancel') {
						util.getInsuranceOffer(orderId,'116.115.40');
					} else {
						util.alert({
							content: '调起订阅消息失败，是否前往"设置" -> "订阅消息"进行订阅？',
							showCancel: true,
							confirmText: '打开设置',
							confirm: () => {
								wx.openSetting({
									success: () => {
										util.getInsuranceOffer(orderId,'116.115.40');
									},
									fail: () => {
										showToastNoIcon('打开设置界面失败，请重试！');
										util.getInsuranceOffer(orderId,'116.115.40');
									}
								});
							},
							cancel: () => {
								util.getInsuranceOffer(orderId,'116.115.40');
							}
						});
					}
				}
			});
		} else {
			util.alert({
				title: '微信更新提示',
				content: '检测到当前微信版本过低，可能导致部分功能无法使用；可前往微信“我>设置>关于微信>版本更新”进行升级',
				confirmText: '继续使用',
				showCancel: true,
				confirm: () => {
					util.getInsuranceOffer(orderId,'116.115.40');
				}
			});
		}
	},
	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: async (res) => {
				const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				});
				this.data.entranceList[1].isShow = !app.globalData.isContinentInsurance;
				this.data.entranceList[2].isShow = app.globalData.isContinentInsurance;
				this.data.bannerList.map(item => {
					item.statisticsEvent === 'index_dadi' ? item.isShow = app.globalData.isContinentInsurance : item.isShow = !app.globalData.isContinentInsurance;
				});
				this.setData({
					isNormalProcess: !app.globalData.isContinentInsurance,
					isContinentInsurance: app.globalData.isContinentInsurance,
					entranceList: this.data.entranceList,
					bannerList: this.data.bannerList
				});
				if (!result) return;
				if (result.code === 0) {
					result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
					this.setData({
						loginInfo: result.data
					});
					// 已经绑定了手机号
					if (result.data.needBindingPhone !== 1) {
						app.globalData.userInfo = result.data;
						app.globalData.openId = result.data.openId;
						app.globalData.memberId = result.data.memberId;
						app.globalData.mobilePhone = result.data.mobilePhone;
						// 查询最后一笔订单状态
						if (app.globalData.salesmanScanCodeToHandleId) {
							await this.bindOrder();
						} else {
							if (!app.globalData.bankCardInfo?.accountNo) await util.getV2BankId();
							if (app.globalData.isSignUpImmediately) {
								app.globalData.isSignUpImmediately = false;
								await this.getStatus(true);
							} else {
								await this.getStatus();
							}
							await this.getIsShowNotice();
						}
					}
				} else {
					this.setData({
						exceptionMessage: result.message
					});
					util.showToastNoIcon(result.message);
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	// 点击tab栏下的办理
	onClickTransaction () {
		if (this.data.activeIndex !== 1) return;
		app.globalData.orderInfo.orderId = '';
		wx.uma.trackEvent(this.data.activeIndex === 1 ? 'index_for_passenger_car_entrance' : 'index_for_truck_entrance');
		util.go(`/pages/${this.data.activeIndex === 1 ? 'default' : 'truck_handling'}/index/index?isMain=true`);
	},
	// 业务员端订单码绑定订单
	async bindOrder () {
		const result = await util.getDataFromServersV2('consumer/member/bind-order', {
			orderId: app.globalData.salesmanScanCodeToHandleId
		});
		if (!result) return;
		if (result.code === 0) {
			app.globalData.salesmanScanCodeToHandleId = undefined;// 处理返回首页再次请求
			if (!app.globalData.bankCardInfo?.accountNo) await util.getV2BankId();
			await this.getStatus(true);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 获取手机号
	async onGetPhoneNumber (e) {
		// 允许授权
		if (e.detail.errMsg === 'getPhoneNumber:ok') {
			let encryptedData = e.detail.encryptedData;
			let iv = e.detail.iv;
			util.showLoading({
				title: '绑定中...'
			});
			const result = await util.getDataFromServersV2('consumer/member/common/applet/bindingPhone', {
				certificate: this.data.loginInfo.certificate,
				encryptedData: encryptedData, // 微信加密数据
				iv: iv // 微信加密数据
			});
			if (!result) return;
			// 绑定手机号成功
			if (result.code === 0) {
				result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
				app.globalData.userInfo = result.data; // 用户登录信息
				app.globalData.openId = result.data.openId;
				app.globalData.memberId = result.data.memberId;
				app.globalData.mobilePhone = result.data.mobilePhone;
				let loginInfo = this.data.loginInfo;
				loginInfo['showMobilePhone'] = util.mobilePhoneReplace(result.data.mobilePhone);
				loginInfo.needBindingPhone = 0;
				this.setData({
					loginInfo
				});
				if (app.globalData.salesmanScanCodeToHandleId) {
					await this.bindOrder();
				} else {
					if (!app.globalData.bankCardInfo?.accountNo) await util.getV2BankId();
					await this.getStatus();
				}
			} else {
				util.hideLoading();
				util.showToastNoIcon(result.message);
			}
		}
	},
	// 分享
	onShareAppMessage () {
		return {
			title: '申办即享最新车主出行权益！',
			imageUrl: 'https://file.cyzl.com/g001/M07/56/C7/oYYBAGDw3haAa9dPAADutBNUNJ4965.png',
			path: '/pages/Home/Home'
		};
	},
	sortDataArray (dataArray) {
		return dataArray.sort(function (a,b) {
			if (b.lastOpTime && a.lastOpTime) return Date.parse(b.lastOpTime.replace(/-/g,'/')) - Date.parse(a.lastOpTime.replace(/-/g,'/'));
		});
	},
	// 获取ETC信息
	async getStatus (isToMasterQuery) {
		let params = {
			openId: app.globalData.openId
		};
		if (isToMasterQuery) params['toMasterQuery'] = true;// 直接查询主库
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', params);

		// 订单展示优先级: 扣款失败账单>已解约状态>按最近时间顺序：办理状态or账单记录
		if (!result) return;
		if (result.code === 0) {
			const list = this.sortDataArray(result.data);
			app.globalData.myEtcList = list;
			// 京东客服
			let [truckList, passengerCarList, vehicleList, activationOrder, activationTruckOrder, truckActivationOrderList] = [[], [], [], [], [], []];

			// let [vehicleList, activationOrder, activationTruckOrder] = [[], [], []];
			app.globalData.ownerServiceArrearsList = list.filter(item => item.paySkipParams !== undefined); // 筛选车主服务欠费
			list.map(item => {
				item['selfStatus'] = item.isNewTrucks === 1 ? util.getTruckHandlingStatus(item) : util.getStatus(item);
				vehicleList.push(item.vehPlates);
				wx.setStorageSync('cars', vehicleList.join('、'));
				if (item.isNewTrucks === 0) {
					passengerCarList.push(item);
					if (item.obuStatus === 1 || item.obuStatus === 5) activationOrder.push(item.obuCardType);
				}
				if (item.isNewTrucks === 1) {
					truckList.push(item);
					if (item.obuStatus === 1 || item.obuStatus === 5) {
						activationTruckOrder.push(item.obuCardType);
						truckActivationOrderList.push(item.id);
					}
				}
			});
			const isWaitActivation = passengerCarList.find(item => item.auditStatus === 2 && item.logisticsId === 0 && item.obuStatus === 0);// 待激活
			const isDuringDate = util.isDuringDate('2021/6/26', '2021/7/1');
			const isAlertPrompt = wx.getStorageSync('is-alert-prompt');
			if ((isWaitActivation || !list.length) && isDuringDate && !isAlertPrompt) {
				wx.setStorageSync('is-alert-prompt', true);
				util.alert({
					title: `提示`,
					content: `因ETC系统升级，即日起至6月30日23:59期间所有办理设备将延迟发出。`,
					showCancel: false,
					cancelText: '取消',
					confirmText: '确定'
				});
			}
			const terminationOrder = passengerCarList.find(item => item.selfStatus === 1);// 查询客车第一条解约订单
			const terminationTruckOrder = truckList.find(item => item.selfStatus === 1);// 查询货车第一条解约订单
			const isAllActivation = activationOrder.length === passengerCarList.length;// 是否客车全是激活订单 - true: 展示账单单状态
			const isAllActivationTruck = activationTruckOrder.length === truckList.length;// 是否货车全是激活订单 - true: 展示账单单状态
			activationOrder = [...new Set(activationOrder)];
			activationTruckOrder = [...new Set(activationTruckOrder)];
			// 是否全是激活订单  是 - 拉取第一条订单  否 - 过滤激活订单,拉取第一条
			const passengerCarListNotActivation = isAllActivation ? passengerCarList[0] : passengerCarList.filter(item => item.selfStatus !== 12)[0];
			const passengerCarListNotTruckActivation = isAllActivationTruck ? truckList[0] : truckList.filter(item => item.selfStatus !== 12)[0];
			app.globalData.isArrearageData.trucksOrderList = truckActivationOrderList;
			this.setData({
				isShowNotice: !!app.globalData.myEtcList.length,
				needRequestBillNum: activationTruckOrder.length + activationOrder.length,
				isTermination: !!terminationOrder,
				isTerminationTruck: !!terminationTruckOrder,
				truckActivationOrderList,
				isAllActivation,
				truckList,
				passengerCarList,
				isAllActivationTruck,
				truckOrderInfo: terminationTruckOrder || passengerCarListNotTruckActivation, // 解约订单 || 拉取第一条
				passengerCarOrderInfo: terminationOrder || passengerCarListNotActivation // 解约订单 || 拉取第一条
			});
			app.globalData.truckLicensePlate = passengerCarListNotActivation ? passengerCarListNotActivation.vehPlates : ''; // 存货车出牌
			// 上一页返回时重置
			this.setData({
				orderInfo: this.data.activeIndex === 1 ? this.data.passengerCarOrderInfo : this.data.truckOrderInfo
			});
			if (this.data.orderInfo?.selfStatus === 17) {
				await this.getQueryProcessInfo(this.data.orderInfo.id);
			}
			let channelList = activationOrder.concat(activationTruckOrder);
			channelList = [...new Set(channelList)];
			if (channelList.length) await this.getArrearageTheBill(channelList);
			if (activationOrder.length) {
				// 查询客车最近一次账单
				activationOrder.map(async item => {
					await this.getRecentlyTheBill(item, false);
				});
			}
			if (activationTruckOrder.length) {
				// 查询货车最近一次账单
				await activationTruckOrder.map(async item => {
					await this.getRecentlyTheBill(item, true);
				});
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 预充模式-查询预充信息
	async getQueryProcessInfo (id) {
		const result = await util.getDataFromServersV2('consumer/order/third/queryProcessInfo', {
			orderId: id
		});
		util.hideLoading();
		if (!result) return;
		if (result.code === 0) {
			this.data.orderInfo.prechargeAmount = result.data?.prechargeAmount || 0;
			this.setData({
				orderInfo: this.data.orderInfo
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	sortBillArray (dataArray) {
		return dataArray.sort(function (a,b) {
			return Date.parse(b.addTime.replace(/-/g,'/')) - Date.parse(a.addTime.replace(/-/g,'/'));
		});
	},
	// 查询已补缴车牌
	async getPaymentVeh (item, etcMoney, etcTrucksMoney) {
		if (item.includes(21)) this.remove(item,21);// 暂不查货车
		const result = await util.getDataFromServersV2('consumer/etc/get-supplementary-payment-veh', {
			channels: item,
			shopProductId: this.data.orderInfo.shopProductId
		});
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		if (!result.data) return;
		let [paymentOrder, paymentVeh] = [[], []];
		app.globalData.myEtcList.map(item => {
			result.data.map(it => {
				if (it === item.vehPlates && item.contractVersion === 'v3') {
					paymentOrder.push(item.id);
					paymentVeh.push(item.vehPlates);
				}
			});
		});
		this.setData({paymentOrder});
		this.vehicleInfoAlert(etcMoney, etcTrucksMoney, paymentVeh.join('、'));
	},
	// 删除方法
	remove (array,val) {
		for (let i = 0; i < array.length; i++) {
			if (array[i] === val) {
				array.splice(i, 1);
			}
		}
		return -1;
	},
	// 查询欠费账单
	async getArrearageTheBill (item) {
		let etcTrucksMoney = 0;
		if (item.includes(21)) {
			this.remove(item,21);// 暂不查货车
			const info = await util.getDataFromServersV2('consumer/etc/judge-detail-channels-truck', {
				orderNos: this.data.truckActivationOrderList
			});
			if (!info) return;
			if (info.code) {
				util.showToastNoIcon(info.message);
				return;
			}
			etcTrucksMoney = info.data.etcMoney;
		}
		const result = await util.getDataFromServersV2('consumer/etc/judge-detail-channels', {
			channels: item
		});
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		if (!result.data) return;
		await this.getPaymentVeh(item, result.data.etcMoney, etcTrucksMoney);
	},
	// 查询最近一次账单
	async getRecentlyTheBill (item, isTruck = false) {
		const result = await util.getDataFromServersV2('consumer/etc/get-last-bill', {
			channel: item
		});
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		isTruck ? this.data.requestBillTruckNum++ : this.data.requestBillNum++;
		this.setData({
			requestBillNum: this.data.requestBillNum
		});
		if (result.data) {
			if (isTruck) {
				this.data.recentlyTheTruckBillList.push(result.data);
				this.setData({
					recentlyTheTruckBillList: this.data.recentlyTheTruckBillList
				});
			} else {
				this.data.recentlyTheBillList.push(result.data);
				this.setData({
					recentlyTheBillList: this.data.recentlyTheBillList
				});
			}
		}
		if (isTruck) { // 货车账单
			const list = this.sortBillArray(this.data.recentlyTheTruckBillList);
			let arrearageOrder = list.find(item => item.deductStatus === 2);// 查询第一条欠费订单
			this.setData({
				isTruckArrearage: !!arrearageOrder,
				recentlyTheTruckBill: arrearageOrder || this.data.recentlyTheTruckBillList[0]
			});
		} else { // 客车账单
			const list = this.sortBillArray(this.data.recentlyTheBillList);
			let arrearageOrder = list.find(item => item.deductStatus === 2);// 查询第一条欠费订单
			this.setData({
				isArrearage: !!arrearageOrder,
				recentlyTheBill: arrearageOrder || this.data.recentlyTheBillList[0]
			});
			const that = this;
			wx.createSelectorQuery().selectAll('.bill').boundingClientRect(function (rect) {
				that.setData({
					billStatusWidth: rect[0]?.width
				});
			}).exec();
		}
		if (this.data.needRequestBillNum === (this.data.requestBillTruckNum + this.data.requestBillNum)) {
			// 查询账单已结束
			console.log('------------');
			this.setData({
				recentlyTheBillInfo: this.data.activeIndex === 1 ? (this.data.recentlyTheBill || false) : (this.data.recentlyTheTruckBill || false)
			});
		}
	},
	// 车辆弹窗
	vehicleInfoAlert (etcMoney, etcTrucksMoney, paymentVeh) {
		if (etcMoney || etcTrucksMoney) {
			// 货车 || 客车欠费
			this.dialogJudge(etcMoney || etcTrucksMoney, !etcMoney);
			return;
		}
		// 已补缴 && 签约信息为3.0车辆
		if (paymentVeh.length) {
			util.alert({
				title: `提示`,
				content: `系统检测到您车牌${paymentVeh}签约版本过低，为保障您高速通行顺利，我们为您升级了新的签约版本。是否同意重新签约？`,
				showCancel: true,
				confirmColor: '#576b95',
				cancelText: '取消',
				confirmText: '同意',
				confirm: async () => {
					await this.changeByOrderIds();
				}
			});
			return;
		}
		if (this.data.isTerminationTruck) {
			// 货车解约 - 弹窗签约
			this.dialogJudge(0);
			return;
		}
		if (this.data.isTermination) {
			this.dialogJudge(0);
			// 客车解约 - 弹窗签约
		}
	},
	dialogJudge (money, isTruck = false) {
		if (money) {
			// // 欠费 - 弹窗补缴
			// let dialogContent = {
			// 	title: '请尽快补缴欠款',
			// 	content: `你已欠款${money / 100}元，将影响正常的高速通行`,
			// 	cancel: '取消',
			// 	confirm: '立刻补缴'
			// };
			// this.setData({dialogContent});
			// this.selectComponent('#dialog').show();
			util.alertPayment(money, isTruck);
			return;
		}
		// 解约
		let orderInfo = this.data.isTerminationTruck ? this.data.truckOrderInfo : this.data.passengerCarOrderInfo;
		let dialogContent = {
			orderInfo: orderInfo,
			title: '无法正常扣款',
			content: '检测到你已解除车主服务签约，将影响正常的高速通行',
			cancel: '取消',
			confirm: '恢复签约'
		};
		this.setData({dialogContent});
		this.selectComponent('#dialog').show();
	},
	// 3.0清空签约信息 & 修改成2.0套餐
	async changeByOrderIds () {
		const result = await util.getDataFromServersV2('consumer/order/changeByOrderIds', {
			orderIds: this.data.paymentOrder
		});
		if (!result) return;
		if (result.code === 0) {
			util.showToastNoIcon('签约版本升级成功');
			await this.getStatus();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 去账单详情页
	onClickBill () {
		wx.uma.trackEvent('index_for_order_details');
		let model = this.data.recentlyTheBillInfo;
		util.go(`/pages/personal_center/order_details/order_details?id=${model.id}&channel=${model.channel}&month=${model.month}`);
	},
	// 弹窗确认回调
	onHandle () {
		if (this.data.dialogContent.orderInfo) {
			// 恢复签约
			app.globalData.orderInfo.orderId = this.data.dialogContent.orderInfo.id;
			wx.uma.trackEvent('index_for_dialog_signing');
			this.onClickBackToSign(this.data.dialogContent.orderInfo);
			return;
		}
		wx.uma.trackEvent('index_for_arrears_bill');
		util.go('/pages/personal_center/arrears_bill/arrears_bill');
	},
	// 点击车辆信息
	onClickVehicle () {
		console.log(this.data.activeIndex,'==============这里应是2===================');
		const orderInfo = this.data.activeIndex === 1 ? this.data.passengerCarOrderInfo : this.data.truckOrderInfo;
		if (!orderInfo) {
			app.globalData.orderInfo.orderId = '';
			wx.uma.trackEvent(this.data.activeIndex === 1 ? 'index_for_new_deal_with' : 'index_for_truck_new_deal_with');
		//	const url = this.data.activeIndex === 1 ? '/pages/default/receiving_address/receiving_address' : '/pages/truck_handling/truck_receiving_address/truck_receiving_address';
		const url = this.data.activeIndex === 1 ? '/pages/default/receiving_address/receiving_address' : '/pages/default/trucks/trucks';
		util.go(url);
			return;
		}
		app.globalData.orderInfo.orderId = orderInfo.id;
		const fun = {
			1: () => this.onClickBackToSign(orderInfo),// 恢复签约
			2: () => this.onClickContinueHandle(orderInfo),// 继续办理
			3: () => this.goPayment(orderInfo), // 去支付
			4: () => this.onClickContinueHandle(orderInfo), // 继续办理
			5: () => this.onClickBackToSign(orderInfo), // 签约微信支付 - 去签约
			6: () => this.onClickViewProcessingProgressHandle(orderInfo), // 订单排队审核中 - 查看进度
			7: () => this.onClickModifiedData(orderInfo), // 修改资料 - 上传证件页
			8: () => this.goEtcDetails(orderInfo), // 高速核验不通过 - 查看进度
			9: () => this.onClickHighSpeedSigning(orderInfo), // 去签约
			10: () => this.onClickViewProcessingProgressHandle(orderInfo), // 查看进度
			11: () => this.onClickCctivate(orderInfo), // 去激活
			13: () => this.goBindingAccount(orderInfo), // 去开户
			14: () => this.goRechargeAuthorization(orderInfo), // 去授权预充保证金
			15: () => this.goRecharge(orderInfo), // 保证金预充失败 - 去预充
			16: () => this.goBindingWithholding(orderInfo), // 选装-未已绑定车辆代扣
			17: () => this.onClickViewProcessingProgressHandle(orderInfo), // 去预充(预充流程)-查看进度
			18: () => this.onTollWithholding(orderInfo) // 代扣通行费
		};
		fun[orderInfo.selfStatus].call();
	},
	// 选装-去绑定代扣
	goBindingWithholding () {
		util.go(`/pages/default/bind_withhold/bind_withhold?associatedVeh=1`);
	},
	// 去高速签约
	onClickHighSpeedSigning (orderInfo) {
		if (orderInfo.protocolStatus === 0) {
			this.goPayment(orderInfo);
			return;
		}
		wx.uma.trackEvent('index_for_order_audit');
		util.go(`/pages/default/${orderInfo.orderType === 31 ? 'transition_page' : 'order_audit'}/${orderInfo.orderType === 31 ? 'transition_page' : 'order_audit'}`);
	},
	// 去预充
	goRecharge (orderInfo) {
		wx.uma.trackEvent('index_for_account_recharge');
		util.go(`/pages/account_management/account_recharge/account_recharge?money=${orderInfo.holdBalance}`);
	},
	// 去开户
	goBindingAccount () {
		wx.uma.trackEvent('index_for_binding_account');
		util.go('/pages/truck_handling/binding_account/binding_account');
	},
	// 代扣通行费
	onTollWithholding () {
		util.go(`/pages/truck_handling/binding_account_successful/binding_account_successful`);
	},
	// 去授权预充保证金
	goRechargeAuthorization () {
		wx.uma.trackEvent('index_for_recharge_instructions');
		util.go('/pages/truck_handling/recharge_instructions/recharge_instructions');
	},
	// 去设备详情 审核失败:不可办理
	goEtcDetails (orderInfo) {
		wx.uma.trackEvent('index_for_my_etc_detail');
		util.go(`/pages/personal_center/my_etc_detail/my_etc_detail?orderId=${orderInfo.id}`);
	},
	goPayment (orderInfo) {
		const path = orderInfo.isNewTrucks === 1 ? 'truck_handling' : 'default';
		wx.uma.trackEvent(orderInfo.isNewTrucks === 1 ? 'index_for_truck_package' : 'index_for_package');
		util.go(`/pages/${path}/package_the_rights_and_interests/package_the_rights_and_interests`);
	},
	// 恢复签约
	async onClickBackToSign (obj) {
		if (obj.orderType === 31 && obj.protocolStatus === 0) {
			const path = obj.isNewTrucks === 1 ? 'truck_handling' : 'default';
			util.go(`/pages/${path}/package_the_rights_and_interests/package_the_rights_and_interests`);
			return;
		}
		if (obj.orderType === 31 && obj.auditStatus === 0 && obj.flowVersion !== 1) {
			this.onClickHighSpeedSigning(obj);
			return;
		}
		if (obj.isNewTrucks === 1) {
			wx.uma.trackEvent('index_for_contract_management');
			util.go(`/pages/truck_handling/contract_management/contract_management`);
			return;
		}
		app.globalData.isSecondSigning = false;
		app.globalData.isSecondSigningInformationPerfect = false;
		app.globalData.contractStatus = obj.contractStatus;
		if (obj.status === 1) app.globalData.isSecondSigningInformationPerfect = true;
		if (obj.logisticsId !== 0 || obj.obuStatus === 5 || obj.obuStatus === 1) app.globalData.isSecondSigning = true;
		if (obj.contractStatus === 2) {
			app.globalData.orderInfo.orderId = obj.id;
			// 恢复签约
			wx.uma.trackEvent('index_for_resume_signing');
			await this.restoreSign(obj);
		} else {
			// 2.0 立即签约
			app.globalData.signAContract = -1;
			app.globalData.isSalesmanOrder = obj.orderType === 31;
			wx.uma.trackEvent('index_for_sign_contract');
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
					// 3.0
					if (result.data.contractId) {
						wx.navigateToMiniProgram({
							appId: 'wxbcad394b3d99dac9',
							path: 'pages/etc/index',
							extraData: {
								contract_id: result.data.contractId
							},
							success () {
							},
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
		let params = {
			orderId: obj.id,// 订单id
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		if (obj.remark && obj.remark.indexOf('迁移订单数据') !== -1) {
			// 1.0数据 立即签约 需标记资料已完善
			params['upgradeToTwo'] = true; // 1.0数据转2.0
			params['dataComplete'] = 1; // 资料已完善
		}
		if (obj.isNewTrucks === 1 && obj.status === 0) {
			params['dataComplete'] = 1; // 资料已完善
		}
		const result = await util.getDataFromServersV2('consumer/order/save-order-info', params);
		this.setData({
			available: true,
			isRequest: false
		});
		if (!result) return;
		if (result.code === 0) {
			let res = result.data.contract;
			// 签约车主服务 2.0
			app.globalData.isSignUpImmediately = true;// 返回时需要查询主库
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
	// 查看办理进度
	onClickViewProcessingProgressHandle (orderInfo) {
		// 统计点击事件
		wx.uma.trackEvent('index_for_processing_progress');
		util.go(`/pages/default/processing_progress/processing_progress?orderId=${orderInfo.id}`);
	},
	// 去激活
	async onClickCctivate (orderInfo) {
		wx.uma.trackEvent('index_for_activation');
		if (orderInfo.logisticsId !== 0) {
			await this.confirmReceipt(orderInfo);
		} else {
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
	async confirmReceipt (orderInfo) {
		const result = await util.getDataFromServersV2('consumer/order/affirm-take-obu', {
			logisticsId: orderInfo.logisticsId
		});
		if (!result) return;
		if (result.code === 0) {
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
			util.showToastNoIcon(result.message);
		}
	},
	// 修改资料
	async onClickModifiedData (orderInfo) {
		if (orderInfo.isNewTrucks === 1) {
			if (orderInfo.flowVersion === 4) {
				// 预充流程取消办理
				await this.cancelOrder(orderInfo);
				return;
			}
			// 货车办理
			wx.uma.trackEvent('index_for_truck_modified_data');
			util.go('/pages/truck_handling/information_list/information_list?isModifiedData=true');
			return;
		}
		if (util.getHandlingType(orderInfo)) {
			util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
			return;
		}
		wx.uma.trackEvent('index_for_modified_data');
		app.globalData.orderInfo.shopProductId = orderInfo.shopProductId;
		app.globalData.isModifiedData = true; // 修改资料
		app.globalData.firstVersionData = !!(orderInfo.remark && orderInfo.remark.indexOf('迁移订单数据') !== -1);
		util.go('/pages/default/information_list/information_list?isModifiedData=true');
	},
	// 取消订单
	async cancelOrder (orderInfo) {
		util.showLoading({
			title: '取消中...'
		});
		const result = await util.getDataFromServersV2('consumer/order/cancel-order', {
			orderId: orderInfo.id
		});
		if (!result) return;
		if (result.code === 0) {
			let removeList = ['passenger-car-id-card-back', 'passenger-car-id-card-face', 'passenger-car-driving-license-face', 'passenger-car-driving-license-back', 'passenger-car-headstock'];
			removeList.map(item => wx.removeStorageSync(item));
			wx.redirectTo({
				url: '/pages/personal_center/cancel_order_succeed/cancel_order_succeed'
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 继续办理
	async onClickContinueHandle (orderInfo) {
		// 统计点击事件
		app.globalData.isModifiedData = false; // 非修改资料
		app.globalData.firstVersionData = false;
		const path = orderInfo.isNewTrucks === 1 ? 'truck_handling' : 'default';
		if (orderInfo.selfStatus === 2) {
			const result = await util.initLocationInfo(orderInfo, orderInfo.isNewTrucks === 1);
			if (!result) return;
			if (result.code) {
				util.showToastNoIcon(result.message);
				return;
			}
			wx.uma.trackEvent(orderInfo.isNewTrucks === 1 ? 'index_for_continue_to_truck_package' : 'index_for_continue_to_package');
			if (app.globalData.newPackagePageData.type || orderInfo.isNewTrucks === 1) {
				// 只有分对分套餐 || 只有总对总套餐
				util.go(`/pages/${path}/package_the_rights_and_interests/package_the_rights_and_interests?type=${app.globalData.newPackagePageData.type}`);
			} else {
				util.go(`/pages/${path}/choose_the_way_to_handle/choose_the_way_to_handle`);
			}
			return;
		}
		if (orderInfo.isNewTrucks === 0 && util.getHandlingType(orderInfo)) {
			util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
			return;
		}
		wx.uma.trackEvent(orderInfo.isNewTrucks === 1 ? 'index_for_certificate_to_truck_package' : 'index_for_certificate_to_package');
		util.go(`/pages/${path}/information_list/information_list`);
	}
});
