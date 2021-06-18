/**
 * @author jianliaoliang
 * @desc 选择银行
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		orderId: null,
		bankList: [],// 套餐列表
		qrUrl: ''
	},
	onLoad (options) {
		if (options.orderId) {
			this.setData({
				orderId: options.orderId
			});
		} else {
			this.setData({
				orderId: app.globalData.orderInfo.orderId
			});
		}
		this.fetchBankList();
	},
	onShow () {
	},
	fetchBankList () {
		this.setData({
			bankList: []
		});
		util.showLoading();
		util.getDataFromServer('consumer/etc/qtzl/getAccountChannelList', {
			orderId: this.data.orderId
		}, () => {
			util.showToastNoIcon('获取可签约银行列表失败！');
		}, (res) => {
			if (res.code === 0) {
				if (res.data.list.length > 0) {
					res.data.list.map(item => {
						item['icon'] = 'bank_' + item.type;
					});
				}
				this.setData({
					bankList: res.data.list
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	chooseBank (e) {
		// 签约状态 0未签约 1:在用 2:解约 3.签约中
		let status = e.currentTarget.dataset['status'];
		let signChannelId = e.currentTarget.dataset['channel'];
		let redirectUrl = '/pages/Home/Home';
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
			this.getOrderInfo(signChannelId,signType);
		}
	},
	// 获取订单信息
	getOrderInfo (signChannelId,signType) {
		util.showLoading();
		util.getDataFromServer('consumer/order/get-order-info', {
			orderId: app.globalData.orderInfo.orderId,
			dataType: '18'
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				util.go(`/pages/default/bind_withhold/bind_withhold?signChannelId=${signChannelId}&signType=${signType}&vehPlates=${res.data.base.vehPlates}&cardMobilePhone=${res.data.ownerIdCard.cardMobilePhone}`);
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	goBack () {
		wx.reLaunch({
			url: '/pages/Home/Home'
		});
	}
});
