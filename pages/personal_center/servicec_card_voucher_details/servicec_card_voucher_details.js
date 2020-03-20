const util = require('../../../utils/util.js');
Page({
	data: {
		isShowSwitchElaborate: false,
		details: ''
	},
	onLoad (options) {
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
		let bgHex = this.colorRGB2Hex(this.data.details.background)
		wx.setNavigationBarColor({
			frontColor: '#000000',
			backgroundColor: bgHex
		});
	},
	// rgb转16进制
	colorRGB2Hex(color) {
		let rgb = color.split(',');
		let r = parseInt(rgb[0].split('(')[1]);
		let g = parseInt(rgb[1]);
		let b = parseInt(rgb[2].split(')')[0]);
		let hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
		return hex;
	},
	// 显示使用说明
	switchElaborate () {
		this.setData({
			isShowSwitchElaborate: !this.data.isShowSwitchElaborate
		});
	}
});
