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
	onLoad () {
		if (app.globalData.systemTime) {
			this.setData({
				currentTime: app.globalData.systemTime * 1000
			});
		} else {
			this.setData({
				currentTime: new Date().getTime()
			});
		}
		this.setData({
			vehicleList: app.globalData.rightsAndInterestsVehicleList,
			vehicle: app.globalData.rightsAndInterestsVehicleList[1]
		});
		this.getCouponList();
	},
	onShow () {
	},
	openConfirm (e) {
		let instructions = e.currentTarget.dataset.instructions;
		let popupContent = {
			title: '使用说明',
			content: instructions,
			confirm: '我知道了'
		};
		this.setData({
			popupContent
		});
		this.selectComponent('#instructions').show();
	},
	tapDialogButton () {
		this.setData({
			dialogShow: false
		});
	},
	getCouponList () {
		util.showLoading();
		util.getDataFromServer('consumer/voucher/rights/get-coupon-list', {
			orderId: this.data.vehicle.orderId
		}, () => {
			util.showToastNoIcon('获取权益列表失败！');
		}, (res) => {
			if (res.code === 0) {
				const compare = (key) => {
					return (obj1, obj2) => {
						let value1 = obj1[key];
						let value2 = obj2[key];
						return value1 - value2;
					};
				};
				res.data.sort(compare('stage'));
				res.data.map((item, index) => {
					item.status = util.isTimeQuantum(item.coupons[0].validityStartTime.substring(0, 16), item.coupons[0].validityEndTime.substring(0, 16));
					if (item.status === 1) {
						this.setData({
							openIndex: index
						});
					}
					item.coupons.map(it => {
						it.couponsStatus = item.status;
					});
				});
				const arr = res.data.slice(0, this.data.openIndex);
				res.data.splice(0, this.data.openIndex);
				res.data.push(...arr);
				this.setData({
					couponList: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	currentChange (e) {
		this.setData({
			tabIndex: e.detail.current
		});
	},
	onClickTheCoupons (e) {
		let item = e.currentTarget.dataset.item;
		if (item.isReceive === 1) {
			// 已领取
			util.go(`/pages/personal_center/service_card_voucher/service_card_voucher`);
			return;
		}
		if ((item.isReceive === 0 && item.couponsStatus === 0) || item.isReceive === 1) return;
	},
	onClickReceive (e) {
		let item = e.currentTarget.dataset.item;
		let index = e.currentTarget.dataset.index;
		if ((item.isReceive === 0 && item.couponsStatus === 0) || item.isReceive === 1) return;
		util.showLoading('领取中');
		util.getDataFromServer('consumer/voucher/rights/active-by-couponId', {
			couponId: item.recordId
		}, () => {
			util.showToastNoIcon('领取失败！');
		}, (res) => {
			if (res.code === 0) {
				util.showToastNoIcon(`${item.couponType === 1 ? '已领取至个人中心-优惠券' : '已领取至个人微信-卡包'}`);
				this.data.couponList[this.data.tabIndex].coupons[index].isReceive = 1;
				this.setData({
					couponList: this.data.couponList
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
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
