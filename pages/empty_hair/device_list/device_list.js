const util = require('../../../utils/util.js');
// 设备列表
const app = getApp();
Page({
	data: {
		mask: false,
		wrapper: false,
		deviceList: [],
		activeIndex: -1
	},
	onLoad () {
		if (app.globalData.emptyHairDeviceList?.activeOrders?.length) {
			this.setData({
				mask: true,
				wrapper: true
			});
		}
		const slicingLength = 4;
		app.globalData.emptyHairDeviceList.noActiveOrders.map((item, index) => {
			let strEtcNo = [];
			for (let i = 0; i < item.etcNo.length; i += slicingLength) {
				strEtcNo.push(item.etcNo.slice(i,i + slicingLength));
			}
			item.newEtcNo = strEtcNo.join(' ');
			let strObuNo = [];
			for (let i = 0; i < item.obuNo.length; i += slicingLength) {
				strObuNo.push(item.obuNo.slice(i,i + slicingLength));
			}
			item.newObuNo = strObuNo.join(' ');
		});
		this.setData({
			deviceList: app.globalData.emptyHairDeviceList.noActiveOrders
		});
	},
	handleDeviceItem (e) {
		let index = e.currentTarget.dataset.index;
		this.setData({
			activeIndex: index
		});
	},
	hide () {
		this.setData({
			wrapper: false
		});
		setTimeout(() => {
			this.setData({
				mask: false
			});
		}, 400);
	},
	handleBinding () {
		if (this.data.activeIndex === -1) {
			util.showToastNoIcon('请选择您要绑定的设备');
			return;
		}
		const item = this.data.deviceList[this.data.activeIndex];
		if ((item.status === 1 && item.contractStatus) || item.auditStatus === 2) {
			util.go(`/pages/default/processing_progress/processing_progress?orderId=${item.orderId}`);
			return;
		}
		if (item.vehPlate) {
			app.globalData.orderInfo.orderId = item.orderId;
			util.go('/pages/default/information_list/information_list');
			return;
		}
		util.go(`/pages/empty_hair/basic_information/basic_information?info=${JSON.stringify(item)}`);
	}
});
