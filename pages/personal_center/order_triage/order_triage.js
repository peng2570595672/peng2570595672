const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		test: 'gggg'
	},

	onLoad (options) {

	},
	onShow () {

	},
	go (e) {
		let that = this;
		let url = e.currentTarget.dataset.url;
		console.log(url);
		// 避免重复点击触发
		util.fangDou(this,() => {
			util.go(`/pages/personal_center/${url}/${url}?test=${that.data.test}`);
		},1000);
	}
});
