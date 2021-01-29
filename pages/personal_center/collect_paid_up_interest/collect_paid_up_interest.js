const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		popupContent: undefined,
		dialogShow: false,
		orderId: undefined,
		vehicle: undefined,
		showVehicleList: false,
		vehicleList: [],
		couponList: [], // 权益列表
		tabIndex: 0,// tab下标
		orderId: undefined,// 订单
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
			vehicle: app.globalData.rightsAndInterestsVehicleList[0]
		});
		this.getCouponList();
	},
	onShow () {
	},
	openConfirm(e) {
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
	tapDialogButton() {
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
							tabIndex: index,
							openIndex: index
						});
					}
					item.coupons.map(it => {
						it.couponsStatus = item.status;
					});
				});
				this.setData({
					couponList: res.data,
					toview: `index${this.data.tabIndex}`
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	onClickReceive (e) {
		let id = e.currentTarget.dataset.id;
		util.showLoading('领取中');
		util.getDataFromServer('consumer/voucher/rights/active-by-couponId', {
			couponId: id
		}, () => {
			util.showToastNoIcon('领取失败！');
		}, (res) => {
			if (res.code === 0) {
				util.showToastNoIcon('领取成功！');
				this.getCouponList();
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
			tabIndex: index
		});
	},
});
