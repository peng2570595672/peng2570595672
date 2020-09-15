const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		balanceText: '0.00',	// 当前余额（单位：元（精确到小数点后两位
		list: [],
		totalPage: 2,
		page: 0
	},
	/**
	 * 生命周期函数--监听页面加载
	 */
	onLoad (options) {
		this.crowdSourcingRedParkPageList();
	},
	// 页面上拉触底事件的处理函数
	onReachBottom () {
		if (this.data.page > this.data.totalPage) return;
		this.crowdSourcingRedParkPageList();
	},
	// 加载列表
	crowdSourcingRedParkPageList (callback) {
		this.setData({
			page: this.data.page + 1
		});
		let params = {
			shopId: app.globalData.crowdsourcingServiceProvidersId,
			page: this.data.page,
			pageSize: 10
		};
		util.showLoading();
		util.getDataFromServer('consumer/voucher/crowdSourcingRedParkPageList', params, () => {
			util.showToastNoIcon('获取推广红包列表失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					list: this.data.list.concat(res.data.list),
					page: +res.data.page,
					totalPage: +res.data.pages
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	}
});
