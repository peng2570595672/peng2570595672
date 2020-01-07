const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		showAddCoupon: false,// 控制显示兑换码弹窗
		showSuccessful: false,// 控制显示兑换码弹窗
		isEffective: true,// 查看有效&无效电子券
		listHeight: '',// 卡券列表高度
		bottomHeight: '',// 底部查看电子券高度
		windowHeight: '',// 屏幕高度
		exchangeCode: '',// 兑换码
		exchangeData: '',// 兑换数据
		list: [
			{}
		]
	},
	onLoad () {
		this.getCardVoucherList();
		let listHeight = wx.createSelectorQuery();
		listHeight.select('.list-box').boundingClientRect();
		listHeight.exec(res => {
			console.log(res[0].height);
			this.setData({
				listHeight: res[0].height
			});
		});
		let bottomHeight = wx.createSelectorQuery();
		bottomHeight.select('.check-overdue').boundingClientRect();
		bottomHeight.exec(res => {
			console.log(res[0].height);
			this.setData({
				bottomHeight: res[0].height
			});
		});
		this.setData({
			windowHeight: wx.getSystemInfoSync().windowHeight
		});
	},
	// 获取卡券列表
	getCardVoucherList () {
		util.showLoading();
		let params = {
			status: this.data.isEffective === true ? 'usable' : 'notUsable'
		};
		util.getDataFromServer('consumer/voucher/get-coupon-page-list', params, () => {
			util.showToastNoIcon('获取问题列表失败！');
		}, (res) => {
			res.data.list.forEach((item,i) => {
				item.expireTime = item.expireTime.match(/(\S*) /)[1];
			});
			if (res.code === 0) {
				this.setData({
					list: res.data.list
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
			showAddCoupon: true
		});
	},
	// 关闭弹窗
	close () {
		this.setData({
			showAddCoupon: false,
			showSuccessful: false
		});
	},
	// 查看有效&无效电子券
	checkVoucher () {
		this.setData({
			isEffective: !this.data.isEffective
		});
		this.getCardVoucherList();
	},
	// 查看详情
	go () {
		util.go('/pages/personal_center/use_record/use_record');
	},
	// 照相机扫码识别兑换码
	getExchangeCodeFromScan () {
		// 只允许从相机扫码
		wx.scanCode({
			onlyFromCamera: true,
			success: (res) => {
				console.log(res);
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
	// 立即兑换
	exchange () {
		if (!this.data.exchangeCode) {
			return;
		}
		util.showLoading();
		let params = {
			mobilePhone: app.globalData.userInfo.mobilePhone,
			activateCode: this.data.exchangeCode
		};
		util.getDataFromServer('consumer/voucher/activate-coupon', params, () => {
			util.showToastNoIcon('获取问题列表失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					exchangeData: res.data
				});
				this.setData({
					showAddCoupon: false,
					showSuccessful: true
				});
				this.getCardVoucherList();
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	}
});
