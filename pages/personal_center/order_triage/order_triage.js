const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {

	},

	onLoad (options) {

	},
	onShow () {

	},
	go (e) {
		let that = this;
		let url = e.currentTarget.dataset.url;
		if (url === 'road_rescue') {
			util.go(`/pages/road_rescue_orders/road_rescue/road_rescue`);
			return;
		}
		// 避免重复点击触发
		util.go(`/pages/personal_center/${url}/${url}?test=${that.data.test}`);
	}
});
