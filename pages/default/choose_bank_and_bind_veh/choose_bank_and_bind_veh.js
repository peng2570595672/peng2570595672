/**
 * @author jianliaoliang
 * @desc 选择银行
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		orderInfo: {},
		cardMobilePhone: '',
		vehPlates: '',
		orderId: null,
		bankList: [],// 套餐列表
		qrUrl: ''
	},
	async onLoad (options) {
		if (options.orderId) {
			this.setData({
				orderId: options.orderId
			});
		} else {
			this.setData({
				orderId: app.globalData.orderInfo.orderId
			});
		}
		await this.getOrderInfo();
	},
	onShow () {
	},
	async fetchBankList () {
		this.setData({
			bankList: []
		});
		util.showLoading();
		const result = await util.getDataFromServersV2('consumer/etc/qtzl/getAccountChannelList', {
			orderId: this.data.orderId
		});
		if (!result) return;
		if (result.code === 0) {
			if (result.data.list.length > 0) {
				result.data.list.map(item => {
					item['icon'] = 'bank_' + item.type;
					item.status = +item.status;
				});
			}
			this.setData({
				bankList: result.data.list
			});
		} else if (result.code === 1) {
			// 登录已过期
			this.selectComponent('#verifyCode').show();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 获取订单信息
	async getOrderInfo () {
		const result = await util.getDataFromServersV2('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '18'
		});
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				vehPlates: result.data?.base?.vehPlates,
				cardMobilePhone: result.data?.ownerIdCard?.cardMobilePhone,
				orderInfo: {
					cardMobilePhone: result.data?.ownerIdCard?.cardMobilePhone,
					needCallback: true // 需要回调
				}
			});
			this.fetchBankList();
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	chooseBank (e) {
		// 签约状态 0未签约 1:在用 2:解约 3.签约中
		let status = e.currentTarget.dataset['status'];
		let signChannelId = e.currentTarget.dataset['channel'];
		let redirectUrl = `https://${app.globalData.test ? 'etctest.cyzl.com/etc2-html' : 'etc.cyzl.com/wetc'}/bank_signing_the_callback/index.html`;
		let signType = e.currentTarget.dataset['type'];
		if (status !== 1) {
			wx.uma.trackEvent('choose_bank_and_bind_veh');
			util.showLoading({
				title: '正在获取签约地址'
			});
			util.getDataFromServer('consumer/etc/qtzl/signChannel', {
				orderId: this.data.orderId,
				signChannelId: signChannelId,
				redirectUrl: redirectUrl,
				signType: signType
			}, () => {
				util.showToastNoIcon('获取签约地址失败！');
			}, (res) => {
				if (res.code === 0) {
					this.setData({
						qrUrl: res.data.signUrl
					});
					util.hideLoading();
					this.selectComponent('#qrcode').show();
				} else {
					util.showToastNoIcon(res.message);
				}
			}, app.globalData.userInfo.accessToken, () => {
				util.hideLoading();
			});
		} else {
			util.go(`/pages/default/bind_withhold/bind_withhold?signChannelId=${signChannelId}&signType=${signType}&vehPlates=${this.data.vehPlates}&cardMobilePhone=${this.data.cardMobilePhone}`);
		}
	},
	async onClickHandle () {
		// 登录回调
		await this.fetchBankList();
	},
	goBack () {
		wx.reLaunch({
			url: '/pages/Home/Home'
		});
	}
});
