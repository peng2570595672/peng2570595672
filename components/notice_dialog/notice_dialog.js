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
			if (this.data.dialogContent.alertType === 100) {
				this.toSign();
			}
			if (this.data.dialogContent.alertType === 99) {
				util.go(`/pages/account_management/pay_method/pay_method?orderId=${this.data.dialogContent.orderId}`);
			}
			if (this.data.dialogContent.alertType === 101) {
				// 签约
				this.triggerEvent('Confirm', this.data.dialogContent);
			}
			this.hide();
		},
		// 去签约
		toSign () {
			let data = this.data.dialogContent.sysPlatform;
			if (!data) return util.showToastNoIcon('无签约数据');
			const path = `pages/personal_center/my_etc_detail/my_etc_detail?orderId=${app.globalData.orderInfo.orderId}`;
			if (data.appId !== 'wxddb3eb32425e4a96') {
				let params = {
					appId: data.appId,
					path: path,
					extraData: {},
					envVersion: 'release',
					fail: () => {
						util.showToastNoIcon('打开小程序失败');
					}
				};
				wx.uma.trackEvent('index_contracted_vehicle_owner_service');
				// TEST CODE
				console.log('跳转目标签约小程序: ', params);
				wx.navigateToMiniProgram(params);
			} else {
				util.go(`/${path}`);
			}
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
