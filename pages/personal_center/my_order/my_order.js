const util = require('../../../utils/util.js');
Page({
	data: {
		dropDownMenuTitle: ['111', '全部车辆', ],
		data1: [
			{
				id: 0, title: '不限',
				childModel: [
					{ id: '0-1', title: '11' },
					{ id: '0-2', title: '22' }]
			},
			{
				id: 1, title: '444',
				childModel: [
					{ id: '1-1', title: '333' },
					{ id: '1-2', title: '555' }]
			},
			{
				id: 2, title: '555',
				childModel: [
					{ id: '2-1', title: '444' },
					{ id: '2-2', title: 'qqq' }]
			},
			{
				id: 3, title: '333',
				childModel: [
					{ id: '3-1', title: 'fggg' },
					{ id: '3-2', title: 'hhh' }]
			}
		],
		data2: [
			{id: 0, title: '全部车辆'},
			{id: 1, title: '贵A6HG01'},
			{id: 2, title: '贵A6HG02'},
			{id: 3, title: '贵A6HG03'},
		],
	},
	onLoad() {
		let date = new Date();
		this.formatTime(date);
		console.log(this.formatTime(date))
		this.setData({
			[ 'dropDownMenuTitle[0]']:this.formatTime(date)
		})
		this.setData({
			// dropDownMenuTitle: options.id ? options.id : '', // 车辆信息id
		});
	},
	formatTime(date) {
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		return `${year}年${month}月`;
	},
	selectedItem: function (e) {
		console.log(e)
		// console.log('id --' + e.detail.selectedId + "cityname = " + e.detail.selectedTitle);
	},
});
