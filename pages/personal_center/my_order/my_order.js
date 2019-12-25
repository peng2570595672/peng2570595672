const util = require('../../../utils/util.js');
Page({
	data: {
		year: '',
		dropDownMenuTitle: ['', ''],
		timeList: [],
		childModel: [
			{ id: '1-1', title: '1' },
			{ id: '1-2', title: '2' },
			{ id: '1-3', title: '3' },
			{ id: '1-4', title: '4' },
			{ id: '1-5', title: '5' },
			{ id: '1-6', title: '6' },
			{ id: '1-7', title: '7' },
			{ id: '1-8', title: '8' },
			{ id: '1-9', title: '9' },
			{ id: '1-10', title: '10' },
			{ id: '1-11', title: '11' },
			{ id: '1-12', title: '12' }
		],
		list: [],
		vehicleList: ['贵ZZZABC', '贵ZZZABF', '贵ZZZDBF'],
		chooseTime: ''
	},
	onLoad () {
		let date = new Date();
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const time = year - 2017;
		for (let i = 0; i <= time; i = i + 1) {
			for (let k = 0; k < this.data.childModel.length; k = k + 1) {
				this.data.childModel[k].id = `${i}-${k + 1}`;
				const obj = {};
				obj.id = this.data.childModel[k].id;
				obj.title = this.data.childModel[k].title;
				const h = time - i;
				this.data.list.push(obj);
				this.setData({
					list: this.data.list,
					[`timeList[${time - i}].childModel`]: this.data.list
				});
			}
			this.setData({
				list: [],
				[`timeList[${time - i}].title`]: `${year - i}年`,
				[`timeList[${time - i}].id`]: `${i}`
			});
		}
		this.setData({
			[`dropDownMenuTitle[0]`]: this.data.vehicleList[0],
			[`dropDownMenuTitle[1]`]: `${year}年${month}月`,
			year: `${year}`,
			chooseTime: `${year}-${util.formatNumber(month)}`
		});
		console.log(this.data.timeList);
	},
	// 账单详情
	goDetails () {
		util.go('/pages/personal_center/order_details/order_details');
	},
	// 去补缴
	go () {
		util.go('/pages/personal_center/payment_confirmation/payment_confirmation');
	},
	// 下拉选择
	selectedItem (e) {
		if (!e.detail.selectedId) {
			let index = this.data.vehicleList.findIndex((value) => value === e.detail.selectedTitle);
			console.log(index);
		} else {
			const month = e.detail.selectedId.match(/-(\S*)/)[1];
			const id = e.detail.selectedId.match(/(\S*)-/)[1];
			console.log(month);
			console.log(`${this.data.year - id}-${util.formatNumber(month)}`);
		}
	}
});
