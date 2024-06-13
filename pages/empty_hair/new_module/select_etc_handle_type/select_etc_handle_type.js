const app = getApp();
const util = require('../../../../utils/util.js');
Page({

	data: {
		isNewTrucks: 0	// 0：客车; 1：货车
	},

	onLoad (options) {

	},

	onShow () {

	},

	// 跳转
	go (e) {
		let type = +e.currentTarget.dataset['type'];
		// let url = type ? '' : '';
		util.go(`/pages/empty_hair/new_module/input_obu_card_number/input_obu_card_number`);
	},

	onUnload () {

	}

});
