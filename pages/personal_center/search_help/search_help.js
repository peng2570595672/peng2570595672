const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		num: 5,// 热门搜索显示条数
		page: 1,// 当前页
		pageSize: 10,// 每页多少条数据
		totalPages: '',// 总页数
		isHot: true,
		topSearchList: [],// 热门搜索
		searchContent: '',// 搜索内容
		showDetailMask: false,// 弹窗
		showDetailWtapper: false,// 弹窗
		showScroll: false,// 弹窗内容是否显示底部滚动盒子
		detailsContent: '',// 问题详情内容
		detailsTitle: '',// 问题详情标题
		fatherHeight: '',// 弹窗列表高度
		childHeight: '',// 弹窗列表内容高度
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
	onShow () {
		this.hotIssue();
	},
	// 获取热门问题
	hotIssue () {
		util.showLoading();
		let params = {
			num: this.data.num
		};
		util.getDataFromServer('consumer/system/help/get-hot-question-list', params, () => {
			util.showToastNoIcon('获取问题列表失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					topSearchList: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 弹出详情
	showDetail (e) {
		let content = e.currentTarget.dataset['content'];
		util.showLoading();
		let params = {
			questionId: content.id
		};
		util.getDataFromServer('consumer/system/help/get-answer-list', params, () => {
			util.showToastNoIcon('获取问题详情失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					detailsContent: res.data,
					detailsTitle: content.questionTitle,
					showDetailMask: true,
					showDetailWtapper: true
				});
				// 获取弹窗列表高度
				let fatherHeight = wx.createSelectorQuery();
				fatherHeight.select('.details-list').boundingClientRect();
				fatherHeight.exec(res => {
					this.setData({
						fatherHeight: res[0].height
					});
				});
				// 获取弹窗列表内容高度
				let childHeight = wx.createSelectorQuery();
				childHeight.select('.details-list-box').boundingClientRect();
				childHeight.exec(res => {
					this.setData({
						childHeight: res[0].height
					});
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 图片预览
	previewImage (e) {
		let url = e.currentTarget.dataset.url;
		wx.previewImage({
			current: url, // 当前显示图片的http链接
			urls: [url] // 需要预览的图片http链接列表
		});
	},
	// 关闭详情
	hide () {
		this.setData({
			showDetailWtapper: false
		});
		setTimeout(() => {
			this.setData({
				showDetailMask: false
			});
		}, 400);
	},
	// 获取问题列表
	questionList (isLoadingMore) {
		util.showLoading();
		let params = {
			page: this.data.page,
			pageSize: this.data.pageSize,
			keyword: this.data.searchContent
		};
		util.getDataFromServer('consumer/system/help/get-question-page-list', params, () => {
			// 隐藏加载中动画
			this.hideAnim(isLoadingMore);
			util.showToastNoIcon('获取问题列表失败！');
		}, (res) => {
			this.setData({
				isHot: false,
				totalPages: res.data.pages
			});
			if (res.code !== 0) {
				// 隐藏加载中动画
				this.hideAnim(isLoadingMore);
				util.showToastNoIcon(res.message);
				this.setData({
					topSearchList: []
				});
				return;
			}
			// 隐藏加载中动画
			this.hideAnim(isLoadingMore);
			if (!isLoadingMore) {
				this.setData({
					topSearchList: res.data.list
				});
			} else {
				let info = this.data.topSearchList;
				info = info.concat(res.data.list);
				this.setData({
					topSearchList: info
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
		this.questionList(false);
	},
	// 上滑分页加载
	onReachBottom () {
		if (this.data.topSearchList.length < this.data.pageSize) return;
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
		this.questionList(true);
	},
	// 搜索
	bindconfirm (e) {
		let discountName = e.detail.value['search - input'] ? e.detail.value['search - input'] : e.detail.value;
		this.setData({
			searchContent: discountName
		});
		this.questionList(false);
	}
});
