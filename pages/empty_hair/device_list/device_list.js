const util = require('../../../utils/util.js');
// 设备列表
const app = getApp();
Page({
	data: {
		mask: false,
		wrapper: false,
		deviceList: [{}, {}],
		activeIndex: -1
		// deviceList: app.globalData.emptyHairDeviceList.noActiveOrders
	},
	onLoad () {
		if (!app.globalData.emptyHairDeviceList?.activeOrders?.length) {
			this.setData({
				mask: true,
				wrapper: true
			});
		}
		const list = [
			{key: '1234124124514'},
			{key: '1234124124514'}
		];
		const slicingLength = 4;
		list.map((item, index) => {
			let strArr = [];
			for (let i = 0; i < item.key.length; i += slicingLength) {
				strArr.push(item.key.slice(i,i + slicingLength));
			}
			item.newKey = strArr.join(' ');
		});
		console.log(list);
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
	
	}
});
