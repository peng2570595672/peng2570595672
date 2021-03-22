const util = require('../../utils/util.js');
const app = getApp();
Component({
	data: {
		mask: false,
		wrapper: false
	},
	methods: {
		// 显示或者隐藏
		show () {
			this.setData({
				mask: true,
				wrapper: true
			});
		},
		hide () {
			this.setData({
				wrapper: false
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
			}, 400);
		},
		// 点击半透明层
		onClickTranslucentHandle () {
			this.hide();
		}
	}
});
