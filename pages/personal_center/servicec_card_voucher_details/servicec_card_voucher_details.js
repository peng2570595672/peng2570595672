const util = require('../../../utils/util.js');
Page({
	data: {
		isShowSwitchElaborate: false,
		details: ''
	},
	onLoad (options) {
		console.log(options);
		console.log(JSON.parse(options.details).couponUseCheckList);
		this.setData({
			details: JSON.parse(options.details)
		});
		this.data.details.couponUseCheckList.map( item => {
			item.startDate = item.startDate.split(' ')[1];
			item.endDate = item.endDate.split(' ')[1];
			switch (item.weekDay) {
				case 1:
					item.weekDay = '周一';
					break;
				case 2:
					item.weekDay = '周二';
					break;
				case 3:
					item.weekDay = '周三';
					break;
				case 4:
					item.weekDay = '周四';
					break;
				case 5:
					item.weekDay = '周五';
					break;
				case 6:
					item.weekDay = '周六';
					break;
				case 7:
					item.weekDay = '周日';
					break;
			}
		});
		this.setData({
			details: this.data.details
		});
		wx.setNavigationBarColor({
			frontColor: '#000000',
			// backgroundColor: this.data.details.background
			backgroundColor: '#DF4A26'
		});
	},
	// 显示使用说明
	switchElaborate () {
		this.setData({
			isShowSwitchElaborate: !this.data.isShowSwitchElaborate
		});
	}
});
