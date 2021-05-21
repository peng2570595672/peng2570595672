const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		isAttention: 0, // 关注状态 1-已关注，0-未关注
		height: undefined, // 屏幕高度
		userInfo: undefined, // 用户信息
		mobilePhoneSystem: false,
		isMain: false,// 是否从主流程进入
		crowdSourcingMsg: undefined,// 众包信息
		mobilePhone: undefined,
		showDetailWrapper: false,
		showDetailMask: false,
		showPublicAccountType: 0,// 0 关注公众号  1 影音
		rightsAndInterestsVehicleList: undefined, // 权益车辆列表
		isActivation: false, // 是否有激活车辆
		isOpenTheCard: false, // 是否开通三类户
		isShowFeatureService: false, // 是否显示特色服务
		payInterest: {
			interestsList: [
				{img: 'basic_rights_and_interests', url: 'basic_rights_and_interests'},
				{img: 'coupon_redemption', url: 'collect_paid_up_interest'},
				// {img: 'led_driving_risks', url: ''},
				{img: 'life_service', url: 'life_service'}
			],
			describeList: [
				{title: '高速通行95折', subTitle: '高速通行费用享受95折起的折扣优惠'},
				{title: 'vip专属客服', subTitle: '售后专人专业解答'},
				{title: '设备延保一年', subTitle: '设备享有2年的保修服务'}
			]
		},
		canIUseGetUserProfile: false
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
	onShow () {
		if (app.globalData.userInfo.accessToken) {
			let requestList = [this.getV2BankId(), this.getMemberBenefits(), this.getMemberCrowdSourcingAndOrder(), this.getRightsPackageBuyRecords(), this.getOrderRelation()];
			Promise.all(requestList);
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
				let isActivation = app.globalData.myEtcList.filter(item => (item.obuStatus === 1 || item.obuStatus === 5) && item.obuCardType === 1); // 1 已激活  2 恢复订单  5 预激活
				this.setData({
					isActivation: !!isActivation.length
				});
			}
		} else {
			// 公众号进入需要登录
			this.login();
		}
		this.setData({
			mobilePhoneSystem: app.globalData.mobilePhoneSystem,
			mobilePhone: app.globalData.mobilePhone,
			screenHeight: wx.getSystemInfoSync().windowHeight
		});
	},
	async getOrderRelation () {
		const result = await util.getDataFromServersV2('consumer/voucher/rights/get-order-relation', {
			platformId: app.globalData.platformId
		});
		if (result.code === 0) {
			if (result.data) {
				app.globalData.rightsAndInterestsVehicleList = result.data;
				this.setData({
					rightsAndInterestsVehicleList: result.data
				});
			}
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async getRightsPackageBuyRecords () {
		const result = await util.getDataFromServersV2('consumer/order/rightsPackageBuyRecords', {
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
							requestList = [this.getStatus()];
						}
						requestList = [requestList, this.getV2BankId(), this.getMemberBenefits(), this.getMemberCrowdSourcingAndOrder(), this.getRightsPackageBuyRecords(), this.getOrderRelation()];
						if (isData) {
							requestList.push(this.submitUserInfo(isData));
						}
						Promise.all(requestList);
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
		const result = await util.getDataFromServersV2('consumer/member/icbcv2/getV2BankId');
		if (!result) return;
		if (result.code === 0) {
			app.globalData.bankCardInfo = result.data;
			this.setData({
				isOpenTheCard: !!result.data.accountNo
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 获取订单信息
	async getStatus () {
		let params = {
			openId: app.globalData.openId
		};
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', params);
		if (result.code === 0) {
			app.globalData.myEtcList = result.data;
			let isActivation = result.data.filter(item => (item.obuStatus === 1 || item.obuStatus === 5) && (item.obuCardType === 1 || item.obuCardType === 21)); // 1 已激活  2 恢复订单  5 预激活
			let isShowFeatureService = result.data.findIndex(item => item.isShowFeatureService === 1 && (item.obuStatus === 1 || item.obuStatus === 5)); // 是否有特色服务
			console.log(isShowFeatureService);
			this.setData({
				isShowFeatureService: isShowFeatureService !== -1,
				isActivation: !!isActivation.length
			});
		} else {
			util.showToastNoIcon(result.message);
		}
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
	// 邀请好友
	inviteFriends () {
		app.globalData.crowdsourcingServiceProvidersId = '753646562833342464';// 测试
		util.go('/pages/crowdsourcing/index/index');
	},
	// 邀请办理-获取用户信息
	getUserInfo () {
		mta.Event.stat('personal_center_invitation_deal_with',{});
		util.showLoading({title: '加载中'});
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
		mta.Event.stat('personal_center_applet_sharing',{});
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
	go (e) {
		let url = e.currentTarget.dataset['url'];
		if (url === 'life_service') {
			this.showDetail(1);
			return;
		}
		if (url === 'the_owner_service') {
			mta.Event.stat('personal_center_owner_service',{});
		} else if (url === 'my_etc') {
			mta.Event.stat('personal_center_my_etc',{});
		} else if (url === 'my_order') {
			mta.Event.stat('personal_center_my_order',{});
		} else if (url === 'service_card_voucher') {
			mta.Event.stat('personal_center_service_card_voucher',{});
		} else if (url === 'help_center') {
			mta.Event.stat('personal_center_help_center',{});
		}
		util.go(`/pages/personal_center/${url}/${url}`);
	},
	onClickAccountManagement () {
		util.go('/pages/account_management/index/index');
	},
	// 扫码
	scan () {
		util.showLoading({title: '正在识别'});
		// 统计点击事件
		mta.Event.stat('023',{});
		// 只允许从相机扫码
		wx.scanCode({
			onlyFromCamera: true,
			success: async (res) => {
				let key = res.result.match(/(\S*)=/);
				let val = res.result.match(/=(\S*)/);
				if (key && val && key[1] && val[1].length === 18 && key[1] === 'orderId') {
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
		mta.Event.stat('037',{});
	},
	// 关闭详情
	close () {},
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
