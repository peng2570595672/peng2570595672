const util = require('../../../utils/util.js');
Page({
	data: {
		showAddCoupon: false,// 控制显示兑换码弹窗
		showSuccessful: false,// 控制显示兑换码弹窗
		isEffective: true,// 查看有效&无效电子券
		listHeight: '',// 卡券列表高度
		bottomHeight: '',// 底部查看电子券高度
		windowHeight: '',// 屏幕高度
		list: [
			{}
		]
	},
	onLoad () {
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
			},
			fail: (res) => {
				if (res.errMsg !== 'scanCode:fail cancel') {
					util.showToastNoIcon('扫码失败');
				}
			}
		});
	},
	// 立即兑换
	exchange () {
		this.setData({
			showAddCoupon: false,
			showSuccessful: true
		});
	},
	// 放入卡包
	goPackage () {
		this.setData({
			showSuccessful: false
		});
	}
});
