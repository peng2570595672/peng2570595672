const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		totalPages: 0,// 总条数
		page: 1,// 当前页
		pageSize: 10,// 每页多少条数据
		showAddCoupon: false,// 控制显示兑换码弹窗
		showActivateCoupon: false,// 控制显示激活卡券弹窗
		verificationCode: '',// 短信验证码
		showSuccessful: false,// 控制显示兑换码弹窗
		checkEffective: ['usable', 'used', 'notUsable'],// 查看有效&无效电子券
		listHeight: '',// 卡券列表高度
		windowHeight: '',// 屏幕高度
		exchangeCode: '',// 兑换码
		exchangeData: '',// 兑换数据
		time: 59,// 倒计时
		identifyingCode: undefined,// 获取验证码文字
		recordsId: '',// 卡券id
		isCountDowning: false, // 是否处于倒计时中
		currentTab: 0,
		mobilePhone: undefined,
		cardVoucherStatus: [
			{name: '可使用'},
			{name: '已使用'},
			{name: '已过期'}
		],
		list: [],
		topCouponList: [
			// couponType 劵类型  1-通行劵 2-停车卷 3-加油券 4-充电券 5-洗车券 6-通用券 7-商品消费券
			{type: 1,name: '通行劵'},
			// {type: 2,name: '停车卷'},
			// {type: 3,name: '加油券'},
			// {type: 4,name: '充电券'},
			{type: 5,name: '洗车券'}
			// {type: 6,name: '通用券'},
			// {type: 7,name: '商品消费券'}
		],
		activeIndex: 0
	},
	async onLoad () {
		// 查询是否欠款
		await util.getIsArrearage();
	},
	onShow () {
		this.setData({
			list: []
		});
		if (this.data.activeIndex === 0) {
			this.getCardVoucherList(this.data.checkEffective[this.data.currentTab]);
		} else {
			this.getCouponInfo(this.data.currentTab === 2 ? 0 : this.data.currentTab);
		}
	},
	onPullDownRefresh () {
		setTimeout(() => {
			wx.stopPullDownRefresh();
		},3000);
	},
	// 上滑分页加载
	onReachBottom () {
		if (this.data.list.length < this.data.pageSize) return;
		this.setData({
			page: ++this.data.page
		});
		if (this.data.list.length >= this.data.totalPages) {
			this.setData({
				page: --this.data.page
			});
			return;
		}
		if (this.data.activeIndex === 0) {
			this.getCardVoucherList(this.data.checkEffective[this.data.currentTab]);
		} else {
			this.getCouponInfo(this.data.currentTab === 2 ? 0 : this.data.currentTab);
		}
	},
	//  tab切换逻辑
	switchCardVoucherStatus (e) {
		let that = this;
		if (this.data.currentTab === e.target.dataset.current) {
			return false;
		} else {
			that.setData({
				list: [],
				currentTab: e.target.dataset.current,
				page: 1
			});
			if (this.data.activeIndex === 0) {
				that.getCardVoucherList(this.data.checkEffective[this.data.currentTab]);
			} else {
				this.getCouponInfo(this.data.currentTab === 2 ? 0 : this.data.currentTab);
			}
		}
	},
	// 获取卡券列表
	getCardVoucherList (key) {
		util.showLoading();
		let params = {
			status: key,
			page: this.data.page,
			pageSize: this.data.pageSize
		};
		util.getDataFromServer('consumer/voucher/get-coupon-page-list', params, () => {
			util.showToastNoIcon('获取卡券列表失败！');
		}, (res) => {
			// res.data.list.forEach((item,i) => {
			// 	item.expireTime = item.expireTime.match(/(\S*) /)[1];
			// });
			if (res.code === 0) {
				this.setData({
					list: this.data.list.concat(res.data.list),
					totalPages: res.data.total
				});
				if (res.data.list.length > 0) {
					let listHeight = wx.createSelectorQuery();
					listHeight.select('.list-box').boundingClientRect();
					listHeight.exec(res => {
						this.setData({
							listHeight: res[0].height
						});
					});
				}
				this.setData({
					windowHeight: wx.getSystemInfoSync().windowHeight,
					mobilePhone: app.globalData.userInfo.mobilePhone
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 添加卡券弹窗
	addCoupon () {
		this.setData({
			showAddCoupon: true,
			exchangeCode: ''
		});
	},
	// 激活卡券弹窗
	activateCoupon (e) {
		let id = e.currentTarget.dataset.id;
		this.setData({
			recordsId: id
		});
		// 如果处于倒计时中，不重新获取
		if (!this.data.isCountDowning) {
			this.clickGetCode();
		} else {
			this.setData({
				showActivateCoupon: true
			});
		}
	},
	clickGetCode () {
		// 如果处于倒计时中，不重新获取
		if (this.data.isCountDowning) {
			util.showToastNoIcon(`请${this.data.time}秒后再试`);
			return;
		}
		util.showLoading();
		let params = {
			mobilePhone: app.globalData.userInfo.mobilePhone,
			recordsId: this.data.recordsId
		};
		util.getDataFromServer('consumer/voucher/send-activate-code', params, () => {
			util.showToastNoIcon('发送验证码失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					showActivateCoupon: true
				});
				this.countDown();
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 立即激活
	activateNow () {
		if (!this.data.verificationCode) {
			util.showToastNoIcon('请输入验证码！');
			return;
		}
		util.showLoading();
		let params = {
			mobilePhone: app.globalData.userInfo.mobilePhone,
			code: this.data.verificationCode,
			recordsId: this.data.recordsId
		};
		util.getDataFromServer('consumer/voucher/activate-records-by-phone-code', params, () => {
			util.showToastNoIcon('激活失败！');
		}, (res) => {
			if (res.code === 0) {
				this.close();
				app.globalData.serviceCardVoucherDetails = res.data;
				util.go(`/pages/personal_center/service_card_voucher_details/service_card_voucher_details`);
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 倒计时
	countDown () {
		this.setData({
			isCountDowning: true
		});
		let timer = null;
		if (timer) {
			clearInterval(timer);
		}
		timer = setInterval(() => {
			this.setData({
				time: --this.data.time
			});
			if (this.data.time === 0) {
				clearInterval(timer);
				this.setData({
					time: 59,
					identifyingCode: '重新获取',
					isCountDowning: false
				});
			} else {
				this.setData({
					identifyingCode: `${this.data.time}S`
				});
			}
		}, 1000);
	},
	// 关闭弹窗
	close () {
		this.setData({
			showActivateCoupon: false,
			showAddCoupon: false,
			showSuccessful: false
		});
	},
	// 查看详情
	go (e) {
		app.globalData.serviceCardVoucherDetails = e.currentTarget.dataset.model;
		util.go(`/pages/personal_center/service_card_voucher_details/service_card_voucher_details?isTonXinQuan=${this.data.activeIndex === 0}`);
	},
	// 照相机扫码识别兑换码
	getExchangeCodeFromScan () {
		// 只允许从相机扫码
		wx.scanCode({
			onlyFromCamera: true,
			success: (res) => {
				this.setData({
					exchangeCode: res.result
				});
			},
			fail: (res) => {
				if (res.errMsg !== 'scanCode:fail cancel') {
					util.showToastNoIcon('扫码失败');
				}
			}
		});
	},
	// 输入兑换码
	exchangeCodeValueChange (e) {
		this.setData({
			exchangeCode: e.detail.value.trim()
		});
	},
	// 输入验证码
	exchangeVerificationCodeChange (e) {
		this.setData({
			verificationCode: e.detail.value.trim()
		});
	},
	// 立即兑换
	exchange () {
		if (!this.data.exchangeCode) {
			util.showToastNoIcon('请输入兑换码！');
			return;
		}
		util.showLoading();
		let exchangeCode = this.data.exchangeCode;
		exchangeCode = exchangeCode.toUpperCase();
		let params = {
			mobilePhone: app.globalData.userInfo.mobilePhone,
			activateCode: exchangeCode
		};
		util.getDataFromServer('consumer/voucher/activate-coupon', params, () => {
			util.showToastNoIcon('获取兑换码失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					exchangeData: res.data
				});
				this.setData({
					showAddCoupon: false,
					showSuccessful: true
				});
				if (this.data.activeIndex === 0) {
					this.getCardVoucherList(this.data.checkEffective[this.data.currentTab]);
				} else {
					this.getCouponInfo(this.data.currentTab === 2 ? 0 : this.data.currentTab);
				}
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 顶部券类型的选择
	changeCoupon (e) {
		let index = e.currentTarget.dataset.index;
		let type = e.currentTarget.dataset.type;
		let flag = index === this.data.activeIndex;
		if (!flag && type === 1) {
			this.setData({activeIndex: index,list: [],page: 1});
			this.getCardVoucherList(this.data.checkEffective[this.data.currentTab]);
		}
		if (!flag && type === 5) {
			this.setData({activeIndex: index,list: [],page: 1,currentTab: this.data.currentTab === 2 ? 0 : this.data.currentTab});
			this.getCouponInfo(this.data.currentTab);
		}
	},
	// 获取券包信息
	getCouponInfo (obj) {
		util.showLoading();
		let params = {
			useState: obj,
			couponType: this.data.topCouponList[this.data.activeIndex].type,
			page: this.data.page,
			pageSize: this.data.pageSize
		};
		util.getDataFromServer('consumer/voucher/get-third-coupon-page-list', params, () => {
			util.showToastNoIcon('获取卡券列表失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					list: this.data.list.concat(res.data.list),
					totalPages: res.data.total
				});
				if (res.data.list.length > 0) {
					let listHeight = wx.createSelectorQuery();
					listHeight.select('.list-box').boundingClientRect();
					listHeight.exec(res => {
						this.setData({
							listHeight: res[0].height
						});
					});
				}
				this.setData({
					windowHeight: wx.getSystemInfoSync().windowHeight,
					mobilePhone: app.globalData.userInfo.mobilePhone
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	// 跳转小兔详情
	goXiaoTu (e) {
		util.showLoading();
		let item = e.currentTarget.dataset.item;
		let params = {
			recordId: item.recordId
		};
		util.getDataFromServer('consumer/voucher/xiaotu-washcar/auto-login', params, () => {
			util.showToastNoIcon(res.message);
		}, (res) => {
			if (res.code === 0) {
				util.go(`/pages/web/web/web?url=${encodeURIComponent(res.data.url)}`);
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	}
});
