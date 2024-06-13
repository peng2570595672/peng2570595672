const app = getApp();
const util = require('../../../../utils/util.js');
Page({
	data: {
		list: [ // deviceType 0-插卡 1-单片
			{name: '铭创（无卡式）', deviceType: 1,subTitle: '质保3年/高速通行95折', img: 'https://file.cyzl.com/g001/M01/DD/02/oYYBAGRd25yAePUUAAACak0wmzQ186.png',url: 'bootstrap_example'}
		],
		activeIndex: -1
	},

	onLoad (options) {

	},

	onShow () {

	},

	handleDeviceType (e) {
		const index = +e.currentTarget.dataset.index;
		this.setData({
			activeIndex: index
		});
		let url = this.data.list[index].url;
		this.fangDou(() => {
			util.go(`/pages/after_sales/device_switch_peocess/${url}/${url}`);
		},500);
	},

	fangDou (fn, time) {
		let that = this;
		return (function () {
			if (that.data.timeout) {
				clearTimeout(that.data.timeout);
			}
			that.data.timeout = setTimeout(() => {
				fn.apply(this, arguments);
			}, time);
		})();
	}

});
