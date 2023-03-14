// pages/my/index.js
import { compareDate, jumpCouponMini } from '../../utils/utils.js';
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
			{icon: '',title: '在线客服',url: 'online_customer_service',img: 'https://file.cyzl.com/g001/M01/CA/14/oYYBAGP8O5WAfXwSAAAOCAtM_x0245.svg'},
			// {icon: '',title: '手机号管理',url: '',img: ''},   //本期先隐藏该项，暂不做功能
			{icon: '',title: '发票助手',url: 'invoice_assistant',img: 'https://file.cyzl.com/g001/M01/CA/14/oYYBAGP8OrKABB0VAAAMgE_4pJ8510.svg'},
			{icon: '',title: '相关协议',url: 'user_agreement',img: 'https://file.cyzl.com/g001/M01/CA/14/oYYBAGP8OzyAWjMrAAAI3O0L414758.svg'}
		],
		myAccountList: [],
		height: undefined, // 屏幕高度
		userInfo: undefined, // 用户信息
		mobilePhoneSystem: false,
		isMain: false,// 是否从主流程进入
		mobilePhone: undefined,
		disclaimerDesc: app.globalData.disclaimerDesc,
		initData: true,
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
		this.setData({
			cardList: [],
			nextPageData: []
		});
		// 4.0
		util.customTabbar(this, 2);
		await this.getUserProfiles();
		// --------------end------------
		if (app.globalData.userInfo.accessToken) {
			let requestList = [await util.getUserIsVip(),await this.getRightAccount(), await util.getMemberStatus(), await this.getRightsPackageBuyRecords()];
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
				isVip: app.globalData.isVip
			});
			if (JSON.stringify(app.globalData.myEtcList) !== '{}') {
				// 查询是否欠款
				await util.getIsArrearage();
			}
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
		await this.getUserProfiles();
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
			this.setData({
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
	handleCouponMini () {
		this.selectComponent('#dialog1').show();
		// jumpCouponMini();
	},
	// 免责弹窗
	popUp () {
		this.selectComponent('#dialog1').noShow();
		jumpCouponMini();
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
							requestList = [await util.getUserIsVip(),await this.getStatus()];
						}
						this.setData({
							isVip: app.globalData.isVip,
							myAccountList: app.globalData.myEtcList
						});
						requestList = [requestList, await this.getRightAccount(), await util.getMemberStatus(), await this.getRightsPackageBuyRecords()];
						util.showLoading();
						await Promise.all(requestList);
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
						util.go('/pages/login/login/login');
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
	// 获取订单信息
	async getStatus () {
		let params = {
			openId: app.globalData.openId
		};
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', params, 'POST', false);
		if (result.code === 0) {
			app.globalData.myEtcList = result.data;
			this.setData({
				myAccountList: result.data
			});
			// 查询是否欠款
			await util.getIsArrearage();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	handleMall () {
		util.go(`/pages/personal_center/equity_mall/equity_mall`);
		return;
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
		wx.uma.trackEvent(urlObj[url]);
		util.go(`/pages/personal_center/${url}/${url}`);
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
		this.setData({
			userInfo: {
				avatarUrl: personInformation.avatarUrl ? personInformation.avatarUrl : app.globalData.isVip ? yesVip : noVip,
				nickName: personInformation.nicheng ? personInformation.nicheng : 'E+车主'
			},
			isShowEquityImg: !!(app.globalData.isVip || app.globalData.isEquityRights)
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
