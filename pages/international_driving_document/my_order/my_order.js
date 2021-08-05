const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		tabStatus: [
			{name: '已支付'},
			{name: '未支付'}
		],
		currentTab: 0, // 0已支付 1未支付
		carList: []
	},
	async onLoad () {
		this.getMyETCList();
		// 查询是否欠款
		await util.getIsArrearage();
	},
	/**
	 *  支付状态 0-待支付，1-已支付，2-支付失败, 3 - 退款中，4-已退款，5-退款失败
	 */
	// 获取订单列表
	getMyETCList () {
		util.showLoading();
		util.getDataFromServer('consumer/order/iso_driving/pageList', {
			payStatus: this.data.currentTab === 0 ? '1' : '0'
		}, () => {
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					carList: res.data.list // 初始化变量
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	switchTabStatus (e) {
		if (this.data.currentTab === e.target.dataset.current) {
			return false;
		}
		this.setData({
			currentTab: e.target.dataset.current
		});
		this.getMyETCList();
	},
	//	查看详情
	onClickGoOrderDetailHandle (e) {
		let index = e.currentTarget.dataset.index;
		let info = this.data.carList[index];
		wx.setStorageSync('international-order_detail', JSON.stringify(info));
		util.go(`/pages/international_driving_document/order_detail/order_detail?info=${JSON.stringify(info)}`);
	},
	customerService () {
		wx.makePhoneCall({
			phoneNumber: '10101020'
		});
	},
	onUnload () {
		let page = wx.getStorageSync('international-create');
		if (page === 4) {
			wx.navigateBack({
				delta: 4
			});
		}
	}
});
