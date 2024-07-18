// pages/personal_center/quotaLandingPage/quotaLandingPage.js
const util = require('../../../utils/util.js');
const app = getApp();

Page({
	/**
	 * 页面的初始数据
	 */
	data: {
		carList: [], // 存储可测额的车牌列表
		message: '', // 记录参与活动后提示词
		lines_1: '5', // 第一种券额
		number_1: '2', // 第一种券的数量
		lines_2: '15', // 第二种券额
		number_2: '1', // 第二种券的数量
		couponIds: '1259868120753905664,1259868736523870208' // 创建卡券批次Id
	},

	/**
	 * 生命周期函数--监听页面加载
	 */
	async onLoad (options) {
		// 页面显示时的逻辑
	},
	/**
 * 生命周期函数--监听页面显示
 */
	async onShow () {
		if (!app.globalData.userInfo.accessToken) {
			this.login();
		} else {
			// 初始化时检查是否可测额以及指定车牌
			await this.whetherItIsMeasurable();
			// 获取已发放奖励列表
			await this.checkTheCouponDetails();
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
				}, async (res) => {
					if (res.code === 0) {
						util.hideLoading();
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
							// 初始化时检查是否可测额以及指定车牌
							await this.whetherItIsMeasurable();
							// 获取已发放奖励列表
							await this.checkTheCouponDetails();
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
	/**
	 * 立即测额按钮点击事件
	 */
	onClickCommit (e) {
		const content = '一、您即将通过该链接跳转至第三方页面，在第三方页面中提交信息将由第三方按照其相关用户服务协议及隐私协议正常执行并负责，服务及责任均由第三方提供或承担，如有疑问请致电第三方客服电话';
		const content2 = '二、仅支持以下车牌测额成功后返券';
		if (this.data.carList.length > 0 && this.data.LicensePlate) {
			const LicensePlate = this.data.LicensePlate;
			// 显示提示框
			this.selectComponent('#popTipComp').show({
				type: 'tenth',
				title: '温馨提示',
				content,
				content2,
				LicensePlate,
				btnCancel: '不再参与',
				btnconfirm: '继续测额'
			});
		} else {
			// 提示刷新页面
			util.showToastNoIcon(this.data.message || '请刷新后重新进入该页面!', this.data.deTime);
		}
	},

	/**
	 * 检查是否可测额以及指定车牌
	 */
	async whetherItIsMeasurable () {
		const result = await util.getDataFromServersV2('consumer/order/check-pa-evaluate-result', {});
		if (!result) return;
		if (result.code === 0 && result.data) {
			const LicensePlate = result.data.map(item => item.vehPlates); // 提取车牌号
			this.setData({
				carList: result.data,
				LicensePlate
			});
		} else {
			let message = result.message;
			let deTime = 3000; // 默认三秒弹框

			switch (result.code) {
				case 5003:
					deTime = 5000;
					break;
			}
			this.setData({
				message: message,
				deTime
			});
			// util.showToastNoIcon(result.message, 3000);
		}
	},

	/**
	 * 显示活动规则
	 */
	rules () {
		const popUpBoxProtocol = {
			name: '活动规则',
			content: true
		};
		// 显示规则弹窗
		this.selectComponent('#popTipComp').showCountdownPopupBox({
			btnShadowHide: true,
			title: popUpBoxProtocol.name,
			btnconfirm: '我知道了',
			type: 'noCountdownRequired',
			content: popUpBoxProtocol.content
		});
	},

	/**
	 * 根据couponId分组卡券
	 */
	thereAreCoupons () {
		let list = this.data.valueList;
		// 使用reduce函数对数组中的对象按couponId进行分组
		let groupedCoupons = list.reduce((accumulator, currentValue) => {
			if (!accumulator[currentValue.couponId]) {
				accumulator[currentValue.couponId] = [];
			}
			accumulator[currentValue.couponId].push(currentValue);
			return accumulator;
		}, {});

		// 转换为数组形式
		let coupons = Object.values(groupedCoupons);

		console.log(coupons);
		// 显示卡券奖励
		this.selectComponent('#popTipComp').show({
			type: 'coupons',
			title: '查看奖励',
			content: '测额活动奖励已发放，通行券核销情况可前往小程序【个人中心 - 领券中心 - 服务卡券】查看。',
			btnCancel: '关闭',
			btnconfirm: '前往我的卡券',
			pic: true,
			coupons
		});
	},

	/**
	 * 没有卡券时的处理
	 */
	thereAreNoCoupons () {
		this.selectComponent('#popTipComp').show({
			NoIcon: true,
			type: 'one',
			title: '查看奖励',
			content: '暂无奖励发放,请先参与测额活动后继续查看!'
		});
	},

	/**
	 * 判断有无获取卡券奖励
	 */
	async eventAwards () {
		if (this.data.valueList && this.data.valueList.length > 0) {
			// 已经参与
			this.thereAreCoupons();
		} else {
			// 暂未参与
			this.thereAreNoCoupons();
		}
	},

	/**
	 * 获取已发放奖励列表接口
	 */
	async checkTheCouponDetails () {
		let params = {
			page: '1',
			pageSize: '10',
			couponIds: this.data.couponIds
		};
		// 请求券额详情
		const result = await util.getDataFromServersV2('consumer/voucher/get-coupon-page-list', params);
		if (!result) return;
		if (result.code === 0 && result.data) {
			this.setData({
				valueList: result.data.list // 设置奖励列表
			});
		} else {
			util.showToastNoIcon(result.message, 3000);
		}
	},

	/**
	 * 处理按钮点击事件
	 */
	onHandle () {
		if ((this.data.valueList && this.data.valueList.length > 0) && !this.data.carList.length) {
			// 已获取奖励，跳转到卡券页面
			util.go(`/pages/personal_center/service_card_voucher/service_card_voucher`);
		} else {
			// 参与测额度活动，打开另一个小程序
			wx.openEmbeddedMiniProgram({
				appId: 'wx096541bb8eb5f6c6',
				path: 'czdv2/basic/basic?source=hlwjrb0666&outerSource=qrwm-qt0080',
				envVersion: 'release',
				fail () {
					util.showToastNoIcon('调起小程序失败, 请重试！');
				}
			});
		}
	},

	/**
	 * 取消处理按钮事件
	 */
	cancelHandle (e) {
		console.log('取消操作');
	},
	/**
	 * 取消处理按钮事件
	 */
	testRef (e) {
		// 参与测额度活动，打开另一个小程序
		wx.openEmbeddedMiniProgram({
			appId: 'wx096541bb8eb5f6c6',
			path: 'czdv2/basic/basic?source=hlwjrb0666&outerSource=qrwm-qt0080',
			envVersion: 'release',
			fail () {
				util.showToastNoIcon('调起小程序失败, 请重试！');
			}
		});
	},

	/**
	 * 确认处理按钮事件
	 */
	confirmHandle (e) {
		console.log('确认操作', e);
	}
});
