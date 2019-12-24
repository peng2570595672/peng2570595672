const util = require('../../../utils/util.js');
Page({
	data: {
		showAddCoupon: false,// 控制显示兑换码弹窗
		showSuccessful: false,// 控制显示兑换码弹窗
		isEffective: true,// 查看有效&无效电子券
		list: [
			{}
		]
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
	}
});
