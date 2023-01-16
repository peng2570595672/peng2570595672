import { compareDate, jumpCouponMini } from '../../../utils/utils.js';
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		isClickNotice: false, // 是否点击过广告位
		isShowNotice: false, // 是否显示广告位
		isAttention: 0, // 关注状态 1-已关注，0-未关注
		height: undefined, // 屏幕高度
		userInfo: undefined, // 用户信息
		mobilePhoneSystem: false,
		isMain: false,// 是否从主流程进入
		crowdSourcingMsg: undefined,// 众包信息
		mobilePhone: undefined,
		showDetailWrapper: false,
		showDetailMask: false,
		showAgreementWrapper: false,
		isNeedShowAgreement: false,
		isAgreement: false,
		isShowHelpCenterUpdate: false,
		showPublicAccountType: 0,// 0 关注公众号  1 影音
		isActivation: false, // 是否有激活车辆
		isOpenTheCard: true, // 是否开通三类户
		isShowFeatureService: false, // 是否显示特色服务
		isShowCoupon: false, // 是否显示通通券入口
		hasCoupon: false, // 是否显示领券中心
		isActivityDate: false, // 是否活动期间
		canIUseGetUserProfile: false,
		isPrechargeOrder: true, // 是否有预充流程 || 交行二类户 || 工行二类户  & 已审核通过订单
		disclaimerDesc: app.globalData.disclaimerDesc,
		isShowEquityImg: false	// 是否显示权益商城banner
	},
	onLoad (options) {
		if (wx.getUserProfile) {
			this.setData({
				canIUseGetUserProfile: true
			});
		}
		app.globalData.orderInfo.orderId = '';
		if (options.isMain) {
			this.setData({
				isMain: options.isMain
			});
		}
	},
	async onShow () {
		if (app.globalData.userInfo.accessToken) {
			// if (!app.globalData.bankCardInfo?.accountNo) await this.getV2BankId();
			let requestList = [await util.getMemberStatus(), await this.getMemberBenefits(), await this.queryProtocolRecord(), await this.getIsShowNotice(), await this.queryHelpCenterRecord(), await this.getMemberCrowdSourcingAndOrder(), await this.getRightsPackageBuyRecords(), await this.getHasCoupon(), await this.getPrechargeOrders()];
			util.showLoading();
			await Promise.all(requestList);
			util.hideLoading();
			let that = this;
			wx.getSetting({
				success (res) {
					if (res.authSetting['scope.userInfo']) {
						// 已经授权，可以直接调用 getUserInfo 获取头像昵称
						wx.getUserInfo({
							success: function (res) {
								that.setData({
									userInfo: res.userInfo
								});
								that.submitUserInfo(res);
							}
						});
					}
				}
			});
			if (JSON.stringify(app.globalData.myEtcList) !== '{}') {
				this.getIsShow();
			}
		} else {
			// 公众号进入需要登录
			this.login();
		}
		this.setData({
			isActivityDate: util.isDuringDate('2021/6/25 11:00', '2021/6/28 15:00'),
			mobilePhoneSystem: app.globalData.mobilePhoneSystem,
			mobilePhone: app.globalData.mobilePhone,
			screenHeight: wx.getSystemInfoSync().windowHeight
		});
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
	// 勾选用户协议
	onClickChangeAgreement () {
		this.setData({
			isAgreement: true
		});
	},
	// 跳转用户协议
	onCLickGoAgreement () {
		util.go('/pages/default/free_equipment_agreement/free_equipment_agreement');
	},
	// 同意用户协议
	async onClickSubmit () {
		if (!this.data.isAgreement) {
			util.showToastNoIcon('请阅读并同意相关协议');
			return;
		}
		const result = await util.addProtocolRecord(1);
		if (result) {
			this.setData({
				showAgreementWrapper: false
			});
			setTimeout(() => {
				this.setData({
					showAgreementWrapper: false
				});
			}, 400);
		}
	},
	// 查询是否提交用户协议
	async queryProtocolRecord () {
		const result = await util.queryProtocolRecord(1);
		this.setData({
			isNeedShowAgreement: !result
		});
	},
	// 查询是否提交独立权益包入口触发事件
	async getIsShowNotice () {
		const result = await util.queryProtocolRecord(2);
		this.setData({
			isClickNotice: result
		});
	},
	// 点击广告位
	async onClickNotice () {
		if (!this.data.isClickNotice) await util.addProtocolRecord(2);
		wx.uma.trackEvent('personal_center_for_purchase_coupons');
		util.go('/pages/separate_interest_package/index/index');
	},
	// 查询是否更新帮助中心
	async queryHelpCenterRecord () {
		const result = await util.queryProtocolRecord(5);
		this.setData({
			isShowHelpCenterUpdate: !result
		});
	},
	// 是否显示领券中心
	async getHasCoupon () {
		const result = await util.getDataFromServersV2('consumer/voucher/rights/has-coupon', {
			platformId: app.globalData.platformId
		});
		if (result.code === 0) {
			this.setData({
				hasCoupon: !!result.data
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 获取加购权益包订单列表
	async getRightsPackageBuyRecords () {
		const result = await util.getDataFromServersV2('consumer/voucher/rights/add-buy-record', {
			platformId: app.globalData.platformId
		});
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
				});
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
							requestList = [await this.getStatus(), await this.getPrechargeOrders()];
						}
						// if (!app.globalData.bankCardInfo?.accountNo) await this.getV2BankId();
						requestList = [requestList, await util.getMemberStatus(), await this.getMemberBenefits(), await this.queryProtocolRecord(), await this.getIsShowNotice(), await this.queryHelpCenterRecord(), await this.getMemberCrowdSourcingAndOrder(), await this.getRightsPackageBuyRecords(), await this.getHasCoupon()];
						if (isData) {
							requestList.push(await this.submitUserInfo(isData));
						}
						util.showLoading();
						await Promise.all(requestList);
						util.hideLoading();
					} else {
						wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
						util.go('/pages/login/login/login');
						util.hideLoading();
					}
				} else {
					util.showToastNoIcon(result.message);
				}
			},
			fail: () => {
				util.hideLoading();
				util.showToastNoIcon('登录失败！');
			}
		});
	},
	// 获取二类户号信息
	async getV2BankId () {
		// if (!app.globalData.bankCardInfo?.accountNo) await util.getV2BankId();
		// this.setData({
		// 	isOpenTheCard: !!app.globalData.bankCardInfo?.accountNo
		// });
	},
	// 获取订单信息
	async getStatus () {
		let params = {
			openId: app.globalData.openId
		};
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', params);
		if (result.code === 0) {
			app.globalData.myEtcList = result.data;
			await this.getIsShow();
		} else {
			util.showToastNoIcon(result.message);
		}
		console.log(app.globalData.myEtcList);
	},
	// 获取是否有预充账户
	async getPrechargeOrders () {
		let params = {
			openId: app.globalData.openId
		};
		const result = await util.getDataFromServersV2('consumer/order/member/precharge/orders', params);
		if (result.code === 0) {
			this.setData({
				isShowEquityImg: result.data.isShow
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async getIsShow () {
		let isActivation = app.globalData.myEtcList.filter(item => (item.obuStatus === 1 || item.obuStatus === 5) && (item.obuCardType === 1 || item.obuCardType === 21 || item.obuCardType === 22)); // 1 已激活  2 恢复订单  5 预激活
		let isNewOrder = app.globalData.myEtcList.findIndex(item => compareDate(item.addTime, '2021-07-14') === true); // 当前用户有办理订单且订单创建日期在2021年7月13日前（含7月13日）
		let isShowFeatureService = app.globalData.myEtcList.findIndex(item => item.isShowFeatureService === 1 && (item.obuStatus === 1 || item.obuStatus === 5)); // 是否有特色服务
		let isPrechargeOrder = app.globalData.myEtcList.findIndex(item => ((item.flowVersion === 6 || item.flowVersion === 4 || item.flowVersion === 7) && item.auditStatus === 2) || (item.pledgeType === 4 && (item.pledgeStatus === 1 || item.pledgeStatus === 2)) || (item.orderType === 51 && (item.obuStatus === 1 || item.obuStatus === 2 || item.obuStatus === 5))); // 是否有预充流程 & 已审核通过订单 & 已支付的押金模式
		let isShowCoupon = app.globalData.myEtcList.findIndex(item => (item.isSignTtCoupon === 1 && item.ttContractStatus !== 0)); // 通通券 存在签约或解约
		let flag = app.globalData.myEtcList.findIndex(item => ((item.pledgeType === 4 && (item.pledgeStatus === 1 || item.pledgeStatus === 2) && item.platformId !== '568113867222155288' && item.platformId !== '500338116821778436') || (item.orderType === 51 && (item.obuStatus === 1 || item.obuStatus === 2 || item.obuStatus === 5))));
		this.setData({
			isShowNotice: !!app.globalData.myEtcList.length,
			isShowFeatureService: isShowFeatureService !== -1,
			isPrechargeOrder: isPrechargeOrder !== -1,
			showAgreementWrapper: isNewOrder !== -1,
			isShowCoupon: isShowCoupon !== -1,
			isActivation: !!isActivation.length
		});
		// 查询是否欠款
		await util.getIsArrearage();
	},
	handleMall () {
		util.go(`/pages/personal_center/equity_mall/equity_mall`);
	},
	// 众包-获取用户推广码和订单红包数量
	async getMemberCrowdSourcingAndOrder () {
		const result = await util.getDataFromServersV2('consumer/member/getMemberCrowdSourcingAndOrder', {});
		if (result.code === 0) {
			// status - 0 未成为推广者，1-已经是推广者，8-活动已经结束
			app.globalData.crowdsourcingServiceProvidersId = result.data.shopId;
			this.setData({
				crowdSourcingMsg: result.data
			});
		} else {
			util.showToastNoIcon(result.message);
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
	// 邀请好友
	inviteFriends () {
		app.globalData.crowdsourcingServiceProvidersId = '753646562833342464';// 测试
		util.go('/pages/crowdsourcing/index/index');
	},
	// 邀请办理-获取用户信息
	getUserInfo () {
		wx.uma.trackEvent('personal_center_for_getuserinfo');
		util.showLoading({ title: '加载中' });
		let that2 = this; // 解决作用域问题
		wx.getSetting({
			success (res) {
				if (!res.authSetting['scope.userInfo']) {
					wx.authorize({
						scope: 'scope.userInfo',
						success () {
						}
					});
				} else {
					wx.getUserInfo({
						success: res => {
							util.hideLoading();
							console.log(res);
							app.globalData.crowdsourcingUserInfo = res.userInfo;
							// 父组件必须有 canvas
							that2.selectComponent('#crowdsourcingPrompt').show();
						}
					});
				}
				util.hideLoading();
			}
		});
	},
	cancelHandle () {
		this.selectComponent('#crowdsourcingPrompt').hide();
	},
	// 分享好友
	onShareAppMessage () {
		wx.uma.trackEvent('personal_center_applet_sharing');
		if (this.data.crowdSourcingMsg.status !== 1) return;
		return {
			title: '好友邀你领取ETC',
			imageUrl: '/pages/personal_center/assets/share.png',
			path: `/pages/crowdsourcing/new_user/new_user?shopId=${app.globalData.crowdsourcingServiceProvidersId}&memberId=${app.globalData.memberId}`
		};
	},
	async submitUserInfo (user) {
		let params = {
			encryptedData: user.encryptedData,
			iv: user.iv
		};
		const result = await util.getDataFromServersV2('consumer/member/applet/update-user-info', params);
		if (result.code) util.showToastNoIcon(result.message);
	},
	// 获取会员信息
	async getMemberBenefits () {
		const result = await util.getDataFromServersV2('consumer/member/member-status', {});
		if (result.code === 0) {
			this.setData({
				isAttention: result.data.attentionStatus
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	getUserProfile (e) {
		wx.getUserProfile({
			desc: '用于完善用户资料',
			success: (res) => {
				this.setData({
					userInfo: res.userInfo
				});
				if (res.userInfo) {
					this.submitUserInfo(res);
				}
			}
		});
	},
	bindGetUserInfo (e) {
		this.setData({
			userInfo: e.detail.userInfo
		});
		if (e.detail.userInfo) {
			this.submitUserInfo(e.detail);
		}
	},
	// 跳转
	async go (e) {
		let url = e.currentTarget.dataset['url'];
		if (url === 'online_customer_service') {
			// 统计点击进入在线客服
			util.go(`/pages/web/web/web?type=${url}`);
			return;
		}
		if (url === 'life_service') {
			wx.uma.trackEvent('personal_center_for_life_service');
			this.showDetail(1);
			return;
		}
		if (url === 'help_center' && this.data.isShowHelpCenterUpdate) await util.addProtocolRecord(5);
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
		wx.uma.trackEvent(urlObj[url]);
		util.go(`/pages/personal_center/${url}/${url}`);
	},
	onClickAccountManagement () {
		// console.log(this.getStatus());//获取订单信息
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
					});
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
	// 显示详情
	showDetail (type) {
		this.setData({
			showPublicAccountType: type,
			showDetailWrapper: true,
			showDetailMask: true
		});
	},
	// 监听返回按钮
	onClickBackHandle () {
		if (this.data.isMain) {
			wx.navigateBack({
				delta: 1
			});
		} else {
			wx.reLaunch({
				url: '/pages/Home/Home'
			});
		}
	},
	// 统计点击去关注公众号按钮
	goPublicAccount () {
		wx.uma.trackEvent('personal_center_for_follow_the_public_account');
	},
	// 关闭详情
	close () { },
	hide () {
		this.setData({
			showDetailWrapper: false
		});
		setTimeout(() => {
			this.setData({
				showDetailMask: false
			});
		}, 400);
	}
});
