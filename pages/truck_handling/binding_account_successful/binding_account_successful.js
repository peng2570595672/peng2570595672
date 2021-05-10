/**
 * @author 老刘
 * @desc 开户成功
 */
const util = require('../../../utils/util.js');
// 数据统计
let mta = require('../../../libs/mta_analysis.js');
const app = getApp();
Page({
	data: {
		available: false, // 按钮是否可点击
		isRequest: false// 是否请求中
	},
	onShow () {
	},
	// 下一步
	next () {
		if (this.data.isRequest) {
			return;
		}
		this.setData({
			available: false, // 禁用按钮
			isRequest: true // 设置状态为请求中
		});
		mta.Event.stat('truck_for_receiving_address_next',{});
		let formData = this.data.formData; // 输入信息
		let params = {
			isNewTrucks: 1, // 货车
			orderId: app.globalData.orderInfo.orderId, // 订单id
			orderType: this.data.isOnlineDealWith ? 11 : 12,
			dataType: '12', // 需要提交的数据类型(可多选) 1:订单主表信息（车牌号，颜色）, 2:收货地址, 3:选择套餐信息（id）, 4:获取实名信息，5:获取银行卡信息
		};
		util.getDataFromServer('consumer/order/save-order-info', params, () => {
			util.showToastNoIcon('提交数据失败！');
		}, (res) => {
			if (res.code === 0) {
				app.globalData.orderInfo.orderId = res.data.orderId; // 订单id
				util.go('/pages/truck_handling/package_the_rights_and_interests/package_the_rights_and_interests');
			} else if (res.code === 301) { // 已存在当前车牌未完成订单
				util.alert({
					content: '该车牌订单已存在，请前往“首页>我的ETC”页面查看。',
					showCancel: true,
					confirmText: '去查看',
					confirm: () => {
						// 订单id
						app.globalData.orderInfo.orderId = ''; // 订单id
						util.go(`/pages/personal_center/my_etc/my_etc`);
					},
					cancel: () => {
						app.globalData.orderInfo.orderId = '';
					}
				});
			} else if (res.code === 104 && res.message === '该车牌已存在订单') {
				util.go(`/pages/default/high_speed_verification_failed/high_speed_verification_failed?carNo=${this.data.carNoStr}`);
			} else {
				util.showToastNoIcon(res.message);
			}
		}, app.globalData.userInfo.accessToken, () => {
			this.setData({
				available: true,
				isRequest: false
			});
		});
	}
});
