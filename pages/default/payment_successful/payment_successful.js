/**
 * @author 老刘
 * @desc 信息确认
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		contractStatus: 0// 1已签约
	},
	onLoad () {
		this.queryContract();
	},
	// 查询车主服务签约
	queryContract () {
		util.getDataFromServer('consumer/order/query-contract', {
			orderId: app.globalData.orderInfo.orderId
		}, () => {
			util.hideLoading();
		}, (res) => {
			util.hideLoading();
			if (res.code === 0) {
				this.setData({
					contractStatus: res.data.contractStatus
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken);
	},
	// 微信签约
	next () {
		if (this.data.isRequest) {
			return;
		} else {
			this.setData({isRequest: true});
		}
		util.showLoading('加载中');
		let params = {
			dataComplete: 1,// 已完善资料,进入待审核
			orderId: app.globalData.orderInfo.orderId,// 订单id
			clientOpenid: app.globalData.userInfo.openId,
			clientMobilePhone: app.globalData.userInfo.mobilePhone,
			needSignContract: true // 是否需要签约 true-是，false-否
		};
		if (this.data.contractStatus === 1) {
			delete params.needSignContract;
		}
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
			util.hideLoading();
			this.setData({isRequest: false});
		}, (res) => {
			if (res.code === 0) {
				util.hideLoading();
				if (this.data.contractStatus === 1) {
					// 1.0 已签约
					util.go(`/pages/default/processing_progress/processing_progress?type=main_process&orderId=${app.globalData.orderInfo.orderId}`);
					return;
				}
				let result = res.data.contract;
				// 签约车主服务 2.0
				app.globalData.signAContract = -1;
				app.globalData.isTruckHandling = true;
				app.globalData.belongToPlatform = app.globalData.platformId;
				util.weChatSigning(result);
			} else {
				util.hideLoading();
				this.setData({isRequest: false});
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
		});
	},
	onUnload () {
		wx.reLaunch({
			url: '/pages/Home/Home'
		});
	}
});
