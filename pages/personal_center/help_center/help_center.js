const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		tabIndex: 0,// tab下标
		tabTitle: [],// tab列表
		totalPages: '',// 总页数
		page: 1,// 当前页
		pageSize: 5,// 每页多少条数据
		classifyId: '',// 问题分类id
		tabList: '',// 问题列表
		isActivation: false,
		isShowAgreementUpdate: false,
		showDetailMask: false,// 弹窗
		showDetailWtapper: false,// 弹窗
		showPrompt: false,// 弹窗底部提示
		showScroll: false,// 弹窗内容是否显示底部滚动盒子
		detailsContent: '',// 问题详情内容
		detailsTitle: '',// 问题详情标题
		fatherHeight: '',// 弹窗列表高度
		childHeight: ''// 弹窗列表内容高度
	},
	async onLoad () {
		// 查询是否欠款
		await util.getIsArrearage();
	},
	async onShow () {
		this.questionClassification();
		await this.getIsShow();
	},
	async getIsShow () {
		let isActivation = 1;
		if (JSON.stringify(app.globalData.myEtcList) !== '{}') {
			console.log(app.globalData.myEtcList,'------------------');
			// 以前的老条件(item.obuStatus === 1 || item.obuStatus === 5) && (item.obuCardType === 1 || item.obuCardType === 21)
			isActivation = app.globalData.myEtcList.findIndex(item => (item.obuStatus === 1 || item.obuStatus === 5)); // 1 已激活  2 恢复订单  5 预激活
			console.log(isActivation,'----------预激活预激活预激活预激活----------');
		}
		this.setData({
			isActivation: isActivation !== -1
		});
		if (this.data.isActivation) await this.queryAgreementRecord();
	},
	// 查询是否更新用户协议
	async queryAgreementRecord () {
		const result = await util.queryProtocolRecord(6);
		this.setData({
			isShowAgreementUpdate: !result
		});
	},
	async onClickAgreement () {
		if (this.data.isShowAgreementUpdate) await util.addProtocolRecord(6);
		util.go('/pages/agreement_documents/user_agreement/user_agreement');
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
			page: 1,
			tabIndex: index,
			classifyId: id
		});
		this.questionList();
	},
	// 弹出详情
	showDetail (e) {
		this.setData({
			showPrompt: false
		});
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
				setTimeout(() => {
					this.setData({
						showPrompt: this.data.childHeight > this.data.fatherHeight ? true : false
					});
				}, 400);
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 换一批
	replace () {
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
	// 监听页面滚动事件
	scroll (e) {
		this.setData({
			showPrompt: e.detail.scrollTop > 10 ? false : true
		});
	},
	// 在线客服
	goOnlineServer () {
		// 未登录
		if (!app.globalData.userInfo.accessToken) {
			wx.setStorageSync('login_info', JSON.stringify(this.data.loginInfo));
			util.go('/pages/login/login/login');
			return;
		}
		util.go(`/pages/web/web/web?type=online_customer_service`);
	}
});
