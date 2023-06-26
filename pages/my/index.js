// pages/my/index.js
import {compare, compareDate, jumpCouponMini} from '../../utils/utils.js';
const util = require('../../utils/util.js');
const app = getApp();
Page({
	data: {
		testImg: 'https://file.cyzl.com/g001/M00/B7/CF/oYYBAGO_qS-ASZFtAABBq9PjXMc834.png',	// 测试所用的图片和icon
		funcList: [
			{
				icon: 'https://file.cyzl.com/g001/M01/C9/1D/oYYBAGP4OlOADWQKAAWyyaAG1H4541.svg',
				iconVip: 'https://file.cyzl.com/g001/M01/CA/15/oYYBAGP8PBKAcu-ZAAWzoBj0ITE404.svg',
				title: '我的订单',
				url: 'order_triage'},
			{
				icon: 'https://file.cyzl.com/g001/M01/C9/1D/oYYBAGP4OiaAdN9gAAWMTPzu62k488.svg',
				iconVip: 'https://file.cyzl.com/g001/M01/CA/15/oYYBAGP8PC2ALTVSAAWM7dN3bB8663.svg',
				title: '通行流水',
				url: 'my_order'},
			{
				icon: 'https://file.cyzl.com/g001/M01/C9/1D/oYYBAGP4OaGAJ-ImAAWmhyqdgxo977.svg',
				iconVip: 'https://file.cyzl.com/g001/M01/CA/15/oYYBAGP8PEGAFTPWAAWnPpy3j-o653.svg',
				title: '领券中心',
				url: 'coupon_redemption_centre'},
			{
				icon: 'https://file.cyzl.com/g001/M01/C9/1D/oYYBAGP4OnaANbE3AAWZBnVW83M524.svg',
				iconVip: 'https://file.cyzl.com/g001/M01/CA/15/oYYBAGP8PFCAQBrdAAWZ9FCgDIw288.svg',
				title: '帮助中心',
				url: 'help_center'
			}
		],
		funcList2: [
			{icon: '', title: '通通券',url: 'tonTonQuan',img: 'https://file.cyzl.com/g001/M01/CF/5F/oYYBAGQXvWyAcN7sAAC9paTs3nM581.png',show: false},
			{icon: '',title: '在线客服',url: 'online_customer_service',img: 'https://file.cyzl.com/g001/M01/CA/14/oYYBAGP8O5WAfXwSAAAOCAtM_x0245.svg',show: true},
			// {icon: '',title: '手机号管理',url: '',img: ''},   //本期先隐藏该项，暂不做功能
			{icon: '',title: '发票助手',url: 'invoice_assistant',img: 'https://file.cyzl.com/g001/M01/CA/14/oYYBAGP8OrKABB0VAAAMgE_4pJ8510.svg',show: true},
			{icon: '',title: '相关协议',url: 'user_agreement',img: 'https://file.cyzl.com/g001/M01/CA/14/oYYBAGP8OzyAWjMrAAAI3O0L414758.svg',show: true}
		],
		myAccountList: [],
		height: undefined, // 屏幕高度
		userInfo: undefined, // 用户信息
		mobilePhoneSystem: false,
		isMain: false,// 是否从主流程进入
		mobilePhone: undefined,
		disclaimerDesc: app.globalData.disclaimerDesc,
		initData: true,
		interval: 0,
		isCheckTwoPercent: 0,// 是否是百二某批数据标识
		showCarousel: false,
		carouselList: [],
		cardList: [],
		accountList: [],
		isShowEquityImg: false,	// 是否显示权益商城banner
		nextPageData: []
	},

	async onLoad (options) {
		app.globalData.orderInfo.orderId = '';
		if (options.isMain) {
			this.setData({
				isMain: options.isMain
			});
		}
		this.setData({
			isVip: app.globalData.isVip
		});
	},
	async onShow () {
		// 4.0
		util.customTabbar(this, 2);
		this.setData({
			cardList: [],
			nextPageData: []
		});
		// --------------end------------
		if (app.globalData.userInfo.accessToken) {
			this.setData({
				mobilePhone: app.globalData.mobilePhone
			});
			if (JSON.stringify(app.globalData.myEtcList) !== '{}') {
				// 查询是否欠款
				await util.getIsArrearage();
			}
			util.showLoading();
			let requestList = [await this.getCheckTwoPercent(), await this.getUserProfiles(), await this.conditionalDisplay(), await util.getUserIsVip(),await this.getRightAccount(), await util.getMemberStatus(), await this.getRightsPackageBuyRecords()];
			util.customTabbar(this, 2);
			util.getUserIsVip();
			util.showLoading();
			await Promise.all(requestList);
			util.hideLoading();
			if (this.data.cardList.length > 1) {
				this.setData({
					cardList: this.data.cardList.concat(this.data.cardList),
					nextPageData: this.data.cardList.concat(this.data.cardList)
				});
			}
			this.setData({
				mobilePhone: app.globalData.mobilePhone,
				isVip: app.globalData.isVip
			});
			this.getBackgroundConfiguration();
		} else {
			// 公众号进入需要登录
			this.login();
		}
		this.setData({
			mobilePhoneSystem: app.globalData.mobilePhoneSystem,
			mobilePhone: app.globalData.mobilePhone,
			screenHeight: wx.getSystemInfoSync().windowHeight,
			isVip: app.globalData.isVip
		});
	},
	// 获取后台配置的数据
	async getBackgroundConfiguration () {
		let res = await util.getDataFromServersV2('consumer/member/common/pageConfig/query',{
			configType: 4, // 配置类型(1:小程序首页配置;2:客车介绍页配置;3:首页公告配置;4:个人中心配置)
			pagePath: 4, // 页面路径(1:小程序首页；2：客车介绍页；)
			platformType: 4, // 小程序平台(1:ETC好车主;2:微ETC;4:ETC+)，对于多选情况，将值与对应枚举值做与运算，结果为1则包含该选项。
			affectArea: '0', // 面向区域(0:全国)
			channel: '0'
		});
		// console.log('个人中心后台数据：',res);
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
			let deviceUpgrade = app.globalData.myEtcList.filter(item => (item.obuStatus === 1 || item.obuStatus === 5) && item.obuCardType === 2 && util.timeComparison(app.globalData.deviceUpgrade.addTime, item.addTime) === 2 && item?.contractVersion !== 'v3');
			if (deviceUpgrade.length === 0) bannerList = bannerList.filter(item => !item.jumpUrl.includes('device_upgrade'));
			bannerList.sort(compare('sort'));	// 排序
			bannerList.map(item => {
				item.isShow = true;
			});
			this.setData({
				interval,
				showCarousel: bannerList.length > 0,
				carouselList: bannerList
			});
		}
	},
	// 根据条件展示相关功能
	async conditionalDisplay () {
		let params = {
			openId: app.globalData.openId
		};
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', params, 'POST', false);
		if (!result) return;
		if (result.code === 0) {
			app.globalData.myEtcList = result.data;
			let flag = result.data.filter(item => item.isSignTtCoupon === 1 && item.pledgeStatus === 1 && item.status !== -1 && item.obuStatus !== 2);
			// 展示通通券
			this.setData({
				myAccountList: app.globalData.myEtcList,
				'funcList2[0].show': flag.length > 0
			});
		}
	},
	cardChange (e) {
		if (e.detail.index === 3 && this.data.cardList.length === 6) {
			util.go('/pages/account_management/index/index');
		}
	},
	// 获取权益账户
	// 权益>货车预充值>交行>工行  账户最多显示3个
	async getRightAccount () {
		const result = await util.getDataFromServersV2('/consumer/member/right/account', {
			page: 1,
			pageSize: 1
		}, 'POST', false);
		if (result.code) {
			util.showToastNoIcon(result.message);
		} else {
			result.data.map(item => {
				item.accountType = 1;// 1-权益账户   2-货车预充值 3-交行 4-工行
			});
			app.globalData.accountList = result.data;
			app.globalData.isEquityRights = result.data?.length;
			this.data.carouselList.map(item => {
				item.isShow = true;
			});
			if (!result.data?.length) {
				this.data.carouselList.map((item, index) => {
					if (item.jumpUrl === '权益商城') {
						item.isShow = false;
					}
				});
			}
			const index = this.data.carouselList.findIndex(item => item.isShow);
			this.setData({
				showCarousel: index !== -1,
				carouselList: this.data.carouselList,
				isShowEquityImg: result.data?.length,
				cardList: result.data,
				accountList: result.data,
				nextPageData: result.data
			});
			if (result.data.length < 3) {
				// 获取预充值的
				const etcList = app.globalData.myEtcList.filter(item => item.flowVersion === 4 && item.auditStatus === 2); // 是否有预充流程 & 已审核通过订单
				etcList.map(async (item, index) => {
					this.getQueryWallet(item, index === etcList.length - 1);
				});
			}
		}
	},
	// 预充模式-账户信息查询
	async getQueryWallet (item, isRequestCompletion) {
		const result = await util.getDataFromServersV2('consumer/order/third/queryWallet', {
			orderId: item.id,
			pageSize: 1
		}, 'POST', false);
		console.log('货车数据：',result);
		if (!result) return;
		if (result.code === 0) {
			if (this.data.cardList.length < 3) {
				result.data.vehPlates = item.vehPlates;
				result.data.orderId = item.id;
				result.data.accountType = 2;
				this.data.cardList = this.data.cardList.concat(result.data);
				this.setData({
					cardList: this.data.cardList,
					nextPageData: this.data.nextPageData
				});
				if (isRequestCompletion && this.data.cardList.length < 3) {
					// 获取交行
					const bocomEtcList = app.globalData.myEtcList.filter(item => item.flowVersion === 7 && item.auditStatus === 2); // 是否有交行二类户 & 已审核通过订单
					bocomEtcList.map(async (item, index) => {
						await this.getBocomOrderBankConfigInfo(item, index === bocomEtcList.length - 1);
					});
				}
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 交行二类户查询
	async getBocomOrderBankConfigInfo (orderInfo, isRequestCompletion) {
		// 获取订单银行配置信息
		const result = await util.getDataFromServersV2('/consumer/member/bcm/queryBalance', {
			orderId: orderInfo.id,
			cardType: '01'
		}, 'POST', false);
		if (result.code) {
			util.showToastNoIcon(result.message);
		} else {
			if (this.data.cardList.length < 3) {
				let info;
				if (app.globalData.memberStatusInfo?.accountList.length) {
					info = app.globalData.memberStatusInfo.accountList.find(accountItem => accountItem.orderId === orderInfo.id);
				}
				result.data.vehPlates = orderInfo.vehPlates;
				result.data.accountType = 3;
				result.data.id = orderInfo.id;
				result.data.accountNo = info.accountNo;
				this.data.cardList.push(result.data);
				this.setData({
					cardList: this.data.cardList,
					nextPageData: this.data.nextPageData
				});
			}
		}
	},
	// 通行权益金查询
	async getCurrentEquity () {
		let params = {
			page: this.data.page,
			pageSize: 10
		};
		const result = await util.getDataFromServersV2('/consumer/member/depositAccount/pageList', params);
		console.log(result);
		if (!result) return;
		if (result.code) {
			util.showToastNoIcon(result.message);
		}
	},
	// 获取加购权益包订单列表
	async getRightsPackageBuyRecords () {
		const result = await util.getDataFromServersV2('consumer/voucher/rights/add-buy-record', {
			platformId: app.globalData.platformId
		}, 'POST', false);
		if (result.code === 0) {
			if (result?.data) {
				let res = result?.data;
				this.setData({
					rightsPackageBuyRecords: res
				});
				app.globalData.rightsPackageBuyRecords = res;
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 自动登录
	login (isData) {
		util.showLoading();
		// 调用微信接口获取code
		wx.login({
			success: async (res) => {
				const result = await util.getDataFromServersV2('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: res.code // 从微信获取的code
				}, 'POST', false);
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
						this.setData({
							mobilePhone: result.data.mobilePhone
						});
						let requestList = [];
						if (JSON.stringify(app.globalData.myEtcList) === '{}') {
							requestList = [await this.getCheckTwoPercent(), await this.getUserProfiles(), await this.conditionalDisplay(), await util.getUserIsVip()];
						}
						this.setData({
							isVip: app.globalData.isVip,
							myAccountList: app.globalData.myEtcList
						});
						requestList = [requestList, await this.getRightAccount(), await util.getMemberStatus(), await this.getRightsPackageBuyRecords()];
						util.showLoading();
						await Promise.all(requestList);
						this.getBackgroundConfiguration();
						util.hideLoading();
						if (this.data.cardList.length > 1) {
							this.setData({
								cardList: this.data.cardList.concat(this.data.cardList),
								nextPageData: this.data.cardList.concat(this.data.cardList)
							});
						}
					} else {
						util.hideLoading();
						wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
						// util.go('/pages/login/login/login');
					}
				} else {
					util.hideLoading();
					util.showToastNoIcon(result.message);
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	// 获取是否是百二某批数据标识
	async getCheckTwoPercent () {
		const result = await util.getDataFromServersV2('consumer/order/check-two-percent', {
			platformId: app.globalData.platformId
		}, 'POST', false);
		if (result.code === 0) {
			if (result?.data) {
				this.setData({
					isCheckTwoPercent: Number(result.data)
				});
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	handleSwiperItem (e) {
		console.log(e.currentTarget.dataset.index);
		const index = +e.currentTarget.dataset.index;
		const item = this.data.carouselList[index];
		if (item.jumpUrl === '权益商城') {
			this.handleMall();
			return;
		}
		let appIdPath = item.appId && item.appId.length > 0;
		let webPath = item.jumpUrl.indexOf('https') !== -1;
		if (!appIdPath && !webPath) {
			// 小程序内部页面跳转
			if (item.jumpUrl.indexOf('/pages/etc_handle/etc_handle') || item.jumpUrl.indexOf('pages/my/index')) {
				wx.reLaunch({
					url: `${item.jumpUrl}`
				});
				return;
			}
			util.go(`${item.jumpUrl}`);
		}
		if (appIdPath) {
			// 跳转到另一个小程序
			wx.navigateToMiniProgram({
				appId: item.appId,
				path: item.jumpUrl,
				envVersion: 'release',
				fail () {
					util.showToastNoIcon('调起小程序失败, 请重试！');
				}
			});
			return;
		}
		if (webPath) {
			util.go(`/pages/web/web/web?url=${encodeURIComponent(item.jumpUrl)}`);
		}
	},
	handleMall () {
		// util.go(`/pages/personal_center/equity_mall/equity_mall`);
		// return;
		if (this.data.accountList.length === 1) {
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
	},
	handleAuth () {
		wx.openSetting({
			success: () => {},
			fail: () => {
				util.showToastNoIcon('打开设置界面失败，请重试！');
			}
		});
	},
	// 跳转
	async go (e) {
		// 未登录
		if (!app.globalData.userInfo?.accessToken) {
			util.go('/pages/login/login/login');
			return;
		}
		let that = this;
		let url = e.currentTarget.dataset['url'];
		if (url === 'online_customer_service') {
			// 统计点击进入在线客服
			this.fangDou(() => {
				util.go(`/pages/web/web/web?type=${url}`);
			},1000);
			return;
		}
		if (url === 'life_service') {
			wx.uma.trackEvent('personal_center_for_life_service');
			this.showDetail(1);
			return;
		}
		const urlObj = {
			'the_owner_service': 'personal_center_owner_service',
			'my_etc': 'personal_center_my_etc',
			'my_order': 'personal_center_my_order',
			'service_card_voucher': 'personal_center_service_card_voucher',
			'help_center': 'personal_center_help_center',
			'coupon_redemption_centre': 'personal_center_coupon_redemption_centre',
			'characteristic_service': 'personal_center_characteristic_service',
			'service_purchase_record': 'personal_center_service_purchase_record'
		};
		if (url === 'description_of_equity') {
			util.go(`/pages/personal_center/${url}/${url}?isVip=${that.data.isVip}`);
			return;
		}
		if (url === 'tonTonQuan') {	// 跳转通通券
			this.selectComponent('#dialog1').show('tonTonQuan');
			return;
		}
		wx.uma.trackEvent(urlObj[url]);
		util.go(`/pages/personal_center/${url}/${url}?isCheckTwoPercent=${this.data.isCheckTwoPercent}`);
	},
	// 免责弹窗
	popUp () {
		// 未登录
		if (!app.globalData.userInfo?.accessToken) {
			wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
			util.go('/pages/login/login/login');
			return;
		}
		let url = this.selectComponent('#dialog1').noShow();
		if (url === 'tonTonQuan') {	// 跳转通通券
			jumpCouponMini();
		}
	},
	onClickAccountManagement () {
		wx.uma.trackEvent('personal_center_for_account_management');
		util.go('/pages/account_management/index/index');
	},
	// 扫码
	scan () {
		util.showLoading({ title: '正在识别' });
		// 统计点击事件
		wx.uma.trackEvent('personal_center_for_scan');
		// 只允许从相机扫码
		wx.scanCode({
			onlyFromCamera: true,
			success: async (res) => {
				let key = res.result.match(/(\S*)=/);
				let val = res.result.match(/=(\S*)/);
				if (key && val && key[1] && (val[1].length === 18 || val[1].length === 19) && key[1] === 'orderId') {
					const result = await util.getDataFromServersV2('consumer/member/bind-order', {
						orderId: val[1]
					}, 'POST', false);
					if (result.code === 0) {
						app.globalData.orderInfo.orderId = val[1];
						util.go('/pages/personal_center/my_etc_detail/my_etc_detail');
					} else {
						util.showToastNoIcon(result.message);
					}
				} else {
					util.hideLoading();
					util.showToastNoIcon('不支持的数据格式');
				}
			},
			fail: (res) => {
				if (res.errMsg !== 'scanCode:fail cancel') {
					util.showToastNoIcon('扫码失败');
				}
			}
		});
	},
	// 监听返回按钮
	onClickBackHandle () {
		if (this.data.isMain) {
			wx.navigateBack({
				delta: 1
			});
		} else {
			wx.switchTab({
				url: '/pages/Home/Home'
			});
		}
	},
	// ------------------------------------------------------------------------------------------------------
	// 获取头像和昵称
	getUserProfiles () {
		let personInformation = wx.getStorageSync('person_information');
		let noVip = 'https://file.cyzl.com/g001/M01/C8/3F/oYYBAGP0VgGAQa01AAAG5Ng7rok991.svg';
		let yesVip = 'https://file.cyzl.com/g001/M01/C8/3F/oYYBAGP0VdeAZ2uZAAAG57UJ39U085.svg';
		this.data.carouselList.map(item => {
			item.isShow = true;
		});
		if (!app.globalData.isEquityRights) {
			this.data.carouselList.map(item => {
				if (item.jumpUrl === '权益商城') {
					item.isShow = false;
				}
			});
		}
		const index = this.data.carouselList.findIndex(item => item.isShow);
		this.setData({
			showCarousel: index !== -1,
			carouselList: this.data.carouselList,
			userInfo: {
				avatarUrl: personInformation.avatarUrl ? personInformation.avatarUrl : app.globalData.isVip ? yesVip : noVip,
				nickName: personInformation.nicheng ? personInformation.nicheng : 'E+车主'
			},
			isShowEquityImg: app.globalData.isEquityRights
		});
	},
	// 前往个人信息
	goUserInfo () {
		let that = this;
		util.go(`/pages/personal_center/personal_information/personal_information?isVip=${that.data.isVip}`);
	},
	// 防止点击重复触发
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
	// 分享
	onShareAppMessage () {
		return {
			title: 'ETC一键申办，无需储值，包邮到家',
			imageUrl: 'https://file.cyzl.com/g001/M01/CB/5E/oYYBAGQAaeyASw5fAABJbg74uSk558.png',
			path: '/pages/my/index'
		};
	}
});
