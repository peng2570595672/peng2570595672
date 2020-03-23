const util = require('../../../utils/util.js');
const app = getApp();
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
Page({
	data: {
		tabIndex: 0,// tab下标
		tabTitle: [],// tab列表
		totalPages: '',// 总页数
		page: 1,// 当前页
		pageSize: 5,// 每页多少条数据
		classifyId: '',// 问题分类id
		tabList: '',// 问题列表
		showDetailMask: false,// 弹窗
		showDetailWtapper: false,// 弹窗
		showScroll: false,// 弹窗内容是否显示底部滚动盒子
		detailsContent: '',// 问题详情内容
		detailsTitle: '',// 问题详情标题
		fatherHeight: '',// 弹窗列表高度
		childHeight: ''// 弹窗列表内容高度
	},
	onShow () {
		this.questionClassification();
	},
	// 获取问题分类列表
	questionClassification () {
		util.showLoading();
		util.getDataFromServer('consumer/system/help/get-classify-list', {}, () => {
			util.showToastNoIcon('获取问题分类列表失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					tabTitle: res.data,
					classifyId: res.data[0].id
				});
				this.questionList();
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
	// 获取问题列表
	questionList () {
		util.showLoading();
		let params = {
			page: this.data.page,
			pageSize: this.data.pageSize,
			classifyId: this.data.classifyId // 问题分类id
		};
		util.getDataFromServer('consumer/system/help/get-question-page-list', params, () => {
			util.showToastNoIcon('获取问题列表失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					tabList: res.data.list,
					totalPages: res.data.pages
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 去搜索
	goSearch () {
		util.go('/pages/personal_center/search_help/search_help');
	},
	// tab切换
	tab (e) {
		let index = e.currentTarget.dataset['index'];
		let id = e.currentTarget.dataset['id'];
		index = parseInt(index);
		this.setData({
			tabIndex: index,
			classifyId: id
		});
		this.questionList();
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
	// 换一批
	replace () {
		// 统计点击事件
		mta.Event.stat('022',{});
		if (this.data.page < this.data.totalPages) {
			this.setData({
				page: this.data.page + 1
			});
		} else {
			this.setData({
				page: 1
			});
		}
		this.questionList();
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
	// 售后
	goAfterSales () {
		util.showToastNoIcon('功能升级中，请联系在线客服处理售后！');
	},
	// 在线客服
	goOnlineServer () {
		util.go(`/pages/web/web/web?type=online_customer_service`);
	}
});
