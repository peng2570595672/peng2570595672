import {
	thirdContractSigning
} from '../../utils/utils';

/**
 * @author cyl
 * 同盾
 * 引用设备指纹SDK文件，两种方式均可，es6的方式推荐在小程序框架内使用
 */
var FMAgent = require('../../fmsdk/fm-1.6.0-umd.min.js');

/**
 * @author 狂奔的蜗牛
 * @desc 首页
 */
const util = require('../../utils/util.js');
const app = getApp();
Page({
	data: {
		isContinentInsurance: app.globalData.isContinentInsurance, // 是否是大地
		btnSwitch: false,
		entranceList: [{
				title: '通行发票',
				ico: 'invoice',
				url: 'invoice',
				isShow: true,
				statisticsEvent: 'index_invoice'
			},
			{
				title: '违章查询',
				ico: 'violation-enquiry',
				url: 'violation_enquiry',
				isShow: !app.globalData.isContinentInsurance,
				statisticsEvent: 'index_violation_enquiry'
			},
			{
				title: 'ETC账单',
				ico: 'my-order',
				url: 'my_order',
				isShow: app.globalData.isContinentInsurance,
				statisticsEvent: 'index_my_order'
			},
			{
				title: '个人中心',
				ico: 'personal-center',
				url: 'index',
				isShow: true,
				statisticsEvent: 'index_personal_center'
			}
		],
		bannerList: [
			// @cyl
			{
				img: 'https://file.cyzl.com/g001/M00/91/CF/oYYBAGLvfp2AJ6_aAAEiO5l6BYc353.png',
				url: 'moving_integral',
				isShow: true,
				alwaysShow: true,
				statisticsEvent: 'index_moving_integral'
			},
			{
				img: 'https://file.cyzl.com/g001/M07/83/64/oYYBAGJzZImAaHqlAAKimDHtunU897.png',
				url: 'micro_high_speed',
				isShow: !app.globalData.isContinentInsurance,
				statisticsEvent: 'index_micro_high_speed'
			},
			// {img: 'https://file.cyzl.com/g001/M07/50/2F/oYYBAGDRSJaAIRy_AABmOVUonLQ097.png', url: 'xiaoepinpin', isShow: !app.globalData.isContinentInsurance, statisticsEvent: 'index_for_xiaoepinpin'},
			// {img: 'https://file.cyzl.com/g001/M07/56/6F/oYYBAGDvmOmAKFdjAABX7h3eswc492.png', url: 'micro_insurance_hcz', isShow: !app.globalData.isContinentInsurance, statisticsEvent: 'index_micro_insurance_hcz'},
			{
				img: 'https://file.cyzl.com/g001/M07/42/6E/oYYBAGCrThuACNFGAABtf6A3V68049.png',
				url: '',
				isShow: app.globalData.isContinentInsurance,
				statisticsEvent: 'index_dadi'
			}
		],
		activeIndex: 1,
		loginInfo: {}, // 登录信息
		exceptionMessage: undefined, // 异常信息
		isNormalProcess: !app.globalData.isContinentInsurance, // 是否是正常流程进入
		// isNormalProcess: true, // 是否是正常流程进入
		recentlyTheBillList: [], // 最新客车账单集合
		recentlyTheTruckBillList: [], // 最新货车账单集合
		recentlyTheBill: undefined, // 最新客车账单
		recentlyTheTruckBill: undefined, // 最新货车账单
		recentlyTheBillInfo: undefined, // 最新货车|客车账单
		billStatusWidth: 0, // 账单宽度
		isAllActivation: false, // 是否客车全是激活订单
		isAllActivationTruck: false, // 是否货车全是激活订单
		isTruckArrearage: false, // 是否货车欠费
		isArrearage: false, // 是否客车欠费
		isTermination: false, // 是否货车解约
		isTerminationTruck: false, // 是否货车解约
		truckList: [],
		truckActivationOrderList: [],
		passengerCarList: [],
		paymentOrder: [], // 已补缴关联车牌订单
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
		// @cyl
		// movingIntegralControl: false, // 控制弹窗的显示与隐藏
		areaNotOpened: ['河南', '江西', '广西', '辽宁', '重庆', '云南'], // 号码归属地还未开通 移动积分业务的
		disclaimerDesc: app.globalData.disclaimerDesc,
		timeout: null,
		date: null,
		// 版本4.0 所需数据
		imgList: ['https://file.cyzl.com/g001/M01/C9/54/oYYBAGP4sCaAF2EtAABbvIQbTLM503.png'],
		moduleOneList: [{	// 账单查询 通行发票 权益商城
				icon: 'https://file.cyzl.com/g001/M01/CA/43/oYYBAGP8eRKAK0mDAAAg6lZHRZU754.jpg',
				title: '账单查询',
				btn: '最近通行的记录',
				isShow: true,
				url: 'my_order',
				statisticsEvent: 'index_my-order'
			},
			{
				icon: 'https://file.cyzl.com/g001/M01/CA/43/oYYBAGP8eSmAVDOGAAAfG-36GVE351.jpg',
				title: '通行发票',
				btn: '开高速路费发票',
				isShow: true,
				url: 'invoice',
				statisticsEvent: 'index_invoice'
			},
			{
				icon: 'https://file.cyzl.com/g001/M01/CA/43/oYYBAGP8eT-AKA3cAAAg7GXq-Ts112.jpg',
				title: '权益商城',
				btn: '免税商品上线',
				isShow: true,
				url: 'equity',
				statisticsEvent: 'index_equity'
			},
			{
				icon: 'https://file.cyzl.com/g001/M01/CA/43/oYYBAGP8eVeADTAhAAAd33onhO0108.jpg',
				title: '在线客服',
				btn: '1V1专人客服',
				isShow: true,
				url: 'online_customer_service',
				statisticsEvent: 'index_server'
			}
		],
		moduleTwoList: [],	// 出行贴心服务
		viewTc: {}, // 用于存放弹窗数据
		whetherToStay: false, // 用于控制显示弹窗时，最底层页面禁止不动
		movingIntegralObj: {
			movingIntegralControl: false
		},
		isEquityRights: app.globalData.isEquityRights,	// 是否是权益券额用户
		popList: []
	},
	async onLoad (options) {
		app.globalData.orderInfo.orderId = '';
		util.resetData();// 重置数据
		this.setData({
			date: new Date()
		});
		app.globalData.isTruckHandling = false;
		app.globalData.isNeedReturnHome = false;
		this.login();
		this.getBanner();
		util.getUserIsVip();
	},
	async onShow () {
		util.customTabbar(this, 0);
		util.getUserIsVip();
		// @cyl
		// 初始化设备指纹对象
		this.fmagent = new FMAgent(app.globalData._fmOpt);
		// 采集openid，成功后调用回调
		util.getUserInfo(this.getId);
		this.setData({
			isActivityForBannerDate: util.isDuringDate('2021/06/23', '2021/07/16'),
			isActivityDate: util.isDuringDate('2021/6/25 11:00', '2021/6/28 15:00')
		});
		if (app.globalData.isVip || app.globalData.isEquityRights) {
			this.setData({
				moduleOneList: this.data.moduleOneList.filter(item => item.title !== '在线客服')
			});
		} else {
			this.setData({
				moduleOneList: this.data.moduleOneList.filter(item => item.title !== '权益商城')
			});
		}
		console.log('数据列表：',this.data.moduleOneList);
		if (app.globalData.userInfo.accessToken) {
			util.getMemberStatus();
			if (app.globalData.salesmanScanCodeToHandleId) {
				await this.bindOrder();
			} else {
				// if (!app.globalData.bankCardInfo?.accountNo) await util.getV2BankId();
				await util.getMemberStatus();
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
				// if (!app.globalData.bankCardInfo?.accountNo) await util.getV2BankId();
				await util.getMemberStatus();
				await this.getStatus();
				await this.getIsShowNotice();
			}
			wx.removeStorageSync('login_info_final');
		}
	},

	// --------------------------------测试方法: 广告弹窗------------------------
	testFunc (e) {
		// 未登录
		if (!app.globalData.userInfo?.accessToken) {
			wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
			util.go('/pages/login/login/login');
			return;
		}
		wx.reLaunch({
			url: '/pages/etc_handle/etc_handle'
		});
	},
	// 获取 “出行贴心服务” banner
	async getBanner () {
		let params = {
			platformId: app.globalData.platformId
		};
		const result = await util.getDataFromServersV2('consumer/system/common/get-activity-banner', params,'POST',false);
		if (result.code === 0) {
			let moduleTwoList = result.data.filter(item => (item.remark === 'moving_integral'));
			moduleTwoList.map(item => {
				if (item.remark === 'moving_integral') {
					item.url = item.remark;
					item.isShow = true;
					item.alwaysShow = true;
					item.imgUrl = 'https://file.cyzl.com/g001/M01/C9/52/oYYBAGP4mXiAVfbDAAAkI9pn5Nw707.png';
					item.statisticsEvent = 'index_moving_integral';
				}
			});
			this.setData({
				moduleTwoList
			});
		}
	},

	// ---------------------------------end---------------------------
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
			this.selectComponent('#dialog1').show('violation_enquiry');
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
		if (url === 'equity') {
			this.handleMall();
			return;
		}
		if (url === 'invoice') {
			// 通行发票
			this.selectComponent('#dialog1').show('invoice');
			// this.goMakeInvoice();
			return;
		}
		if (this.data.exceptionMessage) {
			util.showToastNoIcon(this.data.exceptionMessage);
			return;
		}
		if (url === 'index') {
			// 统计点击进入个人中心事件
		}
		console.log(url);
		if (url === 'my_order') {
			// 统计点击进入我的ETC账单
			util.go(`/pages/personal_center/${url}/${url}`);
			return;
		}

		// 订阅:高速扣费通知、ETC欠费提醒、黑名单状态提醒
		let urls = `/pages/personal_center/${url}/${url}?isMain=true`;
		let tmplIds = ['oz7msNJRXzk7VmASJsJtb2JG0rKEWjX3Ff1PIaAPa78',
			'lY047e1wk-OFdeGuIx2ThV-MOJ4aUOx2HhSxUd1YXi0', 'my5wGmuottanrIAKrEhe2LERPKx4U05oU4aK9Fyucv0'
		];
		util.subscribe(tmplIds, urls);
	},
	// 顶部tab切换
	async onClickCheckVehicleType (e) {
		let activeIndex = parseInt(e.currentTarget.dataset.index);
		if (activeIndex === this.data.activeIndex) return;
		wx.uma.trackEvent(activeIndex === 1 ? 'index_for_tab_to_passenger_car' : 'index_for_tab_to_truck');
		this.setData({
			activeIndex,
			orderInfo: activeIndex === 1 ? (this.data.passengerCarOrderInfo || false) : (this.data
				.truckOrderInfo || false),
			recentlyTheBillInfo: activeIndex === 1 ? (this.data.recentlyTheBill || false) : (this
				.data.recentlyTheTruckBill || false)
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
		animation.opacity(0).scale(0).step(); // 修改透明度,放大
		this.setData({
			animationImage: util.wxAnimation(200, activeIndex === 1 ? 0 : 488, 'translateX'),
			animationTrucksImage: util.wxAnimation(200, activeIndex === 1 ? 0 : -488, 'translateX'),
			animationTitle: util.wxAnimation(200, activeIndex === 1 ? 0 : -958, 'translateX'),
			animationSubTitle1: util.wxAnimation(300, activeIndex === 1 ? 0 : -958, 'translateX'),
			animationSubTitle2: util.wxAnimation(400, activeIndex === 1 ? 0 : -958, 'translateX'),
			animationVehicleInfo: util.wxAnimation(activeIndex === 1 ? 0 : 200, activeIndex === 1
				? 0 : 150, 'translateY', activeIndex === 1 ? 1 : 0),
			animationVehicleInfoForTrucks: util.wxAnimation(activeIndex === 1 ? 0 : 200,
				activeIndex === 1 ? 0 : -150, 'translateY', activeIndex === 1 ? 0 : 1),
			animationTransaction: animation.export()
		});
		setTimeout(() => {
			this.setData({
				btnSwitch: activeIndex === 2
			});
			animation.opacity(1).scale(1).step(); // 修改透明度,放大
			this.setData({
				animationTransaction: animation.export()
			});
		}, 300);
	},
	// 违章查询
	onClickViolationEnquiry () {
		// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
		wx.openEmbeddedMiniProgram({
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
		wx.openEmbeddedMiniProgram({
			appId: 'wx06a561655ab8f5b2', // 正式
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
		if (item?.url === 'micro_insurance_hcz') {
			this.selectComponent('#dialog1').show('micro_insurance_hcz');
			// const pageUrl = 'pages/base/redirect/index?routeKey=WEDRIVE_HIGH_JOIN&wtagid=104.210.4';
			// this.openWeiBao(pageUrl);
			return;
		}
		if (item?.url === 'micro_high_speed') {
			this.selectComponent('#dialog1').show('micro_high_speed');
			// const pageUrl = 'pages/base/redirect/index?routeKey=ETC_RESCUE&wtagid=W389.13.1';
			// this.openWeiBao(pageUrl);
			return;
		}
		if (item?.url === 'xiaoepinpin') {
			this.selectComponent('#dialog1').show('xiaoepinpin');
			// const pageUrl = 'pages/base/redirect/index?routeKey=WEDRIVE_HIGH_JOIN&wtagid=104.210.4';
			// this.openXiaoEPinPin(pageUrl);
		}
		// @cyl
		if (item?.url === 'moving_integral') {
			this.selectComponent('#dialog1').show('moving_integral');
		}
	},
	openXiaoEPinPin () {
		wx.navigateToMiniProgram({
			appId: 'wxf6f29613766abce4',
			path: 'pages/sub-packages/ug/pages/landing-pages/index?themeid=1076&channelid=1&skuid=4843521&&configid=60a78267536306017756bdd0&relatedSpuId=291058&adid=0617sjht_etc_xcx_5810_R',
			success () {},
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
	// 自动登录
	login () {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: async (res) => {
				const result = await util.getDataFromServersV2(
					'consumer/member/common/applet/code', {
						platformId: app.globalData.platformId, // 平台id
						code: res.code // 从微信获取的code
					});
				this.initDadi();
				if (!result) return;
				if (result.code === 0) {
					result.data['showMobilePhone'] = util.mobilePhoneReplace(result.data
						.mobilePhone);
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
						util.getMemberStatus();
						if (app.globalData.salesmanScanCodeToHandleId) {
							await this.bindOrder();
						} else {
							// if (!app.globalData.bankCardInfo?.accountNo) await util.getV2BankId();
							await util.getMemberStatus();
							if (app.globalData.isSignUpImmediately) {
								app.globalData.isSignUpImmediately = false;
								await this.getStatus(true);
							} else {
								await this.getStatus();
							}
							await this.getIsShowNotice();
						}
					} else {
						this.selectComponent('#agreement-dialog').show();
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
	initDadi () {
		this.data.entranceList[1].isShow = !app.globalData.isContinentInsurance;
		this.data.entranceList[2].isShow = app.globalData.isContinentInsurance;
		this.data.bannerList.map(item => {
			item.statisticsEvent === 'index_dadi' ? item.isShow = app.globalData.isContinentInsurance && !app.globalData.isPingAn : item.isShow = !app.globalData.isContinentInsurance && !app.globalData.isPingAn;
			item.alwaysShow ? item.isShow = true : '';
		});
		this.setData({
			isNormalProcess: !app.globalData.isContinentInsurance,
			isContinentInsurance: app.globalData.isContinentInsurance,
			entranceList: this.data.entranceList,
			bannerList: this.data.bannerList
		});
	},
	// 点击tab栏下的办理
	onClickTransaction () {
		if (this.data.activeIndex !== 1) return;
		app.globalData.orderInfo.orderId = '';
		wx.uma.trackEvent(this.data.activeIndex === 1 ? 'index_for_passenger_car_entrance'
			: 'index_for_truck_entrance');
		util.go(`/pages/${this.data.activeIndex === 1 ? 'default' : 'truck_handling'}/index/index?isMain=true`);
	},
	// 业务员端订单码绑定订单
	async bindOrder () {
		const result = await util.getDataFromServersV2('consumer/member/bind-order', {
			orderId: app.globalData.salesmanScanCodeToHandleId
		});
		if (!result) return;
		if (result.code === 0) {
			app.globalData.salesmanScanCodeToHandleId = undefined; // 处理返回首页再次请求
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
					await util.getMemberStatus();
					// if (!app.globalData.bankCardInfo?.accountNo) await util.getV2BankId();
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
		return dataArray.sort(function (a, b) {
			if (b.lastOpTime && a.lastOpTime) {
				return Date.parse(b.lastOpTime.replace(/-/g, '/')) - Date.parse(a.lastOpTime.replace(/-/g, '/'));
			}
		});
	},
	// 防抖
	fangDou (fn, time) {
		let that = this;
		return (function () {
			if (that.data.timeout) {
				clearTimeout(that.data.timeout);
			}
			that.data.timeout = setTimeout(() => {
				fn.apply(this, arguments);
			}, time);
		})();
	},
	// 获取ETC信息
	async getStatus (isToMasterQuery) {
		let params = {
			openId: app.globalData.openId
		};
		if (isToMasterQuery) params['toMasterQuery'] = true; // 直接查询主库
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', params);
		const icbcv2 = await util.getDataFromServersV2('consumer/member/icbcv2/getV2BankId'); // 查卡是否有二通类户
		// 订单展示优先级: 扣款失败账单>已解约状态>按最近时间顺序：办理状态or账单记录
		if (!result) return;
		if (result.code === 0) {
			const list = this.sortDataArray(result.data);
			list.forEach(res => {
				res.icbcv2 = icbcv2.data;
			});
			app.globalData.myEtcList = list;
			// 京东客服
			let [truckList, passengerCarList, vehicleList, activationOrder, activationTruckOrder, truckActivationOrderList] = [
				[],
				[],
				[],
				[],
				[],
				[]
			];
			// let [vehicleList, activationOrder, activationTruckOrder] = [[], [], []];
			app.globalData.ownerServiceArrearsList = list.filter(item => item.paySkipParams !==
				undefined); // 筛选车主服务欠费
			// 判断是否权益券额用户
			app.globalData.isEquityRights = list.filter(item => item.pledgeType === 4 && item.pledgeStatus === 1).length > 0;
			list.map(item => {
				item['selfStatus'] = item.isNewTrucks === 1 ? util.getTruckHandlingStatus(item)
					: util.getStatus(item);
				vehicleList.push(item.vehPlates);
				wx.setStorageSync('cars', vehicleList.join('、'));
				if (item.shopId === '692062170707394560') { // 大地商户
					app.globalData.isContinentInsurance = true;
				}
				if (item.shopId === '568113867222155299') { // 平安商户
					app.globalData.isPingAn = true;
				}
				if (item.isNewTrucks === 0) {
					passengerCarList.push(item);
					if (item.obuStatus === 1 || item.obuStatus === 5) {
						activationOrder.push(item
							.obuCardType);
					}
				}
				if (item.isNewTrucks === 1) {
					truckList.push(item);
					if (item.obuStatus === 1 || item.obuStatus === 5) {
						activationTruckOrder.push(item.obuCardType);
						truckActivationOrderList.push(item.id);
					}
				}
				// if (item.orderType === 11 && item.logisticsId === 0 && item.auditStatus === 2) {
				// 	const dates = this.data.date.getDate();
				// 	if (wx.getStorageSync('time') !== dates || !wx.getStorageSync('time')) {
				// 		this.fangDou(function () {
				// 			wx.setStorage({
				// 				key: 'time',
				// 				data: dates
				// 			});
				// 			util.alert({
				// 				title: `提示`,
				// 				content: `受疫情封控影响，设备预计七个工作日内陆续发货。带来不便，敬请谅解。`,
				// 				showCancel: false,
				// 				cancelText: '取消',
				// 				confirmText: '确定'
				// 			});
				// 		}, 500);
				// 	}
				// }
			});
			this.initDadi();
			const isWaitActivation = passengerCarList.find(item => item.auditStatus === 2 && item.logisticsId === 0 && item.obuStatus === 0); // 待激活
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
			const terminationOrder = passengerCarList.find(item => item.selfStatus === 1); // 查询客车第一条解约订单
			const terminationTruckOrder = truckList.find(item => item.selfStatus === 1); // 查询货车第一条解约订单
			const isAllActivation = activationOrder.length === passengerCarList
				.length; // 是否客车全是激活订单 - true: 展示账单单状态
			const isAllActivationTruck = activationTruckOrder.length === truckList
				.length; // 是否货车全是激活订单 - true: 展示账单单状态
			activationOrder = [...new Set(activationOrder)];
			activationTruckOrder = [...new Set(activationTruckOrder)];
			// 是否全是激活订单  是 - 拉取第一条订单  否 - 过滤激活订单,拉取第一条
			const passengerCarListNotActivation = isAllActivation ? passengerCarList[0] : passengerCarList
				.filter(item => item.selfStatus !== 12)[0];
			const passengerCarListNotTruckActivation = isAllActivationTruck ? truckList[0] : truckList
				.filter(item => item.selfStatus !== 12)[0];
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
			app.globalData.truckLicensePlate = passengerCarListNotActivation ? passengerCarListNotActivation
				.vehPlates : ''; // 存货车出牌
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
			this.selectComponent('#agreement-dialog').show();
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
		return dataArray.sort(function (a, b) {
			return Date.parse(b.addTime.replace(/-/g, '/')) - Date.parse(a.addTime.replace(/-/g, '/'));
		});
	},
	// 查询已补缴车牌
	async getPaymentVeh (item, etcMoney, etcTrucksMoney) {
		if (item.includes(21)) this.remove(item, 21); // 暂不查货车
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
		let [paymentOrder, paymentVeh] = [
			[],
			[]
		];
		app.globalData.myEtcList.map(item => {
			result.data.map(it => {
				if (it === item.vehPlates && item.contractVersion === 'v3') {
					paymentOrder.push(item.id);
					paymentVeh.push(item.vehPlates);
				}
			});
		});
		this.setData({
			paymentOrder
		});
		this.vehicleInfoAlert(etcMoney, etcTrucksMoney, paymentVeh.join('、'));
	},
	// 删除方法
	remove (array, val) {
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
			this.remove(item, 21); // 暂不查货车
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
		await this.getPaymentVeh(item, result.data.totalAmout, etcTrucksMoney);
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
			let arrearageOrder = list.find(item => item.deductStatus === 2); // 查询第一条欠费订单
			this.setData({
				isTruckArrearage: !!arrearageOrder,
				recentlyTheTruckBill: arrearageOrder || this.data.recentlyTheTruckBillList[0]
			});
		} else { // 客车账单
			const list = this.sortBillArray(this.data.recentlyTheBillList);
			let arrearageOrder = list.find(item => item.deductStatus === 2); // 查询第一条欠费订单
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
				recentlyTheBillInfo: this.data.activeIndex === 1 ? (this.data.recentlyTheBill ||
					false) : (this.data.recentlyTheTruckBill || false)
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
		// 请尽快补缴欠款
		if (money) {
			this.selectComponent('#popTipComp').show({
				type: 'three',
				title: '请尽快补缴欠款',
				btnCancel: '取消',
				btnconfirm: '立刻补缴',
				btnShadowHide: true,
				params: {
					money: money,
					isTruck: isTruck
				}
			});
			// util.alertPayment(money, isTruck);
			return;
		}
		// 解约
		let orderInfo = this.data.isTerminationTruck ? this.data.truckOrderInfo : this.data.passengerCarOrderInfo;
		this.selectComponent('#popTipComp').show({
			type: 'four',
			title: '无法正常扣款',
			content: '检测到你已解除车主服务签约，将影响正常的高速通行',
			btnCancel: '取消',
			btnconfirm: '恢复签约',
			params: {
				orderInfo: orderInfo
			}
		});
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
		util.go(
			`/pages/personal_center/order_details/order_details?id=${model.id}&channel=${model.channel}&month=${model.month}`
		);
	},
	// 弹窗确认回调
	onHandle (e) {
		if (e.detail.orderInfo) {
			// 恢复签约
			app.globalData.orderInfo.orderId = e.detail.orderInfo.id;
			wx.uma.trackEvent('index_for_dialog_signing');
			this.onClickBackToSign(e.detail.orderInfo);
			return;
		}
		wx.uma.trackEvent('index_for_arrears_bill');
		util.go('/pages/personal_center/arrears_bill/arrears_bill');
	},
	// 点击车辆信息
	onClickVehicle () {
		console.log(this.data.activeIndex, '==============这里应是2===================');
		const orderInfo = this.data.activeIndex === 1 ? this.data.passengerCarOrderInfo : this.data.truckOrderInfo;
		if (!orderInfo) {
			app.globalData.orderInfo.orderId = '';
			wx.uma.trackEvent(this.data.activeIndex === 1 ? 'index_for_new_deal_with' : 'index_for_truck_new_deal_with');
			const url = this.data.activeIndex === 1 ? '/pages/default/receiving_address/receiving_address' : '/pages/default/trucks/trucks';
			util.go(url);
			return;
		}
		if (orderInfo.isNewTrucks === 1 && orderInfo.status !== 1) {
			util.showToastNoIcon('货车办理系统升级中，暂时不可申办');
			return;
		}
		if (orderInfo.orderType === 51 && orderInfo.status !== 1) {
			util.showToastNoIcon('请返回原渠道办理');
			return;
		}
		app.globalData.orderInfo.orderId = orderInfo.id;
		app.globalData.processFlowVersion = orderInfo.flowVersion;
		app.globalData.truckLicensePlate = orderInfo.vehPlates;
		const fun = {
			1: () => this.onClickBackToSign(orderInfo), // 恢复签约
			2: () => this.onClickContinueHandle(orderInfo), // 继续办理
			3: () => this.goPayment(orderInfo), // 去支付
			4: () => this.onClickContinueHandle(orderInfo), // 继续办理
			5: () => this.onClickBackToSign(orderInfo), // 签约微信支付 - 去签约
			6: () => this.onClickViewProcessingProgressHandle(orderInfo), // 订单排队审核中 - 查看进度
			7: () => this.onClickModifiedData(orderInfo, true), // 修改资料 - 上传证件页
			8: () => this.onClickViewProcessingProgressHandle(orderInfo), // 不可办理
			9: () => this.onClickHighSpeedSigning(orderInfo), // 去签约
			10: () => this.onClickViewProcessingProgressHandle(orderInfo), // 查看进度
			11: () => this.onClickCctivate(orderInfo), // 去激活
			13: () => this.goBindingAccount(orderInfo), // 去开户
			14: () => this.goRechargeAuthorization(orderInfo), // 去授权预充保证金
			15: () => this.goRecharge(orderInfo), // 保证金预充失败 - 去预充
			16: () => this.goBindingWithholding(orderInfo), // 选装-未已绑定车辆代扣
			17: () => this.onClickViewProcessingProgressHandle(orderInfo), // 去预充(预充流程)-查看进度
			18: () => this.onTollWithholding(orderInfo), // 代扣通行费
			19: () => this.onClickModifiedData(orderInfo, false),
			20: () => this.onClickVerification(orderInfo),
			21: () => this.onClickSignBank(orderInfo),
			22: () => this.onClickSignTongTongQuan(orderInfo), // 签约通通券代扣
			23: () => this.goPayment(orderInfo)
		};
		fun[orderInfo.selfStatus].call();
	},
	// 通通券签约
	async onClickSignTongTongQuan () {
		let params = {
			orderId: app.globalData.orderInfo.orderId // 订单id
		};
		const result = await util.getDataFromServersV2('consumer/order/thirdContract', params);
		if (!result) return;
		if (result.code === 0) {
			thirdContractSigning(result.data);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 交行-去签约
	onClickSignBank (orderInfo) {
		util.go(`/pages/truck_handling/signed/signed`);
	},
	// 交行-去腾讯云核验
	onClickVerification () {
		util.go(`/pages/truck_handling/face_of_check_tips/face_of_check_tips`);
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
		util.go(
			`/pages/default/${orderInfo.orderType === 31 ? 'transition_page' : 'order_audit'}/${orderInfo.orderType === 31 ? 'transition_page' : 'order_audit'}`
		);
	},
	// 去预充
	goRecharge (orderInfo) {
		wx.uma.trackEvent('index_for_account_recharge');
		util.go(`/pages/account_management/account_recharge/account_recharge?money=${orderInfo.holdBalance}`);
	},
	// 去开户
	goBindingAccount (orderInfo) {
		wx.uma.trackEvent('index_for_binding_account');
		const path = `${orderInfo.flowVersion === 7 ? 'binding_account_bocom' : 'binding_account'}`;
		util.go(`/pages/truck_handling/${path}/${path}`);
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
		if (obj.logisticsId !== 0 || obj.obuStatus === 5 || obj.obuStatus === 1) {
			app.globalData
				.isSecondSigning = true;
		}
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
		console.log('3',result);
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
		let params = {
			orderId: obj.id, // 订单id
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
	async onClickModifiedData (orderInfo, isChange) {
		if (orderInfo.isNewTrucks === 1) {
			if (orderInfo.flowVersion === 4) {
				// 预充流程取消办理
				await this.cancelOrder(orderInfo);
				return;
			}
			// 货车办理
			wx.uma.trackEvent('index_for_truck_modified_data');
			util.go(`/pages/truck_handling/information_list/information_list?isModifiedData=${isChange}`);
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
			let removeList = ['passenger-car-id-card-back', 'passenger-car-id-card-face',
				'passenger-car-driving-license-face', 'passenger-car-driving-license-back',
				'passenger-car-headstock'
			];
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
		if (orderInfo.orderType === 31 && orderInfo.isSignTtCoupon === 1) {
			// 通通券套餐流程
			if (orderInfo.ttContractStatus === 1 && orderInfo.ttDeductStatus !== 1) {
				// 已签约通通券 & 未扣款
				util.go('/pages/default/payment_fail/payment_fail');
				return;
			}
			util.go(
				`/pages/default/package_the_rights_and_interests/package_the_rights_and_interests?contractStatus=${orderInfo.contractStatus}&ttContractStatus=${orderInfo.ttContractStatus}`
			);
			return;
		}
		if (orderInfo.selfStatus === 2) {
			const result = await util.initLocationInfo(orderInfo, orderInfo.isNewTrucks === 1);
			if (!result) return;
			if (result.code) {
				util.showToastNoIcon(result.message);
				return;
			}
			wx.uma.trackEvent(orderInfo.isNewTrucks === 1 ? 'index_for_continue_to_truck_package'
				: 'index_for_continue_to_package');
			if (app.globalData.newPackagePageData.type || orderInfo.isNewTrucks === 1) {
				// 只有分对分套餐 || 只有总对总套餐
				util.go(
					`/pages/${path}/package_the_rights_and_interests/package_the_rights_and_interests?type=${app.globalData.newPackagePageData.type}`
				);
			} else {
				util.go(`/pages/${path}/choose_the_way_to_handle/choose_the_way_to_handle`);
			}
			return;
		}
		if (orderInfo.isNewTrucks === 0 && util.getHandlingType(orderInfo)) {
			util.showToastNoIcon('功能升级中,暂不支持货车/企业车辆办理');
			return;
		}
		wx.uma.trackEvent(orderInfo.isNewTrucks === 1 ? 'index_for_certificate_to_truck_package'
			: 'index_for_certificate_to_package');
		util.go(`/pages/${path}/information_list/information_list`);
	},
	/**
	 * @author cyl
	 **/
	// 获取openid函数
	getId: function (codeType, data) {
		var that = this;
		if (codeType === 0) {
			// openId
			// 如果成功拿到openid，则直接开始采集设备指纹
			that.getFp(data);
		} else if (codeType === 1) {
			// 如果拿到的是code，则需要传到后端，通过微信服务器拿到openid
			wx.request({
				url: 'https://fp.tongdun.net?' + data, // 'http://localhost'改为您服务器的url
				success: function (res) {
					// 保存user_code
					// 把openid保存到缓存中
					wx.setStorage({
						key: 'user_code',
						data: res.data
					});
					// 如果成功拿到openid，则开始采集设备指纹
					that.getFp(res.data);
				}
			});
		} else {
			// wrong
			console.log('失败');
		}
	},
	// 开始采集设备指纹，传入openid
	getFp: function (code) {
		var that = this;
		// 获取 sessionId
		app.globalData.tonDunObj.sessionId = code;
		that.fmagent.getInfo({
			page: that, // 当前页面
			openid: code,
			success: function (res) {
				// 获取 fingerprint
				app.globalData.tonDunObj.fingerprint = res;
			},
			fail: function (res) {
				console.log('fail');
			},
			complete: function (res) {}
		});
	},
	// 点击移动积分兑换ETC 高速通行券
	async btnMovingIntegral (e) {
		let num = await this.getMargin();
		if (e.detail.currentTarget.dataset.name === 'cancel') {
			console.log('点击取消');
		} else {
			if (num === app.globalData.myEtcList.length) {
				return util.showToastNoIcon('抱歉，您的ETC设备模式不符合兑换条件');
			}
			// 登记接口 获取 myOrderId
			const res1 = await util.getDataFromServersV2('consumer/member/changyou/sign');
			console.log('登记');
			console.log(res1);
			if (res1.code === '104' || res1.code === 104) {
				return util.showToastNoIcon('登记时间已过');
			}
			app.globalData.tonDunObj.myOrderId = res1.data.myOrderId;
			app.globalData.tonDunObj.orderId = res1.data.orderId;
			// 检查手机是联通还是移动，如果是联通 data 为 空
			const res3 = await util.getDataFromServersV2('consumer/member/changyou/checkPhone', {
				myOrderId: res1.data.myOrderId
			});
			console.log(' 检查手机是联通还是移动');
			console.log(res3);
			// 拦截不是移动的用户 拦截未开通此业务的省份
			// res3.data.isp = '中国联通';
			if (res3.data.isp !== '中国移动') {
				util.showToastNoIcon('本活动仅限移动用户参与');
			} else if (this.data.areaNotOpened.includes(res3.data.province)) {
				return util.showToastNoIcon('号码归属省份暂未开通此业务，敬请期待！');
			}
			const checkBind = await util.getDataFromServersV2('consumer/member/changyou/checkBindStatus', {
				fingerprint: app.globalData.tonDunObj.fingerprint,
				sessionId: app.globalData.tonDunObj.sessionId,
				myOrderId: app.globalData.tonDunObj.myOrderId
			});
			console.log('检查是否绑定');
			console.log(checkBind.data);
			app.globalData.tonDunObj.checkBindStatus = checkBind.data;
			// app.globalData.tonDunObj.checkBindStatus = true;
			this.changYouAuth();
		}
	},
	// 畅由授权
	async changYouAuth () {
		// 授权
		const authData = await util.getDataFromServersV2('consumer/member/changyou/quickAuth', {
			fingerprint: app.globalData.tonDunObj.fingerprint,
			sessionId: app.globalData.tonDunObj.sessionId,
			myOrderId: app.globalData.tonDunObj.myOrderId
		});
		console.log('授权');
		console.log(authData);
		if (authData.code !== 0) {
			app.globalData.tonDunObj.auth = false;
			util.showToastNoIcon(`${authData.message}`);
		} else if (authData.data.code !== '000000') {
			app.globalData.tonDunObj.auth = false;
			util.showToastNoIcon(`${authData.data.mesg}`);
		} else {
			app.globalData.tonDunObj.auth = true;
			if (app.globalData.tonDunObj.runFrequency++ === 1) {
				util.showToastNoIcon('已授权');
			}
		}
		// 跳转到 移动积分兑通行券 页面
		util.go('/pages/moving_integral/bound_changyou/bound_changyou');
	},
	getMargin () {
		// app.globalData.myEtcList[0].flowVersion = 2;
		let num = 0;
		app.globalData.myEtcList.map(item => {
			if (item.flowVersion === 2) {
				num++;
			}
		});
		return num;
	},
	popUp (tes) {
		console.log(tes);
		let str = this.selectComponent('#dialog1').noShow();
		if (str === 'violation_enquiry') {
			this.onClickViolationEnquiry();
		}
		if (str === 'invoice') {
			this.goMakeInvoice();
		}
		if (str === 'micro_insurance_hcz') {
			const pageUrl = 'pages/base/redirect/index?routeKey=WEDRIVE_HIGH_JOIN&wtagid=104.210.4';
			this.openWeiBao(pageUrl);
		}
		if (str === 'micro_high_speed') {
			const pageUrl = 'pages/base/redirect/index?routeKey=ETC_RESCUE&wtagid=W389.13.1';
			this.openWeiBao(pageUrl);
		}
		if (str === 'xiaoepinpin') {
			const pageUrl = 'pages/base/redirect/index?routeKey=WEDRIVE_HIGH_JOIN&wtagid=104.210.4';
			this.openXiaoEPinPin(pageUrl);
		}
		if (str === 'moving_integral') {
			this.setData({
				movingIntegralObj: {
					movingIntegralControl: true
				}
			});
			this.selectComponent('#viewProcedure').show();
		}
	},
	handleMall () {
		const url = `https://${app.globalData.test ? 'etctest' : 'etc'}.cyzl.com/${app.globalData.test ? 'etc2-html' : 'wetc'}/etc_life_rights_and_interests/index.html#/?auth=${app.globalData.userInfo.accessToken}&platformId=${app.globalData.platformId}`;
		util.go(`/pages/web/web/web?url=${encodeURIComponent(url)}`);
	}
});
