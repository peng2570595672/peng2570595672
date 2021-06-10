const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		popupContent: undefined,
		dialogShow: false,
		orderId: undefined,
		vehicle: undefined,
		showVehicleList: false,
		vehicleList: {},
		couponList: ['','','','','','',''], // 权益列表
		tabVehicleIndex: 0, // 车牌tab下标
		tabIndex: 0,// tab下标
		currentTime: undefined,// 系统当前时间
		openIndex: 0// 已开放对应下标
	},
	async onLoad () {
	},
	onShow () {
	},
	// 查看历史
	onClickSeeHistory () {
		util.go(`/pages/personal_center/coupon_redemption_history/coupon_redemption_history`);
	},
	async onClickReceive (e) {
		let item = e.currentTarget.dataset.item;
		let index = e.currentTarget.dataset.index;
		if ((item.isReceive === 0 && item.couponsStatus === 0) || item.isReceive === 1) return;
		const result = await util.getDataFromServersV2('consumer/voucher/rights/active-by-couponId', {
			couponId: item.recordId
		});
		if (!result) return;
		if (result.code === 0) {
			util.showToastNoIcon(`${item.couponType === 1 ? '已领取至个人中心-优惠券' : '已领取至个人微信-卡包'}`);
			this.data.couponList[this.data.tabIndex].coupons[index].isReceive = 1;
			this.setData({
				couponList: this.data.couponList
			});
		} else {
			util.showToastNoIcon(result.message);
		}
	},
	onClickVehicle () {
		if (this.data.vehicleList.length > 1) {
			this.setData({
				showVehicleList: !this.data.showVehicleList
			});
		}
	},
	choiceVehicle (e) {
		let index = e.currentTarget.dataset.index;
		this.setData({
			vehicle: this.data.vehicleList[index],
			orderId: this.data.vehicleList[index].id,
			showVehicleList: false
		});
		this.getCouponList();
	},
	// tab切换
	onClickTab (e) {
		let index = e.currentTarget.dataset['index'];
		index = parseInt(index);
		this.setData({
			vehicle: this.data.vehicleList[index],
			orderId: this.data.vehicleList[index].id,
			tabVehicleIndex: index
		});
		this.getCouponList();
	}
});
