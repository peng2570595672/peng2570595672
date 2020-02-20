const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		page: 1,// 当前页
		pageSize: 10,// 每页多少条数据
		totalPages: '',// 总页数
		complaintList: '',
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
	onLoad () {
		this.getComplaintList();
	},
	// 分页获取申诉列表
	getComplaintList (isLoadingMore) {
		util.showLoading();
		let params = {
			page: this.data.page,
			pageSize: this.data.pageSize
		};
		util.getDataFromServer('consumer/etc/bill-complain-page-list', params, () => {
			// 隐藏加载中动画
			this.hideAnim(isLoadingMore);
			util.showToastNoIcon('获取申诉列表失败！');
		}, (res) => {
			this.setData({
				totalPages: res.data.pages
			});
			if (res.code !== 0) {
				// 隐藏加载中动画
				this.hideAnim(isLoadingMore);
				util.showToastNoIcon(res.message);
				this.setData({
					complaintList: []
				});
				return;
			}
			// 隐藏加载中动画
			this.hideAnim(isLoadingMore);
			if (!isLoadingMore) {
				this.setData({
					complaintList: res.data.list
				});
			} else {
				let info = this.data.complaintList;
				info = info.concat(res.data.list);
				this.setData({
					complaintList: info
				});
			}
		}, app.globalData.userInfo.accessToken, () => {
			// 隐藏加载中动画
			this.hideAnim(isLoadingMore);
			util.hideLoading();
		});
	},
	// 隐藏加载中动画
	hideAnim (isLoadingMore) {
		let tempObj = this.data.showLoading;
		tempObj.show = false;
		this.setData({
			showLoading: tempObj
		});
		isLoadingMore ? this.hideLoadingMore() : wx.stopPullDownRefresh();
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
		this.getComplaintList(false);
	},
	// 上滑分页加载
	onReachBottom () {
		if (this.data.complaintList.length < this.data.pageSize) return;
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
		this.getComplaintList(true);
	}
});
