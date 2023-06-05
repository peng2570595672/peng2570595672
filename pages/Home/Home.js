import {
	thirdContractSigning
} from '../../utils/utils';

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
		userFailBillList: [], // 用户失败账单
		billStatusWidth: 0, // 账单宽度
		isAllActivation: false, // 是否客车全是激活订单
		isAllActivationTruck: false, // 是否货车全是激活订单
		isTermination: false, // 是否客车解约
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
		disclaimerDesc: app.globalData.disclaimerDesc,
		timeout: null,
		date: null,
		// 版本4.0 所需数据
		imgList: [	// 默认数据
			{
				appId: '',
				imgUrl: 'https://file.cyzl.com/g001/M01/CF/DD/oYYBAGQav3SAZ33-AAAiNjMKTNI431.png',
				jumpUrl: '/pages/etc_handle/etc_handle',
				templateId: ['']
			}
		],
		duration: 500,	// 轮播图时间间隔
		interval: 5000,	// 轮播图切换时间
		Hei: 628,	// banner默认高度
		HeiList: [],	// banner 图片高度集合
		moduleOneList: [	// 默认数据
			{	// 账单查询 通行发票 权益商城
				appId: '',
				funcDesc: '最近通行的记录',
				funcName: '账单查询',
				imgUrl: 'https://file.cyzl.com/g001/M01/CA/43/oYYBAGP8eRKAK0mDAAAg6lZHRZU754.jpg',
				isShow: true,
				jumpUrl: '/pages/personal_center/my_order/my_order',
				templateId: ['oz7msNJRXzk7VmASJsJtb2JG0rKEWjX3Ff1PIaAPa78',
					'lY047e1wk-OFdeGuIx2ThV-MOJ4aUOx2HhSxUd1YXi0', 'my5wGmuottanrIAKrEhe2LERPKx4U05oU4aK9Fyucv0'
				]
			},
			{
				appId: 'wx9040bb0d3f910004',
				funcDesc: '开高速路费发票',
				funcName: '通行发票',
				imgUrl: 'https://file.cyzl.com/g001/M01/CA/43/oYYBAGP8eSmAVDOGAAAfG-36GVE351.jpg',
				isShow: true,
				jumpUrl: 'pages/index/index',
				templateId: ['']
			},
			{
				appId: '',
				funcDesc: '免税商品上线',
				funcName: '权益商城',
				imgUrl: 'https://file.cyzl.com/g001/M01/CA/43/oYYBAGP8eT-AKA3cAAAg7GXq-Ts112.jpg',
				isShow: false,
				jumpUrl: '11111',
				templateId: ['']
			},
			{
				appId: '',
				funcDesc: '1V1专人客服',
				funcName: '在线客服',
				imgUrl: 'https://file.cyzl.com/g001/M01/CA/43/oYYBAGP8eVeADTAhAAAd33onhO0108.jpg',
				isShow: true,
				jumpUrl: '/pages/web/web/web?type=online_customer_service',
				templateId: ['']
			}
		],
		moduleTwoList: [	// 默认数据
			{
				appId: '',
				imgUrl: 'https://file.cyzl.com/g001/M01/C9/52/oYYBAGP4mXiAVfbDAAAkI9pn5Nw707.png',
				isShow: true,
				jumpUrl: 'https://h5.couponto.cn/jf_exchange/?activityListId=159294188336701440',
				templateId: ['']
			}
		],	// 出行贴心服务
		whetherToStay: false, // 用于控制显示弹窗时，最底层页面禁止不动
		isEquityRights: app.globalData.isEquityRights,	// 是否是权益券额用户
		isShowHandle: true	// 是否显示办理状态栏
	},
	async onLoad (options) {
		util.resetData();// 重置数据
		this.setData({
			date: new Date()
		});
		this.getConfiguration();
		app.globalData.isTruckHandling = false;
		app.globalData.isNeedReturnHome = false;
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		}
	},
	async onShow () {
		let pages = getCurrentPages();
		let currentPage = pages[pages.length - 1];
		if (currentPage.options?.channel) {
			app.globalData.isChannelPromotion = +currentPage.options?.channel;
		}
		util.customTabbar(this, 0);
		await this.getBackgroundConfiguration();
		if (app.globalData.userInfo.accessToken) {
			util.showLoading();
			await util.getUserIsVip();
			await util.getRightAccount();
			this.initPageParams();
			// if (app.globalData.isEquityRights) {
			// 	this.data.moduleOneList.map(item => {
			// 		item.isShow = item.title !== '在线客服';
			// 	});
			// 	this.setData({
			// 		moduleOneList: this.data.moduleOneList
			// 	});
			// } else {
			// 	this.data.moduleOneList.map(item => {
			// 		item.isShow = item.title !== '权益商城';
			// 	});
			// 	this.setData({
			// 		moduleOneList: this.data.moduleOneList
			// 	});
			// }
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
	// 获取后台配置的数据
	async getBackgroundConfiguration () {
		let res = await util.getDataFromServersV2('consumer/member/common/pageConfig/query',{
			configType: 1, // 配置类型(1:小程序首页配置;2:客车介绍页配置;3:首页公告配置;4:个人中心配置)
			pagePath: 1, // 页面路径(1:小程序首页；2：客车介绍页；)
			platformType: 4, // 小程序平台(1:ETC好车主;2:微ETC;4:ETC+)，对于多选情况，将值与对应枚举值做与运算，结果为1则包含该选项。
			channel: `${app.globalData.isChannelPromotion}`, // 渠道(0:所有渠道;)
			affectArea: '0' // 面向区域(0:全国)
		});
		// console.log('后台数据：',res);
		if (!res) return;
		if (res.code === 0) {
			let data = res.data.contentConfig;	// 数据
			// 当前时间不在限定时间内，不往下执行
			if (!util.isDuringDate(res.data.affectStartTime, res.data.affectEndTime)) {
				// 获取的数据不符合是使用默认数据来展示
				return;
			}
			// 首页 banner 轮播图 模块
			let interval = data.rotationChartConfig.interval * 1000;	// 轮播图间隔时间
			let bannerList = data.rotationChartConfig.rotationCharts.filter(item => util.isDuringDate(item.affectStartTime, item.affectEndTime));	// 过滤掉当前时间不在规定时间内的数据，得到合格的数据
			bannerList.sort(this.compare('sort'));	// 排序

			// 账单、权益、发票、在线 模块
			let funcListOne = data.importantFuncConfig.funcs.filter(item => util.isDuringDate(item.affectStartTime, item.affectEndTime));
			// visibleUser: 1-普通用户 2-ETC+PLUS用户(百二权益用户) 3-权益券额用户 组合判断,如[1,2,3]->表示全部可见
			funcListOne.map(item => {
				let arr1 = item.visibleUser;
				// item.isShow = arr1.length === 3 ? true : (arr1.indexOf(2) !== -1 && app.globalData.isVip) ? true : (arr1.indexOf(3) !== -1 && app.globalData.isEquityRights > 0) ? true : (arr1.indexOf(1) !== -1 && !app.globalData.isVip && app.globalData.isEquityRights === 0) ? true : false;
				// 2% 暂时不判断
				item.isShow = arr1.length === 3 ? true : (arr1.indexOf(3) !== -1 && app.globalData.isEquityRights > 0) ? true : (arr1.indexOf(1) !== -1 && Number(!!app.globalData.isEquityRights) === 0) ? true : false;
			});
			funcListOne.sort(this.compare('sort'));	// 排序

			// 出行贴心服务 模块
			let funcListTwo = data.outServiceFuncConfig.funcs.filter(item => util.isDuringDate(item.affectStartTime, item.affectEndTime));
			funcListTwo.sort(this.compare('sort'));	// 排序
			this.setData({
				interval,
				imgList: bannerList,
				moduleOneList: funcListOne,
				moduleTwoList: funcListTwo
			});
		}
	},
	// 获取公告配置的数据
	async getConfiguration () {
		let res = await util.getDataFromServersV2('consumer/member/common/pageConfig/query',{
			configType: 3, // 配置类型(1:小程序首页配置;2:客车介绍页配置;3:首页公告配置;4:个人中心配置)
			pagePath: 1, // 页面路径(1:小程序首页；2：客车介绍页；)
			platformType: 4, // 小程序平台(1:ETC好车主;2:微ETC;4:ETC+)，对于多选情况，将值与对应枚举值做与运算，结果为1则包含该选项。
			channel: 0, // 渠道(0:所有渠道;)
			affectArea: '0' // 面向区域(0:全国)
		});
		if (!res) return;
		if (res.code === 0) {
			let list = res.data.contentConfig?.notifyConfig?.popUp;	// 数据
			// 当前时间不在限定时间内，不往下执行
			if (!util.isDuringDate(res.data.affectStartTime, res.data.affectEndTime)) {
				// 获取的数据不符合是使用默认数据来展示
				wx.removeStorageSync('alert-notice-text');
				wx.removeStorageSync('alert-notice-img');
				wx.removeStorageSync('alert-notice-today');
				return;
			}
			// 记录修改时间,要是已经修改过了,先移除缓存,避免修改后不生效
			let noticeEditTime = wx.getStorageSync('alert-notice-edit-time');
			if (noticeEditTime && res.data.lastOpTime !== noticeEditTime) {
				wx.removeStorageSync('alert-notice-text');
				wx.removeStorageSync('alert-notice-img');
				wx.removeStorageSync('alert-notice-today');
			} else {
				wx.setStorageSync('alert-notice-edit-time', res.data.lastOpTime);
			}
			// popUpType 1-图片  2-文字
			// popUpRule 1-每日首次进入弹出一次 2-每次进入弹出一次 3-公告生效时间进入弹出一次
			let newList = [];
			list.map(item => {
				if (util.isDuringDate(item.affectStartTime, item.affectEndTime)) {
					newList.push(item);
				}
			});
			if (newList.length) {
				if (newList.length > 1) {
					// 文字弹窗展示在最上层
					const imgObj = newList.find(item => item.popUpType === 1);
					const textObj = newList.find(item => item.popUpType === 2);
					this.initNoticeMask(imgObj);
					setTimeout(() => {
						this.initNoticeMask(textObj);
					}, 100);
				} else {
					const obj = newList[0];
					this.initNoticeMask(obj);
				}
			}
		}
	},
	initNoticeMask (obj) {
		// popUpRule 1-每日首次进入弹出一次 2-每次进入弹出一次 3-公告生效时间进入弹出一次
		switch (obj.popUpRule) {
			case 1:
				this.initNoticeTodayMask(obj);
				break;
			case 2:
				if (obj.popUpType === 1 && !app.globalData.alertNotice.imgAlert) {
					app.globalData.alertNotice.imgAlert = 1;
					// 图片弹窗
					this.selectComponent('#noticeImgDialog').show(obj);
				} else if (obj.popUpType === 2 && !app.globalData.alertNotice.textAlert) {
					app.globalData.alertNotice.textAlert = 1;
					this.selectComponent('#noticeDialog').show(obj);
				}
				break;
			case 3:
				let noticeText = wx.getStorageSync('alert-notice-text');
				let noticeImg = wx.getStorageSync('alert-notice-img');
				if (obj.popUpType === 1 && !noticeImg) {
					// 图片弹窗
					wx.setStorageSync('alert-notice-img', 1);
					this.selectComponent('#noticeImgDialog').show(obj);
				} else if (obj.popUpType === 2 && !noticeText) {
					wx.setStorageSync('alert-notice-text', 1);
					this.selectComponent('#noticeDialog').show(obj);
				}
				break;
		}
	},
	initNoticeTodayMask (obj) {
		let time = new Date().toLocaleDateString();
		let that = this;
		// 首先获取是否执行过
		wx.getStorage({
			key: 'alert-notice-today',
			success: function (res) {
				// 成功的话 说明之前执行过，再判断时间是否是当天
				if (res.data && res.data !== time) {
					wx.setStorageSync('alert-notice-today', time);
					if (obj.popUpType === 1) {
						// 图片弹窗
						that.selectComponent('#noticeImgDialog').show(obj);
					} else {
						that.selectComponent('#noticeDialog').show(obj);
					}
				}
			},
			fail: function (res) {
				// 没有执行过的话 先存一下当前的执行时间
				if (obj.popUpType === 1) {
					// 图片弹窗
					that.selectComponent('#noticeImgDialog').show(obj);
				} else {
					that.selectComponent('#noticeDialog').show(obj);
				}
				wx.setStorageSync('alert-notice-today', time);
			}
		});
	},
	// 排序
	compare (prop) {
		return function (obj1, obj2) {
			const val1 = +obj1[prop];
			const val2 = +obj2[prop];
			if (val1 < val2) {
				return -1;
			} else if (val1 > val2) {
				return 1;
			} else {
				return 0;
			}
		};
	},
	// 图片自适应
	imgH (e) {
		const winWid = wx.getSystemInfoSync().windowWidth; // 获取当前屏幕的宽度
		const imgh = e.detail.height; // 图片高度
		const imgw = e.detail.width;
		let swiperH = (winWid * imgh / imgw) * 2; // 等比设置swiper的高度。  即 屏幕宽度 / swiper高度 = 图片宽度 / 图片高度    ==》swiper高度 = 屏幕宽度 * 图片高度 / 图片宽度
		this.data.HeiList.push(swiperH);
		swiperH = Math.max(...this.data.HeiList);	// 获取最大的值
		this.setData({
			Hei: swiperH + 'rpx' // 设置高度
		});
	},
	onHandleNotice (info) {
		const obj = {
			currentTarget: {
				dataset: {
					information: info.detail
				}
			}
		};
		this.goPath(obj);
	},
	// 跳转页面、小程序、第三方
	goPath (e) {
		// 未登录
		// if (!app.globalData.userInfo?.accessToken) {
		// 	wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
		// 	util.go('/pages/login/login/login');
		// 	return;
		// }
		let obj = e.currentTarget.dataset.information;
		let appIdPath = Boolean(obj.appId && obj.appId.length > 0);
		let webPath = obj.jumpUrl.indexOf('https') !== -1;
		let templateId = obj.templateId && obj.templateId[0] !== '';
		if (obj.funcName === '权益商城') {
			this.handleMall();
			return;
		}
		console.log(appIdPath);
		console.log(webPath);
		if (!appIdPath && !webPath) {
			// 小程序内部页面跳转
			if (templateId) {
				// 订阅消息
				util.subscribe(obj.templateId, obj.jumpUrl);
				return;
			}
			if (obj.jumpUrl.indexOf('/pages/etc_handle/etc_handle') !== -1 || obj.jumpUrl.indexOf('pages/my/index') !== -1) {
				wx.reLaunch({
					url: `${obj.jumpUrl}`
				});
				return;
			}
			util.go(`${obj.jumpUrl}`);
			return;
		}
		// 免责弹窗声明
		this.selectComponent('#dialog1').show({params: obj});
	},
	backFunc () {
		let obj = this.selectComponent('#dialog1').noShow().params;
		console.log(obj);
		let appIdPath = obj.appId && obj.appId.length > 0;
		let webPath = obj.jumpUrl.indexOf('https') !== -1;
		if (appIdPath) {
			// 跳转到另一个小程序
			wx.navigateToMiniProgram({
				appId: obj.appId,
				path: obj.jumpUrl,
				envVersion: 'release',
				fail () {
					util.showToastNoIcon('调起小程序失败, 请重试！');
				}
			});
			return;
		}
		if (webPath) {
			// 跳转 h5
			util.go(`/pages/web/web/web?url=${encodeURIComponent(obj.jumpUrl)}`);
		}
	},
	// -------------------end--------------

	// banner触摸移动返回
	catchtouchmove () {},
	// 点击banner
	// testFunc () {
	// 	// 未登录
	// 	if (!app.globalData.userInfo?.accessToken) {
	// 		wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
	// 		util.go('/pages/login/login/login');
	// 		return;
	// 	}
	// 	wx.reLaunch({
	// 		url: '/pages/etc_handle/etc_handle'
	// 	});
	// },
	// 获取 “出行贴心服务” banner
	// async getBanner () {
	// 	let params = {
	// 		platformId: app.globalData.platformId
	// 	};
	// 	const result = await util.getDataFromServersV2('consumer/system/common/get-activity-banner', params,'POST',false);
	// 	if (result.code === 0) {
	// 		let moduleTwoList = result.data.filter(item => (item.remark === 'moving_integral'));
	// 		moduleTwoList.map(item => {
	// 			if (item.remark === 'moving_integral') {
	// 				item.url = item.remark;
	// 				item.isShow = true;
	// 				item.alwaysShow = true;
	// 				item.imgUrl = 'https://file.cyzl.com/g001/M01/C9/52/oYYBAGP4mXiAVfbDAAAkI9pn5Nw707.png';
	// 				item.statisticsEvent = 'index_moving_integral';
	// 			}
	// 		});
	// 		this.setData({
	// 			moduleTwoList
	// 		});
	// 	}
	// },

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
		let statistics = e.currentTarget.dataset.statistics;
		wx.uma.trackEvent(statistics);
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
		// if (url === 'my_order') {
		// 	// 统计点击进入我的ETC账单
		// 	util.go(`/pages/personal_center/${url}/${url}`);
		// 	return;
		// }

		// 订阅:高速扣费通知、ETC欠费提醒、黑名单状态提醒
		let urls = `/pages/personal_center/${url}/${url}?isMain=true`;
		let tmplIds = ['oz7msNJRXzk7VmASJsJtb2JG0rKEWjX3Ff1PIaAPa78',
			'lY047e1wk-OFdeGuIx2ThV-MOJ4aUOx2HhSxUd1YXi0', 'my5wGmuottanrIAKrEhe2LERPKx4U05oU4aK9Fyucv0'
		];
		util.subscribe(tmplIds, urls);
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
					}, 'POST', false);
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
						await util.getUserIsVip();
						await util.getRightAccount();
						this.initPageParams();
						// 查询最后一笔订单状态
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
						util.hideLoading();
						this.selectComponent('#agreement-dialog').show();
					}
				} else {
					util.hideLoading();
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
		}, 'POST', false);
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
			}, 'POST', false);
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
				await util.getUserIsVip();
				await util.getRightAccount();
				await this.getBackgroundConfiguration();
				this.initPageParams();
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
	initPageParams () {
		if (app.globalData.isEquityRights) {
			this.data.moduleOneList.map(item => {
				item.isShow = item.funcName !== '在线客服';
			});
			this.setData({
				moduleOneList: this.data.moduleOneList
			});
		} else {
			this.data.moduleOneList.map(item => {
				item.isShow = item.funcName !== '权益商城';
			});
			this.setData({
				moduleOneList: this.data.moduleOneList
			});
		}
	},
	// 分享
	onShareAppMessage () {
		return {
			title: 'ETC一键申办，无需储值，包邮到家',
			imageUrl: 'https://file.cyzl.com/g001/M01/CB/5E/oYYBAGQAaeyASw5fAABJbg74uSk558.png',
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
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', params,'POST', false);
		const icbcv2 = await util.getDataFromServersV2('consumer/member/icbcv2/getV2BankId', {}, 'POST', false); // 查卡是否有二通类户
		// 订单展示优先级: 扣款失败账单>已解约状态>按最近时间顺序：办理状态or账单记录
		util.hideLoading();
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
			app.globalData.ownerServiceArrearsList = list.filter(item => item.paySkipParams !== undefined); // 筛选车主服务欠费
			this.setData({
				isShowHandle: list.filter(item => item.obuStatus !== 1 && item.obuStatus !== 2 && item.obuStatus !== 5).length > 0
			});
			console.log('订单列表：',list);
			list.map(item => {
				item['selfStatus'] = item.isNewTrucks === 1 ? util.getTruckHandlingStatus(item) : util.getStatus(item);
				// 设备状态 0-待激活，1-已激活，2-已注销  3-开卡 4-发签 5预激活
				if (item.obuStatus === 3 || item.obuStatus === 4) {
					item['selfStatus'] = 11;
				}
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
						activationOrder.push(item.obuCardType);
					}
				}
				if (item.isNewTrucks === 1) {
					truckList.push(item);
					if (item.obuStatus === 1 || item.obuStatus === 5) {
						activationTruckOrder.push(item.obuCardType);
						truckActivationOrderList.push(item.id);
					}
				}
				// 已激活的蒙通卡 并且2023年5月1号之前办理的订单 拉起弹窗
				if ((item.obuStatus === 1 || item.obuStatus === 5) && item.obuCardType === 2 && !app.globalData.isShowDeviceUpgradePop && app.globalData.deviceUpgrade.addTime) {
					this.fangDou(() => {
						this.selectComponent('#popTipComp').show({
							type: 'six',
							title: '设备升级',
							url: 'https://file.cyzl.com/g001/M01/E0/77/oYYBAGRsakaAdzCdAADVgiHZnGM391.png'
						});
					},500);
				}
			});
			this.initDadi();
			const isWaitActivation = passengerCarList.find(item => item.logisticsId === 0); // 待发货
			const isDuringDate = util.isDuringDate('2023/3/9', '2023/3/16');
			const isAlertPrompt = wx.getStorageSync('is-alert-prompt20230309');
			if ((isWaitActivation || !list.length) && isDuringDate && !isAlertPrompt) {
				wx.setStorageSync('is-alert-prompt20230309', true);
				util.alert({
					title: `提示`,
					content: '尊敬的ETC用户：' + '\r\n' + '感谢您办理我司ETC，受ETC发货地快递管控影响，自3月9日至3月15日期间在线申办的订单，设备将统一在3月16日后陆续发货，由此给您带来的不便，敬请谅解！',
					showCancel: false,
					cancelText: '取消',
					confirmText: '我知道了'
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
			this.selectComponent('#agreement-dialog').show();
		} else {
			util.showToastNoIcon(result.message);
		}
		util.hideLoading();
	},
	// 预充模式-查询预充信息
	async getQueryProcessInfo (id) {
		const result = await util.getDataFromServersV2('consumer/order/third/queryProcessInfo', {
			orderId: id
		}, 'POST', false);
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
		}, 'POST', false);
		util.hideLoading();
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
			}, 'POST', false);
			if (!info) return;
			if (info.code) {
				util.showToastNoIcon(info.message);
				return;
			}
			etcTrucksMoney = info.data.etcMoney;
		}
		const result = await util.getDataFromServersV2('consumer/etc/judge-detail-channels', {
			channels: item
		}, 'POST', false);
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
			return;
		}
		util.hideLoading();
		if (!result.data) return;
		await this.getPaymentVeh(item, result.data.totalAmout, etcTrucksMoney);
	},
	// 查询最近一次账单
	async getRecentlyTheBill (item, isTruck = false) {
		const result = await util.getDataFromServersV2('consumer/etc/get-fail-bill', {
			channel: item
		}, 'POST', false);
		util.hideLoading();
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
			this.setData({
				userFailBillList: this.data.userFailBillList.concat(result.data)
			});
		}
		if (this.data.needRequestBillNum === (this.data.requestBillTruckNum + this.data.requestBillNum)) {
			// 查询账单已结束
			console.log('-----查询账单已结束-------');
			const list = this.sortBillArray(this.data.userFailBillList);
			this.setData({
				userFailBillList: list
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
		}, 'POST', false);
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
		let model = this.data.userFailBillList[0];
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
		app.globalData.isCheckCarChargeType = orderInfo.obuCardType === 1 && (orderInfo.orderType === 11 || orderInfo.orderType === 71 || orderInfo.promoterType === 41) && orderInfo.auditStatus === 0;
		if (orderInfo.orderType === 31 && orderInfo.status === 0) {
			util.alert({
				title: '提示',
				content: '当前订单无法修改，请联系业务员或在线客服处理！',
				confirmText: '我知道了',
				confirm: () => {
				}
			});
			return;
		}
		if ((orderInfo.orderType === 31 && orderInfo.pledgeStatus === 0) || (orderInfo.orderType === 51 && orderInfo.contractStatus !== 1)) {
			// 业务员端办理 & 待支付
			if (orderInfo.isShowRightsDesc === 1 && ((orderInfo.isNeedSign === 1 && (!orderInfo.userSign || !orderInfo.verifyCode)) || orderInfo.isNeedSign === 0)) {
				// 需要查看权益
				util.go(`/pages/default/statement_of_interest/statement_of_interest?isNeedSign=${orderInfo.isNeedSign}&orderType=${orderInfo.orderType}`);
				return;
			}
		}
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
			11: () => this.onClickViewProcessingProgressHandle(orderInfo), // 去激活
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
			23: () => this.goPayment(orderInfo),
			24: () => this.goPayment(orderInfo), // 去支付
			25: () => this.onClickContinueHandle(orderInfo), // 继续办理
			26: () => this.onClickViewProcessingProgressHandle(orderInfo) // 订单排队审核中 - 查看进度
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
		// if (orderInfo.protocolStatus === 0) {
		// 	this.goPayment(orderInfo);
		// 	return;
		// }
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
		if (orderInfo.promoterType === 41 && orderInfo.vehPlates.length === 11) {	// 业务员空发
			util.go(`/pages/empty_hair/empty_package/empty_package?shopProductId=${orderInfo.shopProductId}`);
			return;
		}
		if (orderInfo.selfStatus === 24) {	// 设备升级
			util.go(`/pages/device_upgrade/package/package?orderId=${orderInfo.id}`);
			return;
		}
		const path = orderInfo.isNewTrucks === 1 ? 'truck_handling' : 'default';
		wx.uma.trackEvent(orderInfo.isNewTrucks === 1 ? 'index_for_truck_package' : 'index_for_package');
		util.go(`/pages/${path}/package_the_rights_and_interests/package_the_rights_and_interests`);
	},
	// 恢复签约
	async onClickBackToSign (obj) {
		// if (obj.orderType === 31 && obj.protocolStatus === 0) {
		// 	const path = obj.isNewTrucks === 1 ? 'truck_handling' : 'default';
		// 	util.go(`/pages/${path}/package_the_rights_and_interests/package_the_rights_and_interests`);
		// 	return;
		// }
		if ((obj.shopProductId === app.globalData.cictBankObj.citicBankshopProductId || obj.shopProductId === app.globalData.cictBankObj.citicBankShopshopProductId) && !obj.contractStatus) {
			util.go(`/pages/default/citic_bank_sign/citic_bank_sign`);
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
		app.globalData.orderInfo.orderId = obj.id;
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
			this.handleActivate(orderInfo);
		}
	},
	// 确认收货
	async confirmReceipt (orderInfo) {
		const result = await util.getDataFromServersV2('consumer/order/affirm-take-obu', {
			logisticsId: orderInfo.logisticsId
		});
		if (!result) return;
		if (result.code === 0) {
			this.handleActivate(orderInfo);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	handleActivate (obj) {
		wx.setStorageSync('baseInfo', {
			orderId: obj.id,
			mobilePhone: app.globalData.userInfo.mobilePhone,
			channel: obj.obuCardType,
			qtLimit: '',// 青通卡激活所需,暂未写
			serverId: obj.shopId,
			carNoStr: obj.vehPlates,
			obuStatus: obj.obuStatus
		});
		// ETC卡信息 1-贵州黔通卡 2-内蒙古蒙通卡 3-山东鲁通卡 4-青海青通卡 5-天津速通卡 6-陕西三秦通卡 7-广东粤通卡 8-辽宁辽通卡 9-齐鲁高速鲁通卡 10-湘通卡
		if (obj.obuCardType === 10) {
			util.go(`/pages/obu_activate/neimeng_choice/neimeng_choice?obuCardType=${obj.obuCardType}`);
			return;
		}
		if (obj.obuCardType === 2) {
			if (!this.data.choiceEquipment) {
				this.setData({
					choiceEquipment: this.selectComponent('#choiceEquipment')
				});
			}
			this.data.choiceEquipment.switchDisplay(true);
			return;
		}
		// 打开的小程序版本， develop（开发版），trial（体验版），release（正式版）
		wx.navigateToMiniProgram({
			appId: 'wxdda17150b8e50bc4',
			path: 'pages/index/index',
			envVersion: 'release', // 目前联调为体验版
			fail () {
				util.showToastNoIcon('调起激活小程序失败, 请重试！');
			}
		});
	},
	onClickTranslucentHandle () {
		this.data.choiceEquipment.switchDisplay(false);
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
		if (orderInfo.selfStatus === 25) {	// 设备升级
			util.go(`/pages/device_upgrade/fill_in_information/fill_in_information?orderId=${orderInfo.id}`);
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
		if (orderInfo.promoterType === 41 && orderInfo.vehPlates.length === 11) {	// 业务员空发
			util.go(`/pages/empty_hair/write_base_information/write_base_information`);
			return;
		}
		if (orderInfo.orderType === 71 && orderInfo.vehPlates && !orderInfo.isOwner && orderInfo?.pledgeStatus !== 1) {	// 电商空发订单
			util.go(`/pages/${path}/package_the_rights_and_interests/package_the_rights_and_interests?emptyHairOrder=true`);
			return;
		}
		wx.uma.trackEvent(orderInfo.isNewTrucks === 1 ? 'index_for_certificate_to_truck_package'
			: 'index_for_certificate_to_package');
		util.go(`/pages/${path}/information_list/information_list`);
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
			util.go(`/pages/web/web/web?type=moving_integral`);	// 点击积分兑换跳转我方积分兑换
		}
	},
	handleMall () {
		// util.go(`/pages/personal_center/equity_mall/equity_mall`);
		// return;
		if (app.globalData.accountList.length === 1) {
			this.handleAccount();
			return;
		}
		util.go(`/pages/personal_center/choice_vehicle/choice_vehicle`);
	},
	async handleAccount () {
		const item = app.globalData.accountList[0];
		const result = await util.getDataFromServersV2('/consumer/order/walfare/noPassLogin', {
			accountId: item.id
		});
		console.log(result);
		if (result.code) {
			util.showToastNoIcon(result.message);
		} else {
			if (result.data?.data?.path) {
				util.go(`/pages/web/web/web?url=${encodeURIComponent(result.data.data.path)}`);
			} else {
				util.showToastNoIcon(result.data?.message || '未获取到跳转地址');
			}
		}
	}
});
