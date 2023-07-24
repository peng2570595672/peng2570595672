const util = require('../../utils/util.js');
const app = getApp();
Component({
	options: {
		multipleSlots: true // 在组件定义时的选项中启用多slot支持
	},
	properties: {
	},

	data: {
		dialogContent: {},
		mask: false,
		boxHeight: 0,
		wrapper: false
	},
	methods: {
		ok (e) {
			this.triggerEvent('onHandle');
		},
		show (info) {
			if (info.text) {
				info.text = info.text.replace(/<img([\s\w"-=\/\.:;]+)/ig, '<img$1 class="img"');
			}
			this.setData({
				dialogContent: info,
				mask: true,
				wrapper: true
			});
			// const that = this;
			// setTimeout(() => {
			// 	let query = wx.createSelectorQuery();
			// 	query.in(this).select('#alertBox').boundingClientRect(rect => {
			// 		const windowHeight = app.globalData.screenWindowAttribute.windowHeight;
			// 		let height = rect.height * 4;
			// 		height = height > windowHeight ? windowHeight : height;
			// 		that.setData({
			// 			boxHeight: height
			// 		});
			// 	}).exec();
			// }, 1000);
		},
		hide (e,flag) {
			if (this.data.dialogContent.alertType === 99) {
				util.go(`/pages/account_management/pay_method/pay_method?orderId=${this.data.dialogContent.orderId}`);
			}
			this.setData({
				wrapper: false
			});
			setTimeout(() => {
				this.setData({
					mask: false
				});
				this.triggerEvent('cancelHandle');
			}, 400);
		}
	}
});
