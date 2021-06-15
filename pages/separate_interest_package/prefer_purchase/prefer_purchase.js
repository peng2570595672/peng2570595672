/**
 * @author jianliaoliang
 * @desc 优惠购页面
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		etcList: [],
		isRequest: false,
		packageId: undefined,
		info: {}
	},
	async onLoad (options) {
		this.setData({packageId: options.packageId});
		if (!app.globalData.userInfo.accessToken) {
			await this.login();
		} else {
			const etcList = app.globalData.myEtcList.filter(item => item.flowVersion === 1);
			this.setData({etcList});
			await this.getPackageRelation(options.packageId);
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
						await this.getEtcList();
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
	// 获取订单信息
	async getEtcList () {
		let params = {
			openId: app.globalData.openId
		};
		const result = await util.getDataFromServersV2('consumer/order/my-etc-list', params);
		if (result.code === 0) {
			app.globalData.myEtcList = result.data;
			const etcList = app.globalData.myEtcList.filter(item => item.flowVersion === 1);
			this.setData({etcList});
			await this.getPackageRelation(this.data.packageId);
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	async getPackageRelation (packageId) {
		const result = await util.getDataFromServersV2('consumer/voucher/rights/package-details', {
			packageId: packageId
		});
		if (!result) return;
		if (result.code === 0) {
			let couponType = [];
			result.data.couponDetails.map(item => {
				couponType.push(item.couponType);
				if (item.couponType === 1) result.data.passTicket = item.couponCount;
				if (item.couponType === 2) result.data.parkingCoupon = item.couponCount;
			});
			result.data.couponType = couponType.length > 1 ? 3 : parseInt(couponType[0]) === 1 ? 1 : 2;
			this.setData({
				info: result.data
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 查看购买条款
	onClickPurchaseTerms () {
		util.go(`/pages/separate_interest_package/purchase_terms/purchase_terms`);
	},
	async onClickPay () {
		if (this.data.info.couponType === 2) {
			// 不含通行券 - 立即支付
			await this.packagePayment();
			return;
		}
		if (this.data.etcList?.length) {
			util.go(`/pages/separate_interest_package/associated_license_plate/associated_license_plate?packageId=${this.data.packageId}`);
			return;
		}
		util.alert({
			title: `不符合购买条件。`,
			content: `您暂无可绑定的ETC订单`,
			showCancel: true,
			confirmColor: '#576B95',
			cancelColor: '#000000',
			cancelText: '我知道了',
			confirmText: '办理ETC',
			confirm: async () => {
				app.globalData.orderInfo.orderId = '';
				util.go(`/pages/default/receiving_address/receiving_address`);
			},
			cancel: () => {
			}
		});
	},
	// 支付
	async packagePayment () {
		if (this.data.isRequest) return;
		this.setData({isRequest: true});
		const result = await util.getDataFromServersV2('consumer/voucher/rights/independent-rights-buy', {
			packageId: this.data.packageId,
			openId: app.globalData.userInfo.openId
		});
		if (!result) {
			this.setData({isRequest: false});
			return;
		}
		if (result.code === 0) {
			let extraData = result.data.extraData;
			wx.requestPayment({
				nonceStr: extraData.nonceStr,
				package: extraData.package,
				paySign: extraData.paySign,
				signType: extraData.signType,
				timeStamp: extraData.timeStamp,
				success: (res) => {
					this.setData({isRequest: false});
					if (res.errMsg === 'requestPayment:ok') {
						util.go(`/pages/separate_interest_package/buy_success/buy_success`);
					} else {
						util.showToastNoIcon('支付失败！');
					}
				},
				fail: (res) => {
					this.setData({isRequest: false});
					if (res.errMsg !== 'requestPayment:fail cancel') {
						util.showToastNoIcon('支付失败！');
					}
				}
			});
		} else {
			this.setData({isRequest: false});
			util.showToastNoIcon(result.message);
		}
	}
});
