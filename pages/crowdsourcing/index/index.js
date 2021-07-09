const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		userList: [
			{userName: '用户***君赚取了', earnings: '60元'},
			{userName: '用户*****R赚取了', earnings: '180元'},
			{userName: '用户**子赚取了', earnings: '30元'},
			{userName: '用户********5赚取了', earnings: '150元'},
			{userName: '用户***0赚取了', earnings: '30元'},
			{userName: '用户*儿赚取了', earnings: '90元'},
			{userName: '用户******n赚取了', earnings: '180元'}
		],
		canvasShow: false, // 动画是否显示
		qrImgLoadSuccess: false, // 二维码图片是否加载完毕
		canvasDraw: false, // canvas图片是否绘制 (默认值必须是false)
		ratio: '', // 系统屏幕参数
		qrCodeUrl: '', // 二维码路径
		nickName: '', // 原点用户昵称
		avatarUrl: '', // 原点用户头像
		btnAnimation: {},
		animation1: {}, // 金币抖动动画
		animation2: {}, // 金币抖动动画
		animation3: {}, // 金币抖动动画
		handleList: [], // 分析的裂变用户办理情况
		showMobileMask: false, // 绑定手机号相关
		showMobileWrapper: false ,// 绑定手机号相关
		shareAlertMask: false, // 控制分享弹窗
		shareAlertWrapper: false, // 控制分享弹窗
		isRequest: false, // 是否正在请求
		sharePageUrl: 'crowdsourcing/pages/new_user/new_user'
	},
	onLoad (options) {
		util.resetData();// 重置数据
		if (options && options.shopId) {
			app.globalData.crowdsourcingServiceProvidersId = options.shopId;
		}
		// 获取系统屏幕参数
		wx.getSystemInfo({
			success: res => {
				this.setData({
					ratio: 750 / res.windowWidth
				});
			}
		});
	},
	onShow () {
		// 金币抖动动画
		this.animation1();
		this.animation2();
		this.animation3();
		this.btnAnimation();
		if (!app.globalData.memberId) {
			util.showLoading({title: '加载中'});
			this.login();
		} else {
			this.getDataList();
		}
	},
	getUserInfo () {
		wx.uma.trackEvent('origin_user_invitation_for_cash');
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
							that2.selectComponent('#crowdsourcingPrompt').show();
						}
					});
				}
				util.hideLoading();
			}
		});
	},
	animation1 () {
		// 1: 创建动画实例animation:
		let animation = wx.createAnimation({
			duration: 1500,
			timingFunction: 'ease'
		});
		this.animation = animation;
		let next = true;
		// 连续动画关键步骤
		setInterval(function () {
			// 2: 调用动画实例方法来描述动画
			if (next) {
				animation.translateX(4).step();
				animation.rotate(19).step();
				next = !next;
			} else {
				animation.translateX(-4).step();
				animation.rotate(-19).step();
				next = !next;
			}
			// : 将动画export导出，把动画数据传递组件animation的属性
			this.setData({
				animation1: animation.export()
			});
		}.bind(this), 1500);
	},
	animation2 () {
		// 1: 创建动画实例animation:
		let animation = wx.createAnimation({
			duration: 3000,
			timingFunction: 'ease'
		});
		this.animation = animation;
		let next = true;
		// 连续动画关键步骤
		setInterval(function () {
			// 2: 调用动画实例方法来描述动画
			if (next) {
				animation.translateX(-4).step();
				animation.rotate(-19).step();
				next = !next;
			} else {
				animation.translateX(4).step();
				animation.rotate(19).step();
				next = !next;
			}
			// 3: 将动画export导出，把动画数据传递组件animation的属性
			this.setData({
				animation2: animation.export()
			});
		}.bind(this), 1500);
	},
	animation3 () {
		// 1: 创建动画实例animation:
		let animation = wx.createAnimation({
			duration: 2000,
			timingFunction: 'ease'
		});
		this.animation = animation;
		let next = true;
		// 连续动画关键步骤
		setInterval(function () {
			// 2: 调用动画实例方法来描述动画
			if (next) {
				animation.translateY(4).step();
				animation.rotate(19).step();
				next = !next;
			} else {
				animation.translateY(-4).step();
				animation.rotate(-19).step();
				next = !next;
			}
			// 3: 将动画export导出，把动画数据传递组件animation的属性
			this.setData({
				animation3: animation.export()
			});
		}.bind(this), 2000);
	},
	btnAnimation () {
		var animation = wx.createAnimation({
			duration: 1000,
			timingFunction: 'linear'
		});
		this.animation = animation;
		var next = true;
		// 连续动画关键步骤
		setInterval(function () {
			if (next) {
				this.animation.scale(0.93).step();
				next = !next;
			} else {
				this.animation.scale(1).step();
				next = !next;
			}
			this.setData({
				btnAnimation: animation.export()
			});
		}.bind(this), 1000);
	},
	// 从我们服务器获取openid等信息
	login () {
		// 登录
		wx.login({
			success: (r) => {
				util.getDataFromServer('consumer/member/common/applet/code', {
					platformId: app.globalData.platformId, // 平台id
					code: r.code // 从微信获取的code
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
							this.getMemberCrowdSourcingAndOrder();
							this.getDataList();
							util.hideLoading();
						} else {
							util.hideLoading();
						}
					} else {
						util.hideLoading();
						util.showToastNoIcon(res.message);
					}
				});
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
				if (res.data.status === 1) {
					app.globalData.crowdsourcingServiceProvidersId = res.data.shopId;
				}
				if (res.data.status === 8) {
					this.activityCancel();
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	goPersonalCenter () {
		util.go('/pages/personal_center/index/index');
	},
	getDataList () {
		util.showLoading();
		let params = {
			shopId: app.globalData.crowdsourcingServiceProvidersId
		};
		util.getDataFromServer('consumer/member/selectMemberCrowdSourcingOrderList', params, () => {
			util.showToastNoIcon('获取推广订单列表失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					handleList: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 绑定手机号
	getPhoneNumber (e) {
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
					loginInfo.needBindingPhone = 0;
					this.getMemberCrowdSourcingAndOrder();
					this.getDataList();
					this.setData({
						loginInfo
					});
				} else {
					util.hideLoading();
					util.showToastNoIcon(res.message);
				}
			});
		}
	},
	// 分享好友
	onShareAppMessage () {
		wx.uma.trackEvent('origin_user_applet_sharing');
		return {
			title: '好友邀你领取ETC',
			imageUrl: '/pages/crowdsourcing/assets/share.png',
			path: `/pages/crowdsourcing/new_user/new_user?shopId=${app.globalData.crowdsourcingServiceProvidersId}&memberId=${app.globalData.memberId}`
		};
	},
	// 提示绑定手机号
	showBindMobile () {
		this.setData({
			showMobileMask: true,
			showMobileWrapper: true
		});
	},
	// 隐藏提示绑定手机号
	hideBindMobile () {
		this.setData({
			showMobileWrapper: false
		});
		setTimeout(() => {
			this.setData({
				showMobileMask: false
			});
		}, 400);
	},
	imageLoad () {
		this.setData({qrImgLoadSuccess: true});
	},
	// 活动过期
	activityCancel () {
		util.alert({
			title: '提示',
			content: '本次活动已结束。',
			confirmText: '我知道了',
			confirm: () => {
				util.go('/pages/Home/Home');
			}
		});
	}
});
