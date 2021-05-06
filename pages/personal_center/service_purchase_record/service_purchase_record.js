const util = require('../../../utils/util.js');
const app = getApp();
Page({
	data: {
		tabIndex: 0,
		rightsPackageBuyRecords: []
	},
	onLoad (options) {
		this.setData({
			rightsPackageBuyRecords: app.globalData.rightsPackageBuyRecords
		});
	},
	// tab切换
	onClickTab (e) {
		let index = e.currentTarget.dataset['index'];
		index = parseInt(index);
		this.setData({
			tabIndex: index
		});
	}
});
