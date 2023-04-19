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
		isShowBtn: true,// 是否显示购买按钮
		shopUserInfo: undefined,// 业务员信息
		salesmanInfo: undefined,// 业务员信息
		info: {},
		cictBank: false	// false 表示不是从中信签约页面过来的
	},
	async onLoad (options) {
		this.setData({packageId: options.packageId});
		// 从业务员端扫码
		if (options.scene) {
			let obj = this.path2json(decodeURIComponent(options.scene));
			console.log(obj);
			this.setData({shopUserInfo: obj.RPP});
		}
		// 从加购记录进入
		if (options.entrance) this.setData({isShowBtn: false});
		if (options.cictBank) this.setData({cictBank: true});
		if (!app.globalData.userInfo.accessToken) {
			await this.login();
		} else {
			const etcList = app.globalData.myEtcList.filter(item => item.flowVersion === 1);
			this.setData({etcList});
			await this.getPackageRelation(options.packageId);
			// 查询是否欠款
			await util.getIsArrearage();
		}
	},
	async onShow () {
		// 从登录返回 - 业务员端场景进入
		if (app.globalData.userInfo.accessToken && this.data.shopUserInfo) await this.getIndependentInfo();
	},
	// 将url路径转成json a=1&=2 => {a: 1,b: 2}
	path2json (scene) {
		let arr = scene.split('&');
		let obj = {};
		let temp;
		for (let i = 0; i < arr.length; i++) {
			temp = arr[i].split('=');
			if (temp.length > 1) {
				obj[temp[0]] = temp[1];
			}
		}
		return obj;
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
						if (this.data.packageId === app.globalData.citicBankRightId) {
							// 中信银行
							await this.getPackageRelation(this.data.packageId);
							return;
						}
						await this.getIndependentInfo();
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
	async getIndependentInfo () {
		const result = await util.getDataFromServersV2('consumer/voucher/rights/get-buy-independent-rights-cache-info', {
			shopUserInfo: this.data.shopUserInfo
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				salesmanInfo: result.data,
				packageId: result.data.packageId
			});
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
		if (this.data.packageId === app.globalData.citicBankRightId) {
			// 中信银行
			await this.packagePayment();
			return;
		}
		if (this.data.info.couponType === 2 || this.data.shopUserInfo) {
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
	// 支付d
	async packagePayment () {
		if (this.data.isRequest) return;
		this.setData({isRequest: true});
		const params = {
			tradeType: 1,
			packageId: this.data.packageId,
			openId: app.globalData.userInfo.openId
		};
		// 业务员端
		if (this.data.shopUserInfo) {
			// params.shopUserInfo = this.data.shopUserInfo;
			params.shopUserId = this.data.salesmanInfo.shopUserId;
			params.shopId = this.data.salesmanInfo.shopId;
			if (this.data.salesmanInfo.orderId) params.orderId = this.data.salesmanInfo.orderId;
		}
		if (this.data.packageId === app.globalData.citicBankRightId) {
			params.orderId = app.globalData.orderInfo.orderId;
		}
		const result = await util.getDataFromServersV2('consumer/voucher/rights/independent-rights-buy', params);
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
						if (this.data.packageId === app.globalData.citicBankRightId) {
							util.go(`/pages/separate_interest_package/citic_bank_pay_success/citic_bank_pay_success?orderId=${app.globalData.orderInfo.orderId}`);
							return;
						}
						util.go(`/pages/separate_interest_package/buy_success/buy_success?recordId=${result.data.recordId}`);
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
	},
	onUnload () {
		if (this.data.cictBank) {
			// 跳转首页; 避免返回中信签约页面
			wx.switchTab({
				url: '/pages/Home/Home'
			});
		}
	}
});
