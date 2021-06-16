const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		totalPages: '',// 总页数
		page: 1,// 当前页
		pageSize: 10,// 每页多少条数据
		couponList: [], // 权益列表
		showLoading: {
			show: true,
			text: '加载中...'
		},
		showLoadingMore: {
			hideLoading: false,
			show: false,
			text: '加载中...'
		}
	},
	async onLoad () {
		await this.getCouponCenterList();
	},
	hideLoadingMore () {
		this.setData({
			showLoadingMore: {
				show: false,
				text: '加载中...'
			}
		});
	},
	// 下滑重新加载
	onPullDownRefresh () {
		this.setData({
			page: 1
		});
		this.getCouponCenterList(false);
	},
	// 上滑分页加载
	onReachBottom () {
		if (this.data.couponList.length < this.data.pageSize) return;
		this.setData({
			showLoadingMore: {
				show: true,
				text: '加载中...'
			}
		});
		this.setData({
			page: ++this.data.page
		});
		if (this.data.page > this.data.totalPages) {
			this.setData({
				page: --this.data.page,
				showLoadingMore: {
					hideLoading: true,
					show: true,
					text: '我是有底线的~'
				}
			});
			return;
		}
		this.getCouponCenterList(true);
	},
	// 查看历史
	onClickSeeHistory () {
		util.go(`/pages/personal_center/coupon_redemption_history/coupon_redemption_history`);
	},
	async getCouponCenterList (isLoadingMore) {
		const result = await util.getDataFromServersV2('consumer/voucher/rights/get-coupon-center-history-list', {
			page: this.data.page,
			pageSize: this.data.pageSize
		});
		// 隐藏加载中动画
		this.hideAnim(isLoadingMore);
		if (!result) return;
		if (result.code === 0) {
			this.setData({
				couponList: result.data.list,
				totalPages: result.data.total
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	// 隐藏加载中动画
	hideAnim (isLoadingMore) {
		let tempObj = this.data.showLoading;
		tempObj.show = false;
		this.setData({
			showLoading: tempObj
		});
		isLoadingMore ? this.hideLoadingMore() : wx.stopPullDownRefresh();
	}
});
