/**
 * @author 狂奔的蜗牛
 * @desc 我的ETC
 */
const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		carList: undefined
	},
	onShow () {
		this.getMyETCList();
	},
	getMyETCList () {
		util.showLoading();
		util.getDataFromServer('consumer/order/my-etc-list', {

		}, () => {
			util.showToastNoIcon('获取车辆列表失败！');
		}, (res) => {
			if (res.code === 0) {
				this.setData({
					carList: res.data
				});
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			util.hideLoading();
		});
	},
	//	查看详情
	goDetails () {
		util.go('/pages/personal_center/my_etc_details/my_etc_details');
	},
	// 免费办理
	newVehicle () {
		util.go('/pages/default/receiving_address/receiving_address');
	},
	// 查看进度
	onClickViewProcessingProgressHandle (e) {
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		app.globalData.orderInfo.orderId = obj.id;
		util.go('/pages/default/processing_progress/processing_progress');
	},
	// 继续办理
	onClickContinueHandle (e) {
		let index = e.currentTarget.dataset.index;
		let obj = this.data.carList[parseInt(index)];
		// 服务商套餐id，0表示还未选择套餐，其他表示已经选择套餐
		// 只提交了车牌 车牌颜色 收货地址 前往套餐选择
		if (obj.shopProductId === 0) {
			app.globalData.orderInfo.orderId = obj.id;
			util.go('/pages/default/payment_way/payment_way');
		} else if (obj.isVehicle === 0) {
			// 是否上传行驶证， 0未上传，1已上传
			app.globalData.orderInfo.orderId = obj.id;
			util.go('/pages/default/photo_recognition_of_driving_license/photo_recognition_of_driving_license');
		}
	},
	// 新增
	onClickAddNewHandle () {
		app.globalData.orderInfo.orderId = '';
		util.go('/pages/default/receiving_address/receiving_address');
	}
});
