const util = require('../../../utils/util.js');
Page({
	data: {
		dropDownMenuTitle: ['全部车辆', ''],
		dates: '2019-2',
		timeList: [
			{
				id: '0',
				title: '',
				childModel: [
					{ id: '0-1', title: '1月' },
					{ id: '0-2', title: '2月' },
					{ id: '0-3', title: '3月' },
					{ id: '0-4', title: '4月' },
					{ id: '0-5', title: '5月' },
					{ id: '0-6', title: '6月' },
					{ id: '0-7', title: '7月' },
					{ id: '0-8', title: '8月' },
					{ id: '0-9', title: '9月' },
					{ id: '0-10', title: '10月' },
					{ id: '0-11', title: '11月' },
					{ id: '0-12', title: '12月' }
				]
			},
			{
				id: 1,
				title: '',
				childModel: [
					{ id: '1-1', title: '1月' },
					{ id: '1-2', title: '2月' },
					{ id: '1-3', title: '3月' },
					{ id: '1-4', title: '4月' },
					{ id: '1-5', title: '5月' },
					{ id: '1-6', title: '6月' },
					{ id: '1-7', title: '7月' },
					{ id: '1-8', title: '8月' },
					{ id: '1-9', title: '9月' },
					{ id: '1-10', title: '10月' },
					{ id: '1-11', title: '11月' },
					{ id: '1-12', title: '12月' }
				]
			},
			{
				id: 2,
				title: '',
				childModel: [
					{ id: '2-1', title: '1月' },
					{ id: '2-2', title: '2月' },
					{ id: '2-3', title: '3月' },
					{ id: '2-4', title: '4月' },
					{ id: '2-5', title: '5月' },
					{ id: '2-6', title: '6月' },
					{ id: '2-7', title: '7月' },
					{ id: '2-8', title: '8月' },
					{ id: '2-9', title: '9月' },
					{ id: '2-10', title: '10月' },
					{ id: '2-11', title: '11月' },
					{ id: '2-12', title: '12月' }
				]
			}
		],
		vehicleList: [
			{id: 0, title: '全部车辆'},
			{id: 1, title: '贵A6HG01'},
			{id: 2, title: '贵A6HG02'},
			{id: 3, title: '贵A6HG03'}
		],
		year: ''
	},
	onLoad () {
		let date = new Date();
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		this.setData({
			[`dropDownMenuTitle[1]`]: `${year}年${month}月`,
			[`timeList[0].title`]: `${year - 2}年`,
			[`timeList[1].title`]: `${year - 1}年`,
			[`timeList[2].title`]: `${year}年`,
			year: `${year}`
		});
	},
	// 账单详情
	go () {
		util.go('/pages/personal_center/order_details/order_details');
	},
	// 下拉选择
	selectedItem (e) {
		if (e.detail.selectedTitle.search('月') === -1) {
			console.log('id --' + e.detail.selectedId + 'val =' + e.detail.selectedTitle);
		} else {
			const month = e.detail.selectedId.match(/-(\S*)/)[1];
			const year = e.detail.selectedId.match(/(\S*)-/)[1];
			if (parseInt(year) === 0) {
				console.log(`当前选择: ${this.data.year - 2}年${month}月`);
			} else if (parseInt(year) === 1) {
				console.log(`当前选择: ${this.data.year - 1}年${month}月`);
			} else {
				console.log(`当前选择: ${this.data.year}年${month}月`);
			}
		}
	}
});
