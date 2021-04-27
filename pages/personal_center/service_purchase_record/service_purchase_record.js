const util = require('../../../utils/util.js');
Page({
	data: {
		tabIndex: 0,
		vehicleList: ['贵AF2344', '贵AF2345', '贵AF2346', '贵AF2347', '贵AF2348', '贵AF2349'],
		list: ['', '', '', '', '']
	},
	onLoad (options) {
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
