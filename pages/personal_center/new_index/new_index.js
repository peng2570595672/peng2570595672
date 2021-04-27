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
		rightsAndInterestsVehicleList: undefined, // 权益车辆列表
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
		}
	},
	onLoad (options) {
		app.globalData.orderInfo.orderId = '';
		if (options.isMain) {
			this.setData({
				isMain: options.isMain
			});
		}
	},
	onShow () {
		if (app.globalData.userInfo.accessToken) {
			this.getMemberBenefits();
			this.getMemberCrowdSourcingAndOrder();
			this.getOrderRelation();
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
	getOrderRelation () {
		util.showLoading();
		util.getDataFromServer('consumer/voucher/rights/get-order-relation', {
			platformId: app.globalData.platformId
		}, () => {
			util.showToastNoIcon('获取车辆列表失败！');
		}, (res) => {
			if (res.code === 0) {
				if (res.data) {
					app.globalData.rightsAndInterestsVehicleList = res.data;
					this.setData({
						rightsAndInterestsVehicleList: res.data
					});
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	getightsPackageBuyRecords () {
		util.showLoading();
		util.getDataFromServer('consumer/order/rightsPackageBuyRecords ', {
			platformId: app.globalData.platformId
		}, () => {
			util.showToastNoIcon('获取权益列表失败！');
		}, (res) => {
			if (res.code === 0) {
				// id：订单id
				// payTime： 支付时间
				// rightsPackagePayMoney： 权益包支付金额
				// rightsPackageRefundStatus：权益包退款状态 0-未退款，2-退款中，3-退款成功，4-退款失败
				// rightsPackageId：权益包id
				// rightsPackageCode：权益包发放状态 0-未发放，1-发送成功，2-发放失败
				// rightsPackageMsg：权益包发放备注
				if (res.data) {
					app.globalData.rightsAndInterestsVehicleList = res.data;
					this.setData({
						rightsAndInterestsVehicleList: res.data
					});
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 自动登录
	login (isData) {
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
							this.setData({
								mobilePhone: res.data.mobilePhone
							});
							this.getMemberBenefits();
							this.getMemberCrowdSourcingAndOrder();
							this.getOrderRelation();
							if (isData) {
								this.submitUserInfo(isData);
							}
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
	// 众包-获取用户推广码和订单红包数量
	getMemberCrowdSourcingAndOrder () {
		util.showLoading();
		util.getDataFromServer('consumer/member/getMemberCrowdSourcingAndOrder', {}, () => {
			util.showToastNoIcon('获取用户推广信息失败！');
		}, (res) => {
			if (res.code === 0) {
				// status - 0 未成为推广者，1-已经是推广者，8-活动已经结束
				app.globalData.crowdsourcingServiceProvidersId = res.data.shopId;
				this.setData({
					crowdSourcingMsg: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
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
	submitUserInfo (user) {
		util.showLoading();
		let params = {
			encryptedData: user.encryptedData,
			iv: user.iv
		};
		util.getDataFromServer('consumer/member/applet/update-user-info', params, () => {
			util.showToastNoIcon('提交用户信息失败！');
		}, (res) => {
			if (res.code === 0) {
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 获取会员信息
	getMemberBenefits () {
		util.showLoading();
		util.getDataFromServer('consumer/member/member-status', {}, () => {
			util.showToastNoIcon('获取会员信息失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					isAttention: res.data.attentionStatus
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
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
			this.showDetail();
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
	// 扫码
	scan () {
		util.showLoading({title: '正在识别'});
		// 统计点击事件
		mta.Event.stat('023',{});
		// 只允许从相机扫码
		wx.scanCode({
			onlyFromCamera: true,
			success: (res) => {
				let key = res.result.match(/(\S*)=/);
				let val = res.result.match(/=(\S*)/);
				if (key && val && key[1] && val[1].length === 18 && key[1] === 'orderId') {
					util.getDataFromServer('consumer/member/bind-order', {
						orderId: val[1]
					}, () => {
						util.hideLoading();
					}, (res) => {
						util.hideLoading();
						if (res.code === 0) {
							app.globalData.orderInfo.orderId = val[1];
							util.go('/pages/personal_center/my_etc_detail/my_etc_detail');
						} else {
							util.showToastNoIcon(res.message);
						}
					}, app.globalData.userInfo.accessToken);
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
	showDetail (e) {
		this.setData({
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
